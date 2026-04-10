import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface BondData {
  id: string;
  name: string;
  faceValue: number;
  couponRate: number;
  maturity: number;
  carbonTarget: number;
  issuedAmount: number;
  price: number;
  yield: number;
}

interface PortfolioData {
  asset: string;
  allocation: number;
  value: number;
  expectedReturn: number;
  risk: number;
}

interface MarketData {
  date: string;
  carbonPrice: number;
  coffeePrice: number;
  bondIndex: number;
}

const FinanceEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bonds' | 'portfolio' | 'market'>('bonds');
  const [bonds, setBonds] = useState<BondData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    expectedReturn: 0,
    portfolioRisk: 0,
    sharpeRatio: 0,
  });

  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    const mockBonds: BondData[] = [
      {
        id: 'RCB-2024-001',
        name: 'Sidama Regenerative Bond',
        faceValue: 1000,
        couponRate: 6.0,
        maturity: 10,
        carbonTarget: 25000,
        issuedAmount: 5000000,
        price: 1020,
        yield: 5.8,
      },
      {
        id: 'RCB-2024-002',
        name: 'Cerrado Climate Bond',
        faceValue: 1000,
        couponRate: 5.5,
        maturity: 7,
        carbonTarget: 15000,
        issuedAmount: 3000000,
        price: 995,
        yield: 5.7,
      },
      {
        id: 'CLT-2024-001',
        name: 'Colombia Carbon-Linked Token',
        faceValue: 500,
        couponRate: 7.0,
        maturity: 5,
        carbonTarget: 8000,
        issuedAmount: 2000000,
        price: 515,
        yield: 6.5,
      },
      {
        id: 'YLT-2024-001',
        name: 'Ethiopia Yield Token',
        faceValue: 250,
        couponRate: 8.0,
        maturity: 3,
        carbonTarget: 5000,
        issuedAmount: 1500000,
        price: 260,
        yield: 7.2,
      },
    ];
    setBonds(mockBonds);

    const mockPortfolio: PortfolioData[] = [
      { asset: 'Regenerative Bonds', allocation: 40, value: 4000000, expectedReturn: 7.0, risk: 5.0 },
      { asset: 'Carbon Tokens', allocation: 30, value: 3000000, expectedReturn: 15.0, risk: 25.0 },
      { asset: 'Yield Tokens', allocation: 15, value: 1500000, expectedReturn: 18.0, risk: 20.0 },
      { asset: 'Ecosystem Credits', allocation: 10, value: 1000000, expectedReturn: 10.0, risk: 15.0 },
      { asset: 'Cash Reserve', allocation: 5, value: 500000, expectedReturn: 2.0, risk: 0.5 },
    ];
    setPortfolio(mockPortfolio);

    const totalValue = mockPortfolio.reduce((sum, p) => sum + p.value, 0);
    const weightedReturn = mockPortfolio.reduce((sum, p) => sum + p.expectedReturn * p.allocation / 100, 0);
    const weightedRisk = Math.sqrt(
      mockPortfolio.reduce((sum, p) => sum + Math.pow(p.risk * p.allocation / 100, 2), 0)
    );
    
    setPortfolioStats({
      totalValue,
      expectedReturn: weightedReturn,
      portfolioRisk: weightedRisk,
      sharpeRatio: (weightedReturn - 2.0) / weightedRisk,
    });

    const mockMarket: MarketData[] = [];
    for (let i = 180; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockMarket.push({
        date: date.toISOString().split('T')[0],
        carbonPrice: 75 + Math.sin(i * 0.05) * 15 + i * 0.1,
        coffeePrice: 3.2 + Math.sin(i * 0.03) * 0.8 + i * 0.005,
        bondIndex: 100 + i * 0.08 + Math.sin(i * 0.02) * 5,
      });
    }
    setMarketData(mockMarket);
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const COLORS = ['#2e7d32', '#1565c0', '#ff6f00', '#6a1b9a', '#90a4ae'];

  return (
    <div>
      <div className="header">
        <h1>Finance Engine</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('bonds')}
            className={`btn ${activeTab === 'bonds' ? 'btn-primary' : 'btn-outline'}`}
          >
            Bonds
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`btn ${activeTab === 'portfolio' ? 'btn-primary' : 'btn-outline'}`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`btn ${activeTab === 'market' ? 'btn-primary' : 'btn-outline'}`}
          >
            Market Data
          </button>
          <button className="btn btn-primary">Execute Trade</button>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card metric-card">
          <div className="metric-label">Portfolio Value</div>
          <div className="metric-value">{formatCurrency(portfolioStats.totalValue)}</div>
          <div className="metric-trend positive">▲ 12.5% YTD</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Expected Return</div>
          <div className="metric-value">{portfolioStats.expectedReturn.toFixed(1)}%</div>
          <div className="metric-trend positive">▲ 1.2% vs benchmark</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Portfolio Risk</div>
          <div className="metric-value">{portfolioStats.portfolioRisk.toFixed(1)}%</div>
          <div className="metric-trend positive">▼ 2.3% vs market</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value">{portfolioStats.sharpeRatio.toFixed(2)}</div>
          <div className="metric-trend positive">▲ 0.15 vs benchmark</div>
        </div>
      </div>

      {activeTab === 'bonds' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Available Bonds & Tokens</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Face Value</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Coupon</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Maturity (yrs)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Carbon Target</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Issued</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Yield</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bonds.map(bond => (
                  <tr key={bond.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{bond.name}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>{bond.id}</span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(bond.faceValue)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{bond.couponRate}%</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{bond.maturity}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{bond.carbonTarget.toLocaleString()} tCO₂e</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(bond.issuedAmount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(bond.price)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2e7d32' }}>{bond.yield}%</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Yield Curve</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bonds.sort((a, b) => a.maturity - b.maturity)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="maturity" label={{ value: 'Years to Maturity', position: 'bottom' }} />
                  <YAxis label={{ value: 'Yield (%)', angle: -90, position: 'left' }} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Line type="monotone" dataKey="yield" stroke="#2e7d32" strokeWidth={2} name="PBPE Bond Yield" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'portfolio' && (
        <>
          <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Asset Allocation</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="asset"
                      label={({ asset, allocation }) => `${asset} (${allocation}%)`}
                    >
                      {portfolio.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Risk-Return Profile</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" label={{ value: 'Expected Return (%)', angle: -90, position: 'left' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Risk (%)', angle: 90, position: 'right' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="expectedReturn" fill="#2e7d32" name="Expected Return (%)" />
                    <Bar yAxisId="right" dataKey="risk" fill="#f44336" name="Risk (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Portfolio Holdings</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Asset Class</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Allocation</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Market Value</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Expected Return</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Risk</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Risk-Adj Return</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => (
                  <tr key={p.asset} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem' }}>{p.asset}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{p.allocation}%</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.value)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{p.expectedReturn}%</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{p.risk}%</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2e7d32' }}>
                      {(p.expectedReturn / p.risk).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'market' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Carbon Price Trend</h2>
            <div className="chart-container-large">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Area type="monotone" dataKey="carbonPrice" stroke="#2e7d32" fill="#a5d6a7" name="Carbon Price ($/tCO₂e)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="card">
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Coffee Price Trend</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}/kg`} />
                    <Line type="monotone" dataKey="coffeePrice" stroke="#ff6f00" strokeWidth={2} name="Coffee Price ($/kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>PBPE Bond Index</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[95, 'auto']} />
                    <Tooltip formatter={(value: number) => value.toFixed(2)} />
                    <Line type="monotone" dataKey="bondIndex" stroke="#1565c0" strokeWidth={2} name="PBPE Bond Index" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceEngine;
