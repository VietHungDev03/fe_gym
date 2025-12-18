import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-main">
      <Header
        onMenuToggle={handleMenuToggle}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
      />

      {/* Main content */}
      <main className="pt-16 lg:pl-64 transition-all duration-300">
        <div className="px-12 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
