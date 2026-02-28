import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faSignOutAlt, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { logoutUser, getMyNotifications, markAsRead, markAllAsRead, type Notification } from "../../../api";
import { useEffect, useState, useRef } from "react";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!sessionStorage.getItem('token');

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      loadNotifications();
      setShowDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem 2rem', zIndex: 1000,
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      <div>
        <h1 style={{
          fontSize: '1.75rem', margin: 0,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '1px'
        }}>CMT</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--text-primary)',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
        </button>

        {isAuthenticated && (
          <>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--glass-border)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease', color: 'var(--text-primary)',
                  position: 'relative'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.background = showDropdown ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'}
              >
                <FontAwesomeIcon icon={faBell} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: 'var(--error)', color: 'white',
                    borderRadius: '50%', padding: '2px 6px',
                    fontSize: '0.7rem', fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showDropdown && (
                <div className="glass-card" style={{
                  position: 'absolute', top: '120%', right: 0,
                  width: '320px', maxHeight: '400px', overflowY: 'auto',
                  padding: '1rem', zIndex: 1100,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  display: 'flex', flexDirection: 'column', gap: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id}
                        onClick={() => !n.read && handleMarkAsRead(n._id)}
                        style={{
                          padding: '0.8rem', borderRadius: '8px',
                          background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                          borderLeft: n.read ? '2px solid transparent' : '2px solid var(--primary)',
                          cursor: n.read ? 'default' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => !n.read && (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                        onMouseOut={e => !n.read && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      >
                        <div style={{ fontSize: '0.9rem', color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              title="Logout"
              onClick={handleLogout}
              style={{
                height: '40px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.5)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0 1rem',
                cursor: 'pointer', transition: 'all 0.3s ease', color: '#f87171',
                fontWeight: 600, fontSize: '0.9rem'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.35)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.8)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
