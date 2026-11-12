import React, { useState } from 'react';

export default function DemandClassification({ demand }) {
  const [filterClass, setFilterClass] = useState('ALL');

  if (!demand) return <div className="state-container"><div className="spinner"></div>Loading demand data...</div>;

  const fastCount = demand.filter(d => d.demandClass === 'Fast').length;
  const mediumCount = demand.filter(d => d.demandClass === 'Medium').length;
  const slowCount = demand.filter(d => d.demandClass === 'Slow').length;

  const filtered = filterClass === 'ALL' ? demand : demand.filter(d => d.demandClass === filterClass);

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">4. SKU Demand Classification ({demand.length} Items)</h2>
          <p className="section-desc">Order line frequency and total pick volume profiling based on historical orders</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filterClass === 'ALL' ? 'btn-approve' : ''}`}
            onClick={() => setFilterClass('ALL')}
            style={{ background: filterClass === 'ALL' ? '#38bdf8' : '#1e293b', color: filterClass === 'ALL' ? '#0f172a' : '#f8fafc' }}
          >
            All ({demand.length})
          </button>
          <button
            className="btn"
            onClick={() => setFilterClass('Fast')}
            style={{ background: filterClass === 'Fast' ? 'rgba(239, 68, 68, 0.4)' : '#1e293b', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Fast (≥10): {fastCount}
          </button>
          <button
            className="btn"
            onClick={() => setFilterClass('Medium')}
            style={{ background: filterClass === 'Medium' ? 'rgba(245, 158, 11, 0.4)' : '#1e293b', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            Medium (4-9): {mediumCount}
          </button>
          <button
            className="btn"
            onClick={() => setFilterClass('Slow')}
            style={{ background: filterClass === 'Slow' ? 'rgba(56, 189, 248, 0.4)' : '#1e293b', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
          >
            Slow (&lt;4): {slowCount}
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Bin</th>
              <th>Order Lines (Freq)</th>
              <th>Total Quantity Ordered</th>
              <th>Demand Segment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.skuId}>
                <td><strong>{d.skuId}</strong></td>
                <td>{d.productName}</td>
                <td>{d.category}</td>
                <td><span className="badge badge-occupied">{d.currentLocation}</span></td>
                <td><strong>{d.orderFrequency} orders</strong></td>
                <td>{d.totalQuantity} units</td>
                <td>
                  <span className={`badge badge-${d.demandClass.toLowerCase()}`}>
                    {d.demandClass}
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

