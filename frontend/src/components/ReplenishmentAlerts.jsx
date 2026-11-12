import React from 'react';

export default function ReplenishmentAlerts({ replenishment }) {
  if (!replenishment) return <div className="state-container"><div className="spinner"></div>Loading replenishment alerts...</div>;

  const outOfStock = replenishment.filter(r => r.stockStatus === 'OUT_OF_STOCK');
  const lowStock = replenishment.filter(r => r.stockStatus === 'LOW_STOCK');

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">7. Replenishment Alerts &amp; Stock Health</h2>
          <p className="section-desc">
            SKUs where Current_Stock ≤ Minimum_Stock requiring immediate action
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid #ef4444',
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem'
            }}
          >
            🔴 Out of Stock: {outOfStock.length}
          </span>
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              border: '1px solid #f59e0b',
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem'
            }}
          >
            🟠 Low Stock: {lowStock.length}
          </span>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', fontWeight: '600' }}>Critical — Zero Inventory</span>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f87171', marginTop: '0.25rem' }}>
            {outOfStock.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            SKUs completely depleted
          </div>
        </div>

        <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: '600' }}>Warning — Below Minimum</span>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24', marginTop: '0.25rem' }}>
            {lowStock.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            SKUs approaching stockout
          </div>
        </div>

        <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Total Alerts</span>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.25rem' }}>
            {replenishment.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            All replenishment actions needed
          </div>
        </div>
      </div>

      {/* Replenishment Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU ID</th>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Stock Deficit</th>
              <th>Stock Status</th>
              <th>Replenishment Required</th>
            </tr>
          </thead>
          <tbody>
            {replenishment.map(r => {
              const deficit = r.minimumStock - r.currentStock;
              const isOut = r.stockStatus === 'OUT_OF_STOCK';
              return (
                <tr key={r.skuId}>
                  <td><strong>{r.skuId}</strong></td>
                  <td>{r.productName}</td>
                  <td>
                    <span style={{ color: isOut ? '#f87171' : '#fbbf24', fontWeight: '600' }}>
                      {r.currentStock}
                    </span>
                  </td>
                  <td>{r.minimumStock}</td>
                  <td>
                    <span style={{ color: '#f87171', fontWeight: '700' }}>
                      -{deficit}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: isOut ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isOut ? '#f87171' : '#fbbf24',
                        border: `1px solid ${isOut ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                      }}
                    >
                      {r.stockStatus}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      {r.replenishmentRequired}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

