import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, Check, X, FileText } from 'lucide-react';

export default function Reimbursements() {
  const { user } = useAuth();
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const res = await api.getReimbursements();
      setReimbursements(res.data.reimbursements || []);
    } catch (err) {
      setError('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createReimbursement({ title: newTitle, description: newDesc, amount: parseFloat(newAmount) });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewAmount('');
      fetchReimbursements();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      await api.updateReimbursement({ reimbursementId: id, decision, remarks: `${decision} via UI` });
      fetchReimbursements();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Reimbursements</h1>
          <p>Manage and track your reimbursement requests.</p>
        </div>
        
        {user?.role === 'EMP' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Request
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : reimbursements.length === 0 ? (
        <div className="glass-panel flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem' }}>
          <FileText size={48} color="var(--border-color)" />
          <p>No reimbursements found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reimbursements.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{r.title}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{r.description}</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>₹{parseFloat(r.amount).toFixed(2)}</span>
                  <span className={`badge badge-${r.final_status.toLowerCase()}`}>{r.final_status}</span>
                  {r.Requester && (
                    <span style={{ color: 'var(--text-muted)' }}>By: {r.Requester.name}</span>
                  )}
                </div>
              </div>

              {(user?.role === 'RM' || user?.role === 'APE') && r.final_status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleDecision(r.id, 'APPROVED')}
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    title="Approve"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => handleDecision(r.id, 'REJECTED')}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>New Reimbursement</h2>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Title</label>
                <input type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input type="number" step="0.01" className="input-field" value={newAmount} onChange={e => setNewAmount(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input-field" rows="3" value={newDesc} onChange={e => setNewDesc(e.target.value)} required></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
