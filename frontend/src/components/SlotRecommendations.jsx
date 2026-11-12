import React, { useState } from 'react';

export default function SlotRecommendations({ recommendations, onApprove, onReject }) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!recommendations) return <div className="state-container"><div className="spinner"></div>Loading recommendations...</div>;

  const filtered = statusFilter === 'ALL'
    ? recommendations
    : recommendations.filter(r => r.recommendationStatus === statusFilter);

  const recommendedCount = recommendations.filter(r => r.recommendationStatus === 'RECOMMENDED').length;
  const noLocCount = recommendations.filter(r => r.recommendationStatus === 'NO_FEASIBLE_LOCATION').length;
  const approvedCount = recommendations.filter(r => r.recommendationStatus === 'APPROVED').length;
  const rejectedCount = recommendations.filter(r => r.recommendationStatus === 'REJECTED').length;

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">5. Storage Slotting Recommender Engine</h2>
          <p className="section-desc">Candidate assignments evaluated against the 10 empty locations with capacity, category, and dispatch proximity rules</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={() => setStatusFilter('ALL')}
            style={{ background: statusFilter === 'ALL' ? '#38bdf8' : '#1e293b', color: statusFilter === 'ALL' ? '#0f172a' : '#f8fafc' }}
          >
            All ({recommendations.length})
          </button>
          <button
            className="btn"
            onClick={() => setStatusFilter('RECOMMENDED')}
            style={{ background: statusFilter === 'RECOMMENDED' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b', color: '#38bdf8' }}
          >
            Recommended ({recommendedCount})
          </button>
          <button
            className="btn"
            onClick={() => setStatusFilter('NO_FEASIBLE_LOCATION')}
            style={{ background: statusFilter === 'NO_FEASIBLE_LOCATION' ? 'rgba(245, 158, 11, 0.2)' : '#1e293b', color: '#fbbf24' }}
          >
            No Feasible Slot ({noLocCount})
          </button>
          <button
            className="btn"
            onClick={() => setStatusFilter('APPROVED')}
            style={{ background: statusFilter === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : '#1e293b', color: '#4ade80' }}
          >
            Approved ({approvedCount})
          </button>
          <button
            className="btn"
            onClick={() => setStatusFilter('REJECTED')}
            style={{ background: statusFilter === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : '#1e293b', color: '#f87171' }}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rec ID</th>
              <th>SKU</th>
              <th>Product</th>
              <th>Class</th>
              <th>Current Bin</th>
              <th>Candidate Bin</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Explainable Rule Reason</th>
              {onApprove && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const isRecommended = r.recommendationStatus === 'RECOMMENDED';
              const isApproved = r.recommendationStatus === 'APPROVED';
              const isRejected = r.recommendationStatus === 'REJECTED';

              return (
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
                  <td>
                    {r.recommendedLocation !== 'NONE' ? (
                      <span className="badge badge-empty">{r.recommendedLocation}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>{r.distance > 0 ? `${r.distance} units` : '—'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.2)' :
                                         isRejected ? 'rgba(239, 68, 68, 0.2)' :
                                         isRecommended ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isApproved ? '#4ade80' :
                               isRejected ? '#f87171' :
                               isRecommended ? '#38bdf8' : '#fbbf24',
                        border: '1px solid currentColor'
                      }}
                    >
                      {r.recommendationStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '340px' }}>
                    {r.reason}
                  </td>
                  {onApprove && (
                    <td>
                      {isRecommended ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-approve"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onApprove(r.recommendationId)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-reject"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onReject(r.recommendationId)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Resolved</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

