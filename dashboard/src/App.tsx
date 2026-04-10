import React, { useState, useEffect } from 'react';
import {
  CapitalFlowVisualizer,
  CarbonLedger,
  ImpactSimulator,
  YieldPredictor,
  FinanceEngine,
} from '@components';
import { PBPEImpactEngine } from '@models/coffee_impact';

// Icons (using simple SVG components)
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M7 15l3-3 3 3 4-4" />
  </svg>
);

const LeafIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C12 2 8 6 8 12c0 2.5 1.5 4.5 4 5.5" />
    <path d="M12 2c0 0 4 4 4 10 0 2.5-1.5 4.5-4 5.5" />
  </svg>
);

const FinanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M8 8l8 8M16 8l-8 8" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type TabType = 'dashboard' | 'carbon' | 'simulator' | 'yield' | 'finance';

interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: number;
  trendLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ value, label, trend, trendLabel }) => {
  const isPositive = trend !== undefined && trend >= 0;
  
  return (
    <div className="card metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {trend !== undefined && (
        <div className={`metric-trend ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
          {trendLabel && <span> {trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCarbonSeq: 0,
    activeFarmers: 0,
    totalValueLocked: 0,
    coffeePurchased: 0,
    farmerROI: 0,
    systemMultiplier: 0,
  });

  useEffect(() => {
    // Simulate loading initial data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalCarbonSeq: 1250000,
        activeFarmers: 50000,
        totalValueLocked: 5000000000,
        coffeePurchased: 400000000,
        farmerROI: 17.8,
        systemMultiplier: 94.1,
      });
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num}`;
  };

  const formatCarbon = (tco2e: number): string => {
    if (tco2e >= 1e6) return `${(tco2e / 1e6).toFixed(2)}M tCO₂e`;
    if (tco2e >= 1e3) return `${(tco2e / 1e3).toFixed(1)}K tCO₂e`;
    return `${tco2e} tCO₂e`;
  };

  const sidebarItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'carbon' as TabType, label: 'Carbon Ledger', icon: <LeafIcon /> },
    { id: 'simulator' as TabType, label: 'Impact Simulator', icon: <ChartIcon /> },
    { id: 'yield' as TabType, label: 'Yield Predictor', icon: <ChartIcon /> },
    { id: 'finance' as TabType, label: 'Finance Engine', icon: <FinanceIcon /> },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div className="spinner" />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="header">
              <h1>PBPE Dashboard</h1>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline">
                  Last 30 Days ▼
                </button>
                <button className="btn btn-primary">
                  Export Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
              <MetricCard
                value={formatCarbon(metrics.totalCarbonSeq)}
                label="Total Carbon Sequestered"
                trend={12.5}
                trendLabel="vs last month"
              />
              <MetricCard
                value={metrics.activeFarmers.toLocaleString()}
                label="Active Farmers"
                trend={8.3}
                trendLabel="vs last month"
              />
              <MetricCard
                value={formatNumber(metrics.totalValueLocked)}
                label="Total Value Locked"
                trend={15.2}
                trendLabel="vs last month"
              />
              <MetricCard
                value={`${(metrics.coffeePurchased / 1e6).toFixed(1)}M kg`}
                label="Coffee Purchased"
                trend={5.7}
                trendLabel="vs last month"
              />
            </div>

            <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Capital Flow Overview</h2>
                <div className="chart-container">
                  <CapitalFlowVisualizer simplified />
                </div>
              </div>
              <div className="card">
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Carbon Sequestration Trend</h2>
                <div className="chart-container">
                  <CarbonLedger simplified />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="card">
                <div className="metric-label">Farmer ROI</div>
                <div className="metric-value">{metrics.farmerROI.toFixed(1)}x</div>
                <div className="metric-trend positive">▲ 23% vs baseline</div>
              </div>
              <div className="card">
                <div className="metric-label">System Multiplier</div>
                <div className="metric-value">{metrics.systemMultiplier.toFixed(1)}x</div>
                <div className="metric-trend positive">▲ 12% vs target</div>
              </div>
              <div className="card">
                <div className="metric-label">Scope 3 Reduction</div>
                <div className="metric-value">$80M</div>
                <div className="metric-trend positive">Annual value</div>
              </div>
            </div>
          </div>
        );
      
      case 'carbon':
        return <CarbonLedger />;
      
      case 'simulator':
        return <ImpactSimulator />;
      
      case 'yield':
        return <YieldPredictor />;
      
      case 'finance':
        return <FinanceEngine />;
      
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            🌍 PBPE
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Planetary Bio-Phenome Engine
          </p>
        </div>

        <nav>
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                marginBottom: '0.25rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === item.id ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === item.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <strong>System Status</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'var(--color-success)',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '0.75rem' }}>All systems operational</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
