import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const badgeClass = {
  pending: 'badge badge--pending',
  confirmed: 'badge badge--confirmed',
  shipped: 'badge badge--shipped',
  delivered: 'badge badge--delivered',
  cancelled: 'badge badge--cancelled',
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p className="state-message">Loading orders...</p>;
  if (error) return <p className="state-message error">{error}</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td data-label="Order ID"><Link to={`/orders/${order._id}`}>{order._id.slice(-8)}</Link></td>
                <td data-label="Customer">{order.customerName}</td>
                <td data-label="Total">₹{order.totalAmount}</td>
                <td data-label="Status"><span className={badgeClass[order.status]}>{order.status}</span></td>
                <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;