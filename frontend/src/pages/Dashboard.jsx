import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Receipt } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'CFO': return 'var(--primary-color)';
      case 'APE': return 'var(--warning)';
      case 'RM': return 'var(--secondary-color)';
      default: return 'var(--success)';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '280px', 
        background: 'var(--background-surface)', 
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>Razorpay</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Reimbursements</p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link 
            to="/dashboard" 
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              borderRadius: '8px', textDecoration: 'none',
              color: location.pathname === '/dashboard' ? 'var(--text-main)' : 'var(--text-muted)',
              background: location.pathname === '/dashboard' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              fontWeight: location.pathname === '/dashboard' ? '500' : '400',
            }}
          >
            <Receipt size={20} />
            Reimbursements
          </Link>
          
          {['CFO', 'RM'].includes(user?.role) && (
            <Link 
              to="/dashboard/admin" 
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '8px', textDecoration: 'none',
                color: location.pathname === '/dashboard/admin' ? 'var(--text-main)' : 'var(--text-muted)',
                background: location.pathname === '/dashboard/admin' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                fontWeight: location.pathname === '/dashboard/admin' ? '500' : '400',
              }}
            >
              <Users size={20} />
              Manage Personnel
            </Link>
          )}
        </nav>

        {/* User Profile Area */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.2)', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: getRoleBadgeColor(user?.role), fontWeight: '600', marginTop: '0.25rem' }}>
                ROLE: {user?.role}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--text-muted)', 
                cursor: 'pointer', padding: '0.5rem' 
              }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
