import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

interface CarbonLedgerProps {
  simplified?: boolean;
}

interface CarbonData {
  date: string;
  sequestration: number;
  cumulative: number;
  credits: number;
}

interface FarmCarbonData {
  farmId: string;
  farmName: string;
  country: string;
  area: number;
  sequestration: number;
  credits: number;
}

const CarbonLedger: React.FC<CarbonLedgerProps> = ({ simplified = false }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [carbonData, setCarbonData] = useState<CarbonData[]>([]);
  const [farmData, setFarmData] = useState<FarmCarbonData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSeq: 0,
    totalCredits: 0,
    activeFarms: 0,
    avgSeqPerHa: 0,
  });

  useEffect(() => {
    // Generate mock data
    const generateData = () => {
      const data: CarbonData[] = [];
      const now = new Date();
      let cumulative = 1250000;
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const sequestration = 40000 + Math.random() * 10000;
        cumulative += sequestration;
        
        data.push({
          date: date.toISOString().split('T')[0],
          sequestration: Math.round(sequestration),
          cumulative: Math.round(cumulative),
          credits: Math.round(sequestration * 0.8),
        });
      }
      
      return data;
    };

    const generateFarmData = (): FarmCarbonData[] => {
      return [
        { farmId: 'ETH-001', farmName: 'Sidama Coffee Estate', country: 'Ethiopia', area: 250, sequestration: 625, credits: 500 },
        { farmId: 'COL-042', farmName: 'Finca El Paraiso', country: 'Colombia', area: 180, sequestration: 450, credits: 360 },
        { farmId: 'BRA-178', farmName: 'Fazenda Santa Izabel', country: 'Brazil', area: 500, sequestration: 1250, credits: 1000 },
        { farmId: 'CRI-023', farmName: 'Hacienda La Minita', country: 'Costa Rica', area: 120, sequestration: 360, credits: 288 },
        { farmId: 'KEN-089', farmName: 'Karatu Coffee Farm', country: 'Kenya', area: 90, sequestration: 225, credits: 180 },
        { farmId: 'GTM-056', farmName: 'Finca El Injerto', country: 'Guatemala', area: 150, sequestration: 375, credits: 300 },
        { farmId: 'IDN-112', farmName: 'Kintamani Highland', country: 'Indonesia', area: 200, sequestration: 500, credits: 400 },
        { farmId: 'VNM-034', farmName: 'Da Lat Coffee Farm', country: 'Vietnam', area: 300, sequestration: 600, credits: 480 },
      ];
    };

    const data = generateData();
    const farms = generateFarmData();
    
    setCarbonData(data);
    setFarmData(farms);
    
    setTotalStats({
      totalSeq: data[data.length - 1].cumulative,
      totalCredits: farms.reduce((sum, f) => sum + f.credits, 0),
      activeFarms: farms.length,
      avgSeqPerHa: 2.5,
    });
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const COLORS = ['#2e7d32', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'];

  if (simplified) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={carbonData.slice(-30)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="sequestration" stroke="#2e7d32" fill="#a5d6a7" name="Sequestration (tCO₂e)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Carbon Ledger</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['7d', '30d', '90d', '1y'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`btn ${timeRange === range ? 'btn-primary' : 'btn-outline'}`}
            >
              {range}
            </button>
          ))}
          <button className="btn btn-primary">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card metric-card">
          <div className="metric-label">Total Carbon Sequestered</div>
          <div className="metric-value">{formatNumber(totalStats.totalSeq)} tCO₂e</div>
          <div className="metric-trend positive">▲ 12.5% vs last period</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Carbon Credits Issued</div>
          <div className="metric-value">{formatNumber(totalStats.totalCredits)} credits</div>
          <div className="metric-trend positive">▲ 8.3% vs last period</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Active Farms</div>
          <div className="metric-value">{totalStats.activeFarms}</div>
          <div className="metric-trend positive">▲ 5 new this month</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Avg Sequestration</div>
          <div className="metric-value">{totalStats.avgSeqPerHa} tCO₂e/ha</div>
          <div className="metric-trend positive">▲ 0.3 vs baseline</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Carbon Sequestration Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sequestration" stroke="#2e7d32" fill="#a5d6a7" name="Daily Sequestration (tCO₂e)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Cumulative Carbon Storage</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carbonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cumulative" stroke="#1565c0" strokeWidth={2} name="Cumulative (tCO₂e)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Carbon Credits by Farm</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={farmData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="credits"
                  nameKey="farmName"
                  label={({ farmName }) => farmName.split(' ')[0]}
                >
                  {farmData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Farm Carbon Performance</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Farm</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Area (ha)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Seq (tCO₂e)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {farmData.slice(0, 5).map(farm => (
                <tr key={farm.farmId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <strong>{farm.farmName}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{farm.country}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{farm.area}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{farm.sequestration}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2e7d32', fontWeight: 600 }}>
                    {farm.credits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Verifications</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Transaction Hash</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Farm</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Amount (tCO₂e)</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                0x7a3f...e9d2
              </td>
              <td style={{ padding: '0.75rem' }}>Sidama Coffee Estate</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>125.5</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ color: '#4caf50' }}>✓ Verified</span>
              </td>
              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#666' }}>2 min ago</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                0x3b8f...a2c1
              </td>
              <td style={{ padding: '0.75rem' }}>Finca El Paraiso</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>89.3</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ color: '#4caf50' }}>✓ Verified</span>
              </td>
              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#666' }}>15 min ago</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                0x9e2d...f4b7
              </td>
              <td style={{ padding: '0.75rem' }}>Fazenda Santa Izabel</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>210.8</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ color: '#ff9800' }}>⏳ Pending</span>
              </td>
              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#666' }}>1 hour ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CarbonLedger;
