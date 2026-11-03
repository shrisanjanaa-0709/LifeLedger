
import { useEffect, useState } from 'react';
import {
  Wrench, Plus, Trash2, X, CalendarDays,
  Package, IndianRupee, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  productId: '',
  serviceDate: '',
  serviceType: 'Repair',
  description: '',
  serviceCost: ''
};

export default function Services() {
  const { apiFetch } = useAuth();

  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [serviceData, productData] = await Promise.all([
        apiFetch('/services'),
        apiFetch('/products')
      ]);
      setRecords(serviceData);
      setProducts(productData);
    } catch (err) {
      setError(err.message || 'Unable to load service history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateField = e => {
    setForm(current => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          serviceCost: Number(form.serviceCost) || 0
        })
      });

      setForm(initialForm);
      setShowForm(false);
      setSuccess('Service record added successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save service record.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async id => {
    if (!window.confirm('Delete this service record?')) return;

    try {
      await apiFetch(`/services/${id}`, { method: 'DELETE' });
      setRecords(current => current.filter(record => record._id !== id));
      setSuccess('Service record deleted successfully.');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to delete service record.');
    }
  };

  if (loading) {
    return <div className="loading">Loading service history...</div>;
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAINTENANCE RECORDS</span>
          <h1>Service History</h1>
          <p>Keep track of repairs, maintenance and service expenses.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setForm(initialForm);
            setShowForm(true);
            setError('');
            setSuccess('');
          }}
          disabled={products.length === 0}
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h3>New Service Record</h3>
              <p>Enter the details of the product service.</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => setShowForm(false)}
              type="button"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form className="product-form" onSubmit={handleSubmit}>
            <label className="wide-field">
              Select Product *
              <select
                name="productId"
                value={form.productId}
                onChange={updateField}
                required
              >
                <option value="">Choose a product</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.productName} {product.brand ? `- ${product.brand}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Service Date *
              <input
                type="date"
                name="serviceDate"
                value={form.serviceDate}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Service Type *
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={updateField}
                required
              >
                <option>Repair</option>
                <option>Maintenance</option>
                <option>Replacement</option>
                <option>Inspection</option>
                <option>Cleaning</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Service Cost (₹)
              <input
                type="number"
                name="serviceCost"
                min="0"
                value={form.serviceCost}
                onChange={updateField}
                placeholder="0"
              />
            </label>

            <label className="wide-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Describe the repair or maintenance performed..."
                rows="3"
              />
            </label>

            <div className="wide-field form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="primary-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Service Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 && (
        <div className="panel empty-state">
          <Package size={38} />
          <h3>Add a product first</h3>
          <p>You need to register a product before creating its service history.</p>
        </div>
      )}

      {records.length > 0 ? (
        <div className="service-list">
          {records.map(record => {
            const product = record.productId;
            const productName = product?.productName || 'Product unavailable';

            return (
              <div className="panel service-card" key={record._id}>
                <div className="service-card-icon">
                  <Wrench size={22} />
                </div>

                <div className="service-card-content">
                  <div className="service-card-heading">
                    <div>
                      <h3>{productName}</h3>
                      <span className="service-type">{record.serviceType}</span>
                    </div>
                    <button
                      className="icon-btn service-delete"
                      onClick={() => deleteRecord(record._id)}
                      title="Delete service record"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="service-meta">
                    <span>
                      <CalendarDays size={15} />
                      {record.serviceDate
                        ? new Date(record.serviceDate).toLocaleDateString()
                        : 'Date unavailable'}
                    </span>
                    <span>
                      <IndianRupee size={15} />
                      {Number(record.serviceCost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {record.description && (
                    <p className="service-description">{record.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : products.length > 0 ? (
        <div className="panel empty-state">
          <ClipboardList size={40} />
          <h3>No service records yet</h3>
          <p>Your repairs and maintenance history will appear here.</p>
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add First Service
          </button>
        </div>
      ) : null}
    </div>
  );
}
