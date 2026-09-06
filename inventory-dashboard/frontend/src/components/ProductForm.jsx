import { useState } from 'react';

function ProductForm({ initialData, onSubmit, onCancel }) {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price ?? '');
  const [stock, setStock] = useState(initialData?.stock ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.lowStockThreshold ?? 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      price: Number(price),
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3>{initialData ? 'Edit Product' : 'Add Product'}</h3>
      <div className="form-group">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Price</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" required />
      </div>
      <div className="form-group">
        <label>Stock</label>
        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" required />
      </div>
      <div className="form-group">
        <label>Low Stock Threshold</label>
        <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} min="0" />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default ProductForm;