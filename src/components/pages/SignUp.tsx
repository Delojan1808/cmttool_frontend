import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../templates/MainLayout";
import { registerUser } from "../../api";

const SignUp = () => {
  const navigate = useNavigate();
  const [fName, setFName] = useState<string>('');
  const [lName, setLName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [nic, setNic] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);
    try {
      await registerUser({
        name: `${fName} ${lName}`.trim(),
        email,
        password,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      setFName('');
      setLName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setNic('');
      setAddress('');
      setOrganization('');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div className="glass-card" style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 0 }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-hover)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--primary)'}
            >
              ← Back
            </button>
            <div>
              <h2 style={{ ...styles.title, marginBottom: 0 }}>Create Author Account</h2>
              <p style={{ ...styles.subtitle, margin: '0.25rem 0 0 0' }}>Join the Conference Management System</p>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Name row */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="fName">First Name *</label>
                <input className="input-glass" id="fName" style={styles.input} type="text" placeholder="John"
                  value={fName} onChange={e => setFName(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="lName">Last Name *</label>
                <input className="input-glass" id="lName" style={styles.input} type="text" placeholder="Doe"
                  value={lName} onChange={e => setLName(e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">Email *</label>
              <input className="input-glass" id="email" style={styles.input} type="email" placeholder="email@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="password">Password *</label>
              <input className="input-glass" id="password" style={styles.input} type="password" placeholder="Min. 6 characters"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {/* Organization */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="org">Organization</label>
              <input className="input-glass" id="org" style={styles.input} type="text" placeholder="e.g. MIT"
                value={organization} onChange={e => setOrganization(e.target.value)} />
            </div>

            {/* Phone + NIC row */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="phone">Phone</label>
                <input className="input-glass" id="phone" style={styles.input} type="tel" placeholder="xxx-xxx-xxxx"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="nic">NIC</label>
                <input className="input-glass" id="nic" style={styles.input} type="text" placeholder="NIC"
                  value={nic} onChange={e => setNic(e.target.value)} />
              </div>
            </div>

            {/* Address */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="address">Address</label>
              <input className="input-glass" id="address" style={styles.input} type="text" placeholder="Street, City"
                value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-hover)', textDecoration: 'none', fontWeight: 600 }}>Log in here</Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    animation: 'fadeIn 0.5s ease-out',
  },
  card: {
    padding: '2.5rem',
    width: '100%',
    maxWidth: 560,
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '0.25rem 0 1.5rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  highlightedField: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    width: '100%',
  },
  hint: {
    margin: '4px 0 0',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    fontSize: '1rem',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: 'var(--error)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: 8,
  },
  successBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: 'var(--success)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: 8,
  },
};

export default SignUp;
