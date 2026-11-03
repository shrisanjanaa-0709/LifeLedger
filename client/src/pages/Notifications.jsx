
import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  XCircle,
  CalendarDays,
  RefreshCw,
  Package,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Notifications() {
  const { apiFetch } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await apiFetch('/notifications');
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const warningCount = notifications.filter(
    item => item.type === 'warning'
  ).length;

  const expiredCount = notifications.filter(
    item => item.type === 'danger'
  ).length;

  const formatDate = date => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STAY INFORMED</span>
          <h1>Notifications</h1>
          <p>Keep track of your product warranty updates.</p>
        </div>

        <button
          className="primary-btn"
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="notification-stats">
        <div className="notification-stat">
          <div className="notification-stat-icon warning-icon">
            <AlertTriangle size={21} />
          </div>
          <div>
            <p>Expiring Soon</p>
            <h2>{warningCount}</h2>
          </div>
        </div>

        <div className="notification-stat">
          <div className="notification-stat-icon expired-icon">
            <XCircle size={21} />
          </div>
          <div>
            <p>Expired</p>
            <h2>{expiredCount}</h2>
          </div>
        </div>

        <div className="notification-stat">
          <div className="notification-stat-icon total-icon">
            <Bell size={21} />
          </div>
          <div>
            <p>Total Alerts</p>
            <h2>{notifications.length}</h2>
          </div>
        </div>
      </div>

      <div className="panel notifications-panel">
        <div className="panel-heading">
          <div>
            <h3>All Notifications</h3>
            <p>Your latest warranty alerts</p>
          </div>
          <Bell size={20} color="#287c78" />
        </div>

        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <CheckCircle size={32} />
            </div>
            <h3>You're all caught up!</h3>
            <p>
              No expired or soon-to-expire warranties.
              Your products are looking good.
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map(item => (
              <div
                className={`notification-card ${item.type}`}
                key={item.id}
              >
                <div className={`notification-icon ${item.type}`}>
                  {item.type === 'warning' ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <XCircle size={22} />
                  )}
                </div>

                <div className="notification-content">
                  <h3>
                    {item.type === 'warning'
                      ? 'Warranty Expiring Soon'
                      : 'Warranty Expired'}
                  </h3>

                  <p>{item.message}</p>

                  <span>
                    <CalendarDays size={14} />
                    Warranty end date: {formatDate(item.date)}
                  </span>
                </div>

                <div className="notification-label">
                  {item.type === 'warning' ? 'Attention' : 'Expired'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
