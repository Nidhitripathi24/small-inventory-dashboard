const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('./testDb');

let token;
let productId;

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

beforeEach(async () => {
  const authRes = await request(app).post('/api/auth/register').send({
    name: 'Admin', email: 'admin@example.com', password: 'password123',
  });
  token = authRes.body.token;

  const productRes = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Widget', price: 100, stock: 5, lowStockThreshold: 2 });
  productId = productRes.body._id;
});

describe('Orders', () => {
  test('creates an order and deducts stock', async () => {
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Rahul', items: [{ product: productId, quantity: 2 }] });
    expect(res.statusCode).toBe(201);
    expect(res.body.totalAmount).toBe(200);

    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.body.stock).toBe(3);
  });

  test('rejects insufficient-stock orders without touching stock', async () => {
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Rahul', items: [{ product: productId, quantity: 999 }] });
    expect(res.statusCode).toBe(400);

    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.body.stock).toBe(5);
  });

  test('rejects an illegal status jump from pending to shipped', async () => {
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Rahul', items: [{ product: productId, quantity: 1 }] });
    const res = await request(app).patch(`/api/orders/${orderRes.body._id}/status`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'shipped' });
    expect(res.statusCode).toBe(400);
  });

  test('restores stock on cancellation and blocks a second cancellation', async () => {
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'Rahul', items: [{ product: productId, quantity: 2 }] });

    const cancelRes = await request(app).patch(`/api/orders/${orderRes.body._id}/status`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    expect(cancelRes.statusCode).toBe(200);

    let productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.body.stock).toBe(5);

    const secondCancel = await request(app).patch(`/api/orders/${orderRes.body._id}/status`).set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    expect(secondCancel.statusCode).toBe(400);

    productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.body.stock).toBe(5);
  });
});