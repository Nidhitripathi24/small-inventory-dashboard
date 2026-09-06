import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const badgeClass = {
  pending: 'badge badge--pending',
  confirmed: 'badge badge--confirmed',
  shipped: 'badge badge--shipped',
  delivered: 'badge badge--delivered',
  cancelled: 'badge badge--cancelled',
};

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.patch(`/orders/${id}/status`, { status: newStatus });
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="state-message">Loading order...</p>;
  if (error) return <p className="state-message error">{error}</p>;
  if (!order) return null;

  const allowedNext = validTransitions[order.status] || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Order #{order._id.slice(-8)}</h1>
        <Link to="/orders" className="btn btn-ghost">← Back to Orders</Link>
      </div>

      <div className="detail-card">
        <div className="detail-row"><span className="label">Customer</span> {order.customerName}</div>
        <div className="detail-row"><span className="label">Status</span> <span className={badgeClass[order.status]}>{order.status}</span></div>
        <div className="detail-row"><span className="label">Total</span> ₹{order.totalAmount}</div>
        <div className="detail-row"><span className="label">Date</span> {new Date(order.createdAt).toLocaleDateString()}</div>
      </div>

      <h2>Items</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td data-label="Product">{item.product?.name || item.product}</td>
                <td data-label="Quantity">{item.quantity}</td>
                <td data-label="Price">₹{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Change Status</h2>
      {allowedNext.length === 0 ? (
        <p className="state-message">This order is in a final state — no further changes allowed.</p>
      ) : (
        <div className="status-actions">
          {allowedNext.map((status) => (
            <button
              key={status}
              disabled={updating}
              onClick={() => handleStatusChange(status)}
              className={status === 'cancelled' ? 'btn btn-danger' : 'btn btn-primary'}
            >
              Mark as {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderDetails;