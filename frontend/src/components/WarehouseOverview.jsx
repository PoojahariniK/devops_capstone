import React from 'react';

export default function WarehouseOverview({ analytics, locations, products }) {
  if (!analytics) return <div className="state-container"><div className="spinner"></div>Loading overview...</div>;

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total SKUs</span>
          <span className="kpi-value">{analytics.totalProducts}</span>
          <span className="kpi-subtext">Active Master Catalog</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Storage Locations</span>
          <span className="kpi-value">{analytics.totalLocations}</span>
          <span className="kpi-subtext">
            {analytics.occupiedLocations} Occupied · <strong style={{ color: '#4ade80' }}>{analytics.emptyLocations} Empty</strong>
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Demand Segments</span>
          <span className="kpi-value">{analytics.fastProducts} / {analytics.mediumProducts} / {analytics.slowProducts}</span>
          <span className="kpi-subtext">Fast (≥10) · Med (4-9) · Slow (&lt;4)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Mean Distance Reduction</span>
          <span className="kpi-value" style={{ color: '#38bdf8' }}>
            {analytics.averageDistanceReductionPct}%
          </span>
          <span className="kpi-subtext positive">Total Saved: {analytics.totalDistanceSaved} units</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Replenishment Alerts</span>
          <span className="kpi-value" style={{ color: analytics.replenishmentAlertsCount > 0 ? '#f87171' : '#4ade80' }}>
            {analytics.replenishmentAlertsCount}
          </span>
          <span className="kpi-subtext warning">Action Required Immediately</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Supervisor Approvals</span>
          <span className="kpi-value">
            {analytics.approvedSlotsCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>approved</span>
          </span>
          <span className="kpi-subtext">
            {analytics.recommendedSlotsCount} candidate slots pending review
          </span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Warehouse Operational Status</h2>
            <p className="section-desc">Real-time facility utilization and optimization objectives</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#38bdf8' }}>Optimization Objectives</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
              <li><strong>Slotting Optimization:</strong> Position fast-moving items closer to dispatch point while strictly enforcing storage capacity and category compatibility.</li>
              <li><strong>Pick-Path Routing:</strong> Reduce picker travel distance and picking time using Nearest Neighbor heuristic across historical order batches.</li>
              <li><strong>Supervisor Governance:</strong> Retain strict human-in-the-loop approvals before updating physical bin allocations.</li>
              <li><strong>Honest Heuristic Auditing:</strong> Transparently flag suboptimal edge cases where greedy heuristic underperforms the baseline.</li>
            </ul>
          </div>

          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#38bdf8' }}>Warehouse Occupancy Rate</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Occupied: <strong>{analytics.occupiedLocations} / {analytics.totalLocations}</strong></span>
              <span><strong>{Math.round((analytics.occupiedLocations / analytics.totalLocations) * 100)}%</strong></span>
            </div>
            <div className="progress-bar-bg" style={{ height: '12px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(analytics.occupiedLocations / analytics.totalLocations) * 100}%`,
                  backgroundColor: '#6366f1'
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Available Capacity Slots:</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{analytics.emptyLocations} Empty Slots</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '12px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(analytics.emptyLocations / analytics.totalLocations) * 100}%`,
                  backgroundColor: '#22c55e'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

