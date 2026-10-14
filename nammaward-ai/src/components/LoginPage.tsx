import { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { UserRole } from '../types';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error || 'Login failed');
  };

  const fillDemo = (role: 'citizen' | 'staff') => {
    const e = role === 'citizen' ? 'citizen@demo.com' : 'staff@demo.com';
    const account = DEMO_ACCOUNTS[e];
    setEmail(e);
    setPassword(account.password);
    setSelectedRole(role === 'citizen' ? 'citizen' : 'staff');
  };

  if (!selectedRole) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-hero">
            <div className="login-logo">🏛️</div>
            <h1 className="login-title">NammaWard AI</h1>
            <p className="login-tagline">AI-Powered Civic Issue Tracker</p>
            <p className="login-desc">Report civic issues, track resolutions, and build smarter communities together.</p>
          </div>

          <div className="role-selection">
            <h2>Choose Your Role</h2>
            <div className="role-cards">
              <button className="role-card citizen-card" onClick={() => { setSelectedRole('citizen'); fillDemo('citizen'); }}>
                <span className="role-icon">👤</span>
                <h3>Citizen</h3>
                <p>Report issues, track complaints, and engage with your community</p>
              </button>
              <button className="role-card staff-card" onClick={() => { setSelectedRole('staff'); fillDemo('staff'); }}>
                <span className="role-icon">🏢</span>
                <h3>Municipal Staff</h3>
                <p>Review complaints, update statuses, and manage civic operations</p>
              </button>
            </div>
          </div>

          <div className="login-disclaimer">
            ⚠️ <strong>Prototype Demo</strong> — This is a hackathon project. Demo credentials are pre-filled for convenience.
            Not connected to any real municipal authority.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-hero compact">
          <div className="login-logo">🏛️</div>
          <h1 className="login-title">NammaWard AI</h1>
          <p className="login-tagline">
            {selectedRole === 'citizen' ? '👤 Citizen Login' : '🏢 Staff Login'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error" role="alert">❌ {error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <><span className="spinner"></span> Signing in...</> : '🔐 Sign In'}
          </button>

          <button
            type="button"
            className="back-btn"
            onClick={() => { setSelectedRole(null); setError(''); setEmail(''); setPassword(''); }}
          >
            ← Choose a different role
          </button>
        </form>

        <div className="demo-credentials">
          <h4>🔑 Demo Credentials</h4>
          <div className="demo-grid">
            <button type="button" className="demo-item" onClick={() => fillDemo('citizen')}>
              <strong>Citizen:</strong> citizen@demo.com / citizen123
            </button>
            <button type="button" className="demo-item" onClick={() => fillDemo('staff')}>
              <strong>Staff:</strong> staff@demo.com / staff123
            </button>
          </div>
          <p className="demo-note">
            ⚠️ Demo authentication only. Real production deployment requires secure server-side authentication and authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
