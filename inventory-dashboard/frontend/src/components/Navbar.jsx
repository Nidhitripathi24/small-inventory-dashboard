import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/products" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Products</NavLink>
        <NavLink to="/orders" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Orders</NavLink>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;