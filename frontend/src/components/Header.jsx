import React from 'react';

export default function Header({ analytics, backendOnline }) {
  return (
    <header className="header">
      <div className="header-title-group">
        <h1>
          <span>📦 CAP-12 Warehouse Optimization</span>
          <span className="header-badge">Decision Support</span>
        </h1>
        <p className="header-subtitle">
          Intelligent Warehouse Slotting, Demand Profiling & Pick-Path Routing Dashboard
        </p>
      </div>

      <div className="header-status">
        <div className="status-pill">
          <span className="status-indicator" style={{ backgroundColor: backendOnline ? '#22c55e' : '#ef4444' }}></span>
          <span>Backend: {backendOnline ? 'Online (REST API)' : 'Disconnected (Offline Mode)'}</span>
        </div>
        <div className="status-pill">
          <span>Snowflake Schema: <strong>CLEAN</strong></span>
        </div>
      </div>
    </header>
  );
}

