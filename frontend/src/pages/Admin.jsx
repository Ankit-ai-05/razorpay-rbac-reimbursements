import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, Link } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Role State
  const [roleUserId, setRoleUserId] = useState('');
  const [newRole, setNewRole] = useState('RM');
  
  // Assign Manager State
  const [empId, setEmpId] = useState('');
  const [mgrId, setMgrId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      await api.assignRole({ userId: roleUserId, role: newRole });
      alert('Role assigned successfully');
      setRoleUserId('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      await api.assignManager({ employeeId: empId, managerId: mgrId });
      alert('Manager assigned successfully');
      setEmpId('');
      setMgrId('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Administration</h1>
        <p>Manage roles and reporting structures.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Assign Role - CFO ONLY */}
        {user?.role === 'CFO' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <ShieldAlert color="var(--primary-color)" />
              <h3 style={{ margin: 0 }}>Assign Role</h3>
            </div>
            
            <form onSubmit={handleAssignRole}>
              <div className="input-group">
                <label>User</label>
                <select className="input-field" value={roleUserId} onChange={e => setRoleUserId(e.target.value)} required>
                  <option value="">Select a user...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email}) - {e.role}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Role</label>
                <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)} required>
                  <option value="EMP">Employee (EMP)</option>
                  <option value="RM">Reporting Manager (RM)</option>
                  <option value="APE">Accounts Payable (APE)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full">Update Role</button>
            </form>
          </div>
        )}

        {/* Assign Manager - CFO ONLY */}
        {user?.role === 'CFO' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Link color="var(--primary-color)" />
              <h3 style={{ margin: 0 }}>Assign Manager</h3>
            </div>
            
            <form onSubmit={handleAssignManager}>
              <div className="input-group">
                <label>Employee</label>
                <select className="input-field" value={empId} onChange={e => setEmpId(e.target.value)} required>
                  <option value="">Select Employee...</option>
                  {employees.filter(e => e.role === 'EMP').map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Manager (RM)</label>
                <select className="input-field" value={mgrId} onChange={e => setMgrId(e.target.value)} required>
                  <option value="">Select Manager...</option>
                  {employees.filter(e => e.role === 'RM').map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full">Link Employee to Manager</button>
            </form>
          </div>
        )}

      </div>
      
      {/* Employee List */}
      <h3 style={{ margin: '3rem 0 1rem 0' }}>{user?.role === 'CFO' ? 'All Directory' : 'My Team'}</h3>
      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>{emp.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{emp.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{emp.role}</span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  {new Date(emp.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
