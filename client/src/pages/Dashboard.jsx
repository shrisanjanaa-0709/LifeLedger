import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShieldCheck, AlertTriangle, ShieldAlert,
  Wrench, Plus, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/dashboard')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  if (error) return <div className="error-message">{error}</div>;

  const stats = [
    { label: 'Total Products', value: data?.totalProducts || 0, icon: Package, color: 'blue' },
    { label: 'Active Warranties', value: data?.activeWarranties || 0, icon: ShieldCheck, color: 'green' },
    { label: 'Expiring Soon', value: data?.expiringWarranties || 0, icon: AlertTriangle, color: 'orange' },
    { label: 'Expired Warranties', value: data?.expiredWarranties || 0, icon: ShieldAlert, color: 'red' }
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Your Dashboard</h1>
          <p>Keep track of your purchases and warranty protection.</p>
        </div>
        <Link to="/products" className="primary-btn">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <p>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h3>Recently Added Products</h3>
              <p>Your latest registered purchases</p>
            </div>
            <Link to="/products" className="text-link">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {data?.recentProducts?.length ? (
            <div className="recent-list">
              {data.recentProducts.map(product => (
                <div className="recent-item" key={product._id}>
                  <div className="product-symbol"><Package size={20} /></div>
                  <div className="recent-info">
                    <strong>{product.productName}</strong>
                    <small>{product.brand || product.category || 'Other'}</small>
                  </div>
                  <span className={`status-pill ${product.warrantyStatus === 'Expired' ? 'expired' : 'active'}`}>
                    {product.warrantyStatus || 'Registered'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Package size={35} />
              <h3>No products yet</h3>
              <p>Add your first purchase to start tracking warranties.</p>
              <Link to="/products" className="text-link">Add your first product</Link>
            </div>
          )}
        </div>

        <div className="panel quick-panel">
          <div className="quick-icon"><Wrench size={25} /></div>
          <h3>Keep everything organized</h3>
          <p>Record repairs, service visits and maintenance details for your products.</p>
          <Link to="/services" className="primary-btn full-btn">
            View Service History <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}