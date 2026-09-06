import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductForm from '../components/ProductForm';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddClick = () => { setEditingProduct(null); setShowForm(true); };
  const handleEditClick = (product) => { setEditingProduct(product); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, formData);
        setProducts((prev) => prev.map((p) => (p._id === editingProduct._id ? res.data : p)));
      } else {
        const res = await api.post('/products', formData);
        setProducts((prev) => [res.data, ...prev]);
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  if (loading) return <p className="state-message">Loading products...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={handleAddClick}>+ Add Product</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showForm && (
        <ProductForm
          initialData={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td data-label="Name">{product.name}</td>
                <td data-label="Price">₹{product.price}</td>
                <td data-label="Stock">{product.stock}</td>
                <td data-label="Status">
                  <span className={product.isLowStock ? 'badge badge--low' : 'badge badge--ok'}>
                    {product.isLowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td data-label="Actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(product)}>Edit</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Products;