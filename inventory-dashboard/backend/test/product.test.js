const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('./testDb');

let token;

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Admin', email: 'admin@example.com', password: 'password123',
  });
  token = res.body.token;
});

describe('Products', () => {
  test('rejects product creation without a token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Widget', price: 100, stock: 10 });
    expect(res.statusCode).toBe(401);
  });

  test('rejects creation with missing required fields', async () => {
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({ name: 'Widget' });
    expect(res.statusCode).toBe(400);
  });

  test('creates a product with a valid token', async () => {
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 100, stock: 10, lowStockThreshold: 5 });
    expect(res.statusCode).toBe(201);
  });

  test('flags a product as low stock at or below threshold', async () => {
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 100, stock: 3, lowStockThreshold: 5 });
    const res = await request(app).get('/api/products/low-stock');
    expect(res.body.some((p) => p._id === createRes.body._id)).toBe(true);
  });
});