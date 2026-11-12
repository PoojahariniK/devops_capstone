import React, { useState } from 'react';

export default function WarehouseLocations({ locations }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  if (!locations) return <div className="state-container"><div className="spinner"></div>Loading locations...</div>;

  const aisles = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">3. Warehouse Location Grid (40 Bins)</h2>
          <p className="section-desc">2D facility coordinate map showing Aisles A through E with real-time occupancy and capacity</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#4ade80' }}></span>
            Empty (Available)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#818cf8' }}></span>
            Occupied
          </span>
        </div>
      </div>

      <div className="warehouse-aisle-container">
        {aisles.map(aisle => {
          const aisleLocs = locations.filter(l => l.aisle === aisle);
          return (
            <div key={aisle} className="aisle-row">
              <div className="aisle-label">Aisle {aisle}</div>
              <div className="aisle-slots">
                {aisleLocs.map(loc => {
                  const isEmpty = loc.status === 'EMPTY';
                  return (
                    <div
                      key={loc.locationId}
                      className={`slot-box ${isEmpty ? 'empty' : 'occupied'}`}
                      onClick={() => setSelectedLocation(loc)}
                      title={`Location: ${loc.locationId}\nCoordinates: (${loc.x}, ${loc.y})\nCapacity: ${loc.capacity}\nAllowed: ${loc.allowedCategory}\nStatus: ${loc.status}`}
                    >
                      <div className="slot-id" style={{ color: isEmpty ? '#4ade80' : '#f8fafc' }}>
                        {loc.locationId}
                      </div>
                      <div className="slot-meta">
                        Cap: {loc.capacity}
                      </div>
                      <div className="slot-meta" style={{ fontSize: '0.65rem', color: isEmpty ? '#86efac' : '#94a3b8' }}>
                        {loc.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLocation && (
        <div style={{ marginTop: '1.5rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #38bdf8' }}>
          <h4 style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>Selected Location: {selectedLocation.locationId}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>Aisle: <strong>{selectedLocation.aisle}</strong></div>
            <div>Coordinates: <strong>({selectedLocation.x}, {selectedLocation.y})</strong></div>
            <div>Storage Capacity: <strong>{selectedLocation.capacity} units</strong></div>
            <div>Allowed Category: <strong>{selectedLocation.allowedCategory}</strong></div>
            <div>Status: <span className={`badge ${selectedLocation.status === 'EMPTY' ? 'badge-empty' : 'badge-occupied'}`}>{selectedLocation.status}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

