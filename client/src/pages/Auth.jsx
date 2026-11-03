
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <ShieldCheck size={32} />
          <span>LifeLedger</span>
        </div>

        <div className="auth-message">
          <span className="eyebrow">YOUR PRODUCTS. YOUR CONTROL.</span>
          <h1>Every purchase has a story. Keep it protected.</h1>
          <p>
            Manage your products, track warranties and keep important
            purchase records together in one simple place.
          </p>
          <div className="auth-feature">
            <ShieldCheck size={20} />
            <span>Never miss a warranty deadline again.</span>
          </div>
        </div>
        <p className="auth-footer">© 2026 LifeLedger. All rights reserved.</p>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <ShieldCheck size={28} /> LifeLedger
          </div>

          <span className="eyebrow">
            {isLogin ? 'WELCOME BACK' : 'GET STARTED'}
          </span>

          <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Enter your details to access your dashboard.'
              : 'Start organizing your products and warranties today.'}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <label className="form-label">
                Full Name
                <div className="input-wrap">
                  <User size={18} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </label>
            )}

            <label className="form-label">
              Email Address
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="form-label">
              Password
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </label>

            {error && <div className="error-message">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-bottom">
            Your information is securely stored and accessible only to you.
          </p>
        </div>
      </div>
    </div>
  );
}
