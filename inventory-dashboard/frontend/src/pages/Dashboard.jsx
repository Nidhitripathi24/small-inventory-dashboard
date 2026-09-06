import { useEffect, useState } from 'react';
import api from '../services/api';

const badgeClass = {
  pending: 'badge badge--pending',
  confirmed: 'badge badge--confirmed',
  shipped: 'badge badge--shipped',
  delivered: 'badge badge--delivered',
  cancelled: 'badge badge--cancelled',
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setSummary(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <p className="state-message">Loading dashboard...</p>;
  if (error) return <p className="state-message error">{error}</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₹{summary.totalRevenue}</p>
        </div>
        <div className="stat-card stat-card--rose">
          <h3>Total Orders</h3>
          <p className="stat-value">{summary.totalOrders}</p>
        </div>
        <div className="stat-card stat-card--honey">
          <h3>Low Stock Products</h3>
          <p className="stat-value">{summary.lowStockCount}</p>
        </div>
      </div>

      <h2>Best Sellers</h2>
      {summary.bestSellers.length === 0 ? (
        <p className="state-message">No sales yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Quantity Sold</th></tr>
            </thead>
            <tbody>
              {summary.bestSellers.map((item) => (
                <tr key={item.productId}>
                  <td data-label="Product">{item.name}</td>
                  <td data-label="Quantity Sold">{item.totalQuantitySold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Recent Orders</h2>
      {summary.recentOrders.length === 0 ? (
        <p className="state-message">No orders yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {summary.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td data-label="Customer">{order.customerName}</td>
                  <td data-label="Total">₹{order.totalAmount}</td>
                  <td data-label="Status"><span className={badgeClass[order.status]}>{order.status}</span></td>
                  <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;