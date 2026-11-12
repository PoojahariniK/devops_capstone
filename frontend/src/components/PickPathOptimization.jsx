import React, { useState } from 'react';

export default function PickPathOptimization({ routes }) {
  const [selectedOrderId, setSelectedOrderId] = useState('ORD001');
  const [filterWorse, setFilterWorse] = useState(false);

  if (!routes || routes.length === 0) {
    return <div className="state-container"><div className="spinner"></div>Loading routes...</div>;
  }

  const selectedRoute = routes.find(r => r.orderId === selectedOrderId) || routes[0];
  const worseCases = routes.filter(r => r.routeStatus === 'WORSE');
  const improvedCases = routes.filter(r => r.routeStatus === 'IMPROVED');

  const displayList = filterWorse ? worseCases : routes;

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">6. Pick-Path Optimization & Routing Engine</h2>
          <p className="section-desc">Baseline sequential pick path vs Nearest Neighbor heuristic path across historical orders</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn"
            onClick={() => setFilterWorse(!filterWorse)}
            style={{
              background: filterWorse ? 'rgba(239, 68, 68, 0.3)' : '#1e293b',
              color: filterWorse ? '#f87171' : '#94a3b8',
              border: '1px solid #ef4444'
            }}
          >
            ⚠️ {filterWorse ? 'Showing Suboptimal Cases Only (5)' : `Show Suboptimal Edge Cases (${worseCases.length})`}
          </button>

          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid #38bdf8',
              color: '#f8fafc',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            {displayList.map(r => (
              <option key={r.orderId} value={r.orderId}>
                {r.orderId} - {r.routeStatus} ({r.pctDistanceReduction > 0 ? `-${r.pctDistanceReduction}%` : `+${Math.abs(r.pctDistanceReduction)}%`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRoute && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Baseline Sequential Route</span>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.25rem' }}>
              {selectedRoute.baselineDistance} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>units</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Est. Time: <strong>{selectedRoute.baselineTimeSec}s</strong> (Walk: 1.2 u/s + 15s/pick)
            </div>
            <div className="route-sequence-box" style={{ borderColor: '#64748b', color: '#cbd5e1' }}>
              {selectedRoute.baselineRouteSequence}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: `1px solid ${selectedRoute.routeStatus === 'WORSE' ? '#ef4444' : '#38bdf8'}` }}>
            <span style={{ fontSize: '0.75rem', color: selectedRoute.routeStatus === 'WORSE' ? '#f87171' : '#38bdf8', textTransform: 'uppercase', fontWeight: '600' }}>
              Optimized (Nearest Neighbor)
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: selectedRoute.routeStatus === 'WORSE' ? '#f87171' : '#38bdf8', marginTop: '0.25rem' }}>
              {selectedRoute.optimizedDistance} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>units</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Est. Time: <strong>{selectedRoute.optimizedTimeSec}s</strong> ({selectedRoute.timeSavedSec > 0 ? `Saved: ${selectedRoute.timeSavedSec}s` : `Added: ${Math.abs(selectedRoute.timeSavedSec)}s`})
            </div>
            <div className="route-sequence-box" style={{ borderColor: selectedRoute.routeStatus === 'WORSE' ? '#ef4444' : '#38bdf8' }}>
              {selectedRoute.optimizedRouteSequence}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Variance & Status</span>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: selectedRoute.distanceSaved >= 0 ? '#4ade80' : '#f87171', marginTop: '0.25rem' }}>
              {selectedRoute.pctDistanceReduction}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Distance Variance: <strong>{selectedRoute.distanceSaved > 0 ? `-${selectedRoute.distanceSaved} units` : `+${Math.abs(selectedRoute.distanceSaved)} units`}</strong>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: selectedRoute.routeStatus === 'WORSE' ? '#fca5a5' : '#94a3b8' }}>
              {selectedRoute.notes}
            </div>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#f8fafc' }}>Batch Order Pick-Path Comparison Table (50 Orders)</h3>
      <div className="table-responsive" style={{ maxHeight: '350px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Baseline Dist</th>
              <th>Optimized Dist</th>
              <th>Distance Saved</th>
              <th>Reduction %</th>
              <th>Baseline Time</th>
              <th>Optimized Time</th>
              <th>Result Status</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map(r => (
              <tr
                key={r.orderId}
                onClick={() => setSelectedOrderId(r.orderId)}
                style={{ cursor: 'pointer', background: r.orderId === selectedOrderId ? 'rgba(56, 189, 248, 0.08)' : 'transparent' }}
              >
                <td><strong>{r.orderId}</strong></td>
                <td>{r.baselineDistance}</td>
                <td>{r.optimizedDistance}</td>
                <td style={{ color: r.distanceSaved > 0 ? '#4ade80' : r.distanceSaved < 0 ? '#f87171' : '#94a3b8', fontWeight: '600' }}>
                  {r.distanceSaved > 0 ? `+${r.distanceSaved}` : r.distanceSaved}
                </td>
                <td>
                  <span className={`badge ${r.pctDistanceReduction > 0 ? 'badge-improved' : r.pctDistanceReduction < 0 ? 'badge-worse' : ''}`}>
                    {r.pctDistanceReduction}%
                  </span>
                </td>
                <td>{r.baselineTimeSec}s</td>
                <td>{r.optimizedTimeSec}s</td>
                <td>
                  <span className={`badge ${r.routeStatus === 'IMPROVED' ? 'badge-improved' : r.routeStatus === 'WORSE' ? 'badge-worse' : ''}`}>
                    {r.routeStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

