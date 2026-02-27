import React from 'react';
import Footer from "../organisms/footer/Footer";
import Header from "../organisms/header/Header";

type MainLayoutProps = {
  children: React.ReactNode;
};
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Header />
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '80px', // offset for fixed header
        paddingBottom: '40px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
