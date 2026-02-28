const Footer: React.FC = () => {
  return (
    <footer style={{
      width: '100%',
      height: '60px',
      background: 'var(--bg-gradient-2)',
      borderTop: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem'
    }}>
      <div style={{ opacity: 0.8 }}>
        &copy; {new Date().getFullYear()} CMT. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer