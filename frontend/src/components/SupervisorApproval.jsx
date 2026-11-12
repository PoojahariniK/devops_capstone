import React, { useState } from 'react';

export default function SupervisorApproval({ recommendations, onApprove, onReject, toast }) {
  const [actionInProgress, setActionInProgress] = useState(null);

  if (!recommendations) return <div className="state-container"><div className="spinner"></div>Loading supervisor approval queue...</div>;

  const pending = recommendations.filter(r => r.recommendationStatus === 'RECOMMENDED');
  const approved = recommendations.filter(r => r.recommendationStatus === 'APPROVED');
  const rejected = recommendations.filter(r => r.recommendationStatus === 'REJECTED');
  const noFeasible = recommendations.filter(r => r.recommendationStatus === 'NO_FEASIBLE_LOCATION');

  const handleApprove = async (id) => {
    setActionInProgress(id);
    try {
      await onApprove(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id) => {
    setActionInProgress(id);
    try {
      await onReject(id);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-alert ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <span className="kpi-label">Pending Review</span>
          <span className="kpi-value" style={{ color: '#38bdf8' }}>{pending.length}</span>
          <span className="kpi-subtext">Awaiting supervisor decision</span>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <span className="kpi-label">Approved</span>
          <span className="kpi-value" style={{ color: '#4ade80' }}>{approved.length}</span>
          <span className="kpi-subtext">Slot changes confirmed</span>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span className="kpi-label">Rejected</span>
          <span className="kpi-value" style={{ color: '#f87171' }}>{rejected.length}</span>
          <span className="kpi-subtext">Kept original assignment</span>
        </div>
        <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <span className="kpi-label">No Feasible Slot</span>
          <span className="kpi-value" style={{ color: '#fbbf24' }}>{noFeasible.length}</span>
          <span className="kpi-subtext">Constrained — no eligible empty location</span>
        </div>
      </div>

      {/* Pending Approval Queue */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">8. Supervisor Approval Queue</h2>
            <p className="section-desc">
              Review and approve/reject recommended slot changes. Only RECOMMENDED items can be actioned. Decisions are final and transactional.
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="state-container" style={{ padding: '2rem' }}>
            <p style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: '600' }}>✅ All recommendations have been resolved</p>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>No pending approvals remain in the queue.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rec ID</th>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Demand Class</th>
                  <th>Current Location</th>
                  <th>Proposed Location</th>
                  <th>Distance from Dispatch</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.recommendationId}>
                    <td><strong>{r.recommendationId}</strong></td>
                    <td>{r.skuId}</td>
                    <td>{r.productName}</td>
                    <td>
                      <span className={`badge badge-${r.demandClass.toLowerCase()}`}>
                        {r.demandClass}
                      </span>
                    </td>
                    <td><span className="badge badge-occupied">{r.currentLocation}</span></td>
                    <td><span className="badge badge-empty">{r.recommendedLocation}</span></td>
                    <td>{r.distance} units</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '300px' }}>{r.reason}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className={`btn btn-approve ${actionInProgress === r.recommendationId ? 'btn-disabled' : ''}`}
                          disabled={actionInProgress === r.recommendationId}
                          onClick={() => handleApprove(r.recommendationId)}
                          style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          {actionInProgress === r.recommendationId ? '...' : '✓ Approve'}
                        </button>
                        <button
                          className={`btn btn-reject ${actionInProgress === r.recommendationId ? 'btn-disabled' : ''}`}
                          disabled={actionInProgress === r.recommendationId}
                          onClick={() => handleReject(r.recommendationId)}
                          style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          {actionInProgress === r.recommendationId ? '...' : '✗ Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision History */}
      {(approved.length > 0 || rejected.length > 0) && (
        <div className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Decision History</h2>
              <p className="section-desc">Approved and rejected slot changes — supervisor audit trail</p>
            </div>
          </div>

          <div className="table-responsive" style={{ maxHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rec ID</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Current</th>
                  <th>Proposed</th>
                  <th>Decision</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {[...approved, ...rejected].map(r => (
                  <tr key={r.recommendationId}>
                    <td><strong>{r.recommendationId}</strong></td>
                    <td>{r.skuId}</td>
                    <td>{r.productName}</td>
                    <td><span className="badge badge-occupied">{r.currentLocation}</span></td>
                    <td>
                      {r.recommendedLocation !== 'NONE'
                        ? <span className="badge badge-empty">{r.recommendedLocation}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>
                      }
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: r.recommendationStatus === 'APPROVED'
                            ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: r.recommendationStatus === 'APPROVED' ? '#4ade80' : '#f87171',
                          border: `1px solid ${r.recommendationStatus === 'APPROVED' ? '#22c55e' : '#ef4444'}`
                        }}
                      >
                        {r.recommendationStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

