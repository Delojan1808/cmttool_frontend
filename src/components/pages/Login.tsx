import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../templates/MainLayout";
import { loginUser } from "../../api";

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'Secretary') navigate('/secretary', { replace: true });
        else if (user.role === 'Editor') navigate('/editor', { replace: true });
        else if (user.role === 'Sub Editor') navigate('/subeditor', { replace: true });
        else if (user.role === 'Reviewer') navigate('/reviewer', { replace: true });
        else if (user.role === 'Author') navigate('/author', { replace: true });
      } catch (e) {
        // Invalid user str
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      if (res.success) {
        // Store the JWT token and user info in sessionStorage (clears on tab close)
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));

        const userRole = res.data.user.role;
        // Role-based redirect
        if (userRole === 'Secretary') navigate('/secretary');
        else if (userRole === 'Editor') navigate('/editor');
        else if (userRole === 'Sub Editor') navigate('/subeditor');
        else if (userRole === 'Reviewer') navigate('/reviewer');
        else if (userRole === 'Author') navigate('/author');
        else navigate('/login'); // Unknown role fallback
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.8rem', fontWeight: 700 }}>Login</h2>

          {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--error)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
              <input
                id="email"
                type="email"
                className="input-glass w-full"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
              <input
                id="password"
                type="password"
                className="input-glass w-full"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '12px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--primary-hover)', textDecoration: 'none', fontWeight: 600 }}>Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
