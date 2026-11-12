import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import WarehouseOverview from './components/WarehouseOverview';
import ProductMaster from './components/ProductMaster';
import WarehouseLocations from './components/WarehouseLocations';
import DemandClassification from './components/DemandClassification';
import SlotRecommendations from './components/SlotRecommendations';
import PickPathOptimization from './components/PickPathOptimization';
import ReplenishmentAlerts from './components/ReplenishmentAlerts';
import SupervisorApproval from './components/SupervisorApproval';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import warehouseApi from './api/warehouseApi';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [toast, setToast] = useState(null);

  // Core Data States
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [demand, setDemand] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [replenishment, setReplenishment] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Attempt to load from Spring Boot REST endpoints in parallel
      const [
        prodsData,
        locsData,
        demandData,
        recsData,
        routesData,
        replenData,
        analyticsData,
      ] = await Promise.all([
        warehouseApi.getProducts().catch(() => null),
        warehouseApi.getLocations().catch(() => null),
        warehouseApi.getDemand().catch(() => null),
        warehouseApi.getSlotRecommendations().catch(() => null),
        warehouseApi.getAllRoutes().catch(() => null),
        warehouseApi.getReplenishmentAlerts().catch(() => null),
        warehouseApi.getAnalytics().catch(() => null),
      ]);

      if (prodsData && locsData && analyticsData) {
        setProducts(prodsData);
        setLocations(locsData);
        setDemand(demandData || []);
        setRecommendations(recsData || []);
        setRoutes(routesData || []);
        setReplenishment(replenData || []);
        setAnalytics(analyticsData);
        setBackendOnline(true);
      } else {
        // Fallback to static seed data if backend is offline
        loadFallbackData();
      }
    } catch (err) {
      console.warn('Backend connection failed, falling back to local dataset snapshot:', err);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFallbackData = () => {
    setBackendOnline(false);
    // Use fallback snapshot if backend is not reachable in local test mode
    if (window.__SEED_DATA__) {
      const data = window.__SEED_DATA__;
      setProducts(data.products || []);
      setLocations(data.locations || []);
      setDemand(data.demand || []);
      setRecommendations(data.recommendations || []);
      setRoutes(data.routes || []);
      setReplenishment(data.replenishment || []);
      setAnalytics(data.analytics || null);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleApprove = async (recommendationId) => {
    try {
      if (backendOnline) {
        const resp = await warehouseApi.approveSlot(recommendationId);
        showToast(resp.message || `Slot ${recommendationId} approved successfully`, 'success');
        // Refresh recommendations & analytics
        const [updatedRecs, updatedAnalytics] = await Promise.all([
          warehouseApi.getSlotRecommendations(),
          warehouseApi.getAnalytics()
        ]);
        setRecommendations(updatedRecs);
        setAnalytics(updatedAnalytics);
      } else {
        // Optimistic UI update in offline fallback
        setRecommendations(prev =>
          prev.map(r => r.recommendationId === recommendationId ? { ...r, recommendationStatus: 'APPROVED' } : r)
        );
        showToast(`Slot recommendation ${recommendationId} approved (offline update)`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Approval failed: Check warehouse constraints', 'error');
    }
  };

  const handleReject = async (recommendationId) => {
    try {
      if (backendOnline) {
        const resp = await warehouseApi.rejectSlot(recommendationId);
        showToast(resp.message || `Slot ${recommendationId} rejected`, 'success');
        // Refresh
        const [updatedRecs, updatedAnalytics] = await Promise.all([
          warehouseApi.getSlotRecommendations(),
          warehouseApi.getAnalytics()
        ]);
        setRecommendations(updatedRecs);
        setAnalytics(updatedAnalytics);
      } else {
        // Optimistic update
        setRecommendations(prev =>
          prev.map(r => r.recommendationId === recommendationId ? { ...r, recommendationStatus: 'REJECTED' } : r)
        );
        showToast(`Slot recommendation ${recommendationId} rejected (offline update)`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  const counts = {
    products: products.length,
    locations: locations.length,
    demand: demand.length,
    recommendations: recommendations.length,
    routes: routes.length,
    replenishment: replenishment.length,
    pendingApproval: recommendations.filter(r => r.recommendationStatus === 'RECOMMENDED').length
  };

  return (
    <div className="dashboard-container">
      <Header analytics={analytics} backendOnline={backendOnline} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

      <main className="main-content">
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p>Loading CAP-12 Warehouse Management System...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <WarehouseOverview
                analytics={analytics}
                locations={locations}
                products={products}
              />
            )}
            {activeTab === 'products' && <ProductMaster products={products} />}
            {activeTab === 'locations' && <WarehouseLocations locations={locations} />}
            {activeTab === 'demand' && <DemandClassification demand={demand} />}
            {activeTab === 'recommendations' && (
              <SlotRecommendations
                recommendations={recommendations}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
            {activeTab === 'pickpath' && <PickPathOptimization routes={routes} />}
            {activeTab === 'replenishment' && (
              <ReplenishmentAlerts replenishment={replenishment} />
            )}
            {activeTab === 'approval' && (
              <SupervisorApproval
                recommendations={recommendations}
                onApprove={handleApprove}
                onReject={handleReject}
                toast={toast}
              />
            )}
            {activeTab === 'analytics' && (
              <PerformanceAnalytics
                analytics={analytics}
                routes={routes}
                recommendations={recommendations}
                replenishment={replenishment}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

