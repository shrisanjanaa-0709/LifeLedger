
import { useEffect, useState } from 'react';
import {
  Package, Plus, Trash2, X, Search, CalendarDays,
  Pencil, FileUp, FileText, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  productName: '',
  brand: '',
  category: 'Electronics',
  purchaseDate: '',
  purchasePrice: '',
  warrantyStartDate: '',
  warrantyEndDate: '',
  description: ''
};

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function Products() {
  const { apiFetch } = useAuth();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const loadProducts = async () => {
    try {
      const result = await apiFetch('/products');
      setProducts(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateField = e => {
    setForm(current => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEditForm = product => {
    setForm({
      productName: product.productName || '',
      brand: product.brand || '',
      category: product.category || 'Other',
      purchaseDate: dateValue(product.purchaseDate),
      purchasePrice: product.purchasePrice ?? '',
      warrantyStartDate: dateValue(product.warrantyStartDate),
      warrantyEndDate: dateValue(product.warrantyEndDate),
      description: product.description || ''
    });
    setEditingId(product._id);
    setShowForm(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = editingId ? `/products/${editingId}` : '/products';

      await apiFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice) || 0
        })
      });

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setSuccess(editingId ? 'Product updated successfully.' : 'Product added successfully.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Are you sure you want to delete this product and its service records?')) return;

    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      setProducts(current => current.filter(p => p._id !== id));
      setSuccess('Product deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadInvoice = async (productId, file) => {
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG, PNG and WEBP files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be 5 MB or less.');
      return;
    }

    const body = new FormData();
    body.append('invoice', file);

    setUploadingId(productId);
    setError('');
    setSuccess('');

    try {
      await apiFetch(`/products/${productId}/invoice`, {
        method: 'POST',
        body
      });
      setSuccess('Invoice uploaded successfully.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const filtered = products.filter(product =>
    `${product.productName} ${product.brand} ${product.category}`
      .toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR INVENTORY</span>
          <h1>My Products</h1>
          <p>Manage purchases, edit details and keep warranty documents safe.</p>
        </div>
        <button className="primary-btn" onClick={openAddForm}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h3>{editingId ? 'Edit Product' : 'Register a New Product'}</h3>
              <p>Enter the purchase and warranty information below.</p>
            </div>
            <button
              className="icon-btn"
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <label>Product Name *
              <input name="productName" value={form.productName} onChange={updateField} placeholder="e.g. Laptop" required />
            </label>

            <label>Brand
              <input name="brand" value={form.brand} onChange={updateField} placeholder="e.g. Dell" />
            </label>

            <label>Category
              <select name="category" value={form.category} onChange={updateField}>
                <option>Electronics</option>
                <option>Home Appliances</option>
                <option>Furniture</option>
                <option>Mobile</option>
                <option>Other</option>
              </select>
            </label>

            <label>Purchase Date *
              <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={updateField} required />
            </label>

            <label>Purchase Price (₹)
              <input type="number" min="0" name="purchasePrice" value={form.purchasePrice} onChange={updateField} placeholder="0" />
            </label>

            <label>Warranty Start Date
              <input type="date" name="warrantyStartDate" value={form.warrantyStartDate} onChange={updateField} />
            </label>

            <label>Warranty End Date
              <input type="date" name="warrantyEndDate" value={form.warrantyEndDate} onChange={updateField} />
            </label>

            <label className="wide-field">Description
              <textarea name="description" value={form.description} onChange={updateField} placeholder="Additional product details..." rows="3" />
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
                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="search-box">
        <Search size={19} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products, brands or categories..."
        />
      </div>

      {filtered.length ? (
        <div className="product-grid">
          {filtered.map(product => (
            <div className="panel product-card" key={product._id}>
              <div className="product-card-top">
                <div className="product-symbol large">
                  <Package size={25} />
                </div>
                <span className={`status-pill ${
                  product.warrantyStatus === 'Expired' ? 'expired' :
                  product.warrantyStatus === 'Expiring Soon' ? 'warning' :
                  product.warrantyStatus === 'No Warranty' ? 'neutral' : 'active'
                }`}>
                  {product.warrantyStatus || 'Registered'}
                </span>
              </div>

              <h3>{product.productName}</h3>
              <p className="product-brand">
                {product.brand || 'Brand not specified'} · {product.category}
              </p>

              <div className="product-detail">
                <CalendarDays size={16} />
                Purchased: {new Date(product.purchaseDate).toLocaleDateString()}
              </div>

              <div className="product-detail">
                Warranty ends: {product.warrantyEndDate
                  ? new Date(product.warrantyEndDate).toLocaleDateString()
                  : 'Not specified'}
              </div>

              <div className="product-card-bottom">
                <strong>₹{Number(product.purchasePrice || 0).toLocaleString('en-IN')}</strong>
                <div className="product-actions">
                  <button
                    className="small-action edit-action"
                    onClick={() => openEditForm(product)}
                    title="Edit product"
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    className="small-action delete-action"
                    onClick={() => deleteProduct(product._id)}
                    title="Delete product"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>

              <div className="invoice-area">
                {product.invoice ? (
                  <a
                    className="invoice-link"
                    href={product.invoice}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={16} /> View invoice <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="invoice-missing">No invoice uploaded</span>
                )}

                <label className="invoice-upload-btn">
                  <FileUp size={16} />
                  {uploadingId === product._id ? 'Uploading...' : product.invoice ? 'Replace invoice' : 'Upload invoice'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    disabled={uploadingId === product._id}
                    onChange={e => {
                      uploadInvoice(product._id, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    hidden
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel empty-state">
          <Package size={40} />
          <h3>{search ? 'No matching products' : 'Your inventory is empty'}</h3>
          <p>{search ? 'Try another search term.' : 'Add a product to begin tracking its warranty.'}</p>
          {!search && (
            <button className="primary-btn" onClick={openAddForm}>
              <Plus size={18} /> Add Your First Product
            </button>
          )}
        </div>
      )}
    </div>
  );
}
