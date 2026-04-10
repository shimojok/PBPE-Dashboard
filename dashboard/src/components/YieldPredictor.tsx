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
  ComposedChart,
  Bar,
} from 'recharts';

interface WeatherData {
  month: string;
  temperature: number;
  rainfall: number;
  humidity: number;
}

interface YieldPrediction {
  month: string;
  predicted: number;
  actual?: number;
  upperBound: number;
  lowerBound: number;
  rustRisk: number;
}

const YieldPredictor: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState('ETH-001');
  const [predictionHorizon, setPredictionHorizon] = useState(6);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [predictions, setPredictions] = useState<YieldPrediction[]>([]);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 92,
    rmse: 85,
    mape: 8.2,
    r2: 0.89,
  });

  const farms = [
    { id: 'ETH-001', name: 'Sidama Coffee Estate', country: 'Ethiopia' },
    { id: 'COL-042', name: 'Finca El Paraiso', country: 'Colombia' },
    { id: 'BRA-178', name: 'Fazenda Santa Izabel', country: 'Brazil' },
  ];

  useEffect(() => {
    generateMockData();
  }, [selectedFarm]);

  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const weather: WeatherData[] = [];
    for (let i = 0; i < 12; i++) {
      const monthIdx = (currentMonth + i) % 12;
      weather.push({
        month: months[monthIdx],
        temperature: 18 + Math.sin(i * 0.5) * 8 + Math.random() * 2,
        rainfall: 100 + Math.sin(i * 0.8) * 80 + Math.random() * 30,
        humidity: 65 + Math.sin(i * 0.3) * 15 + Math.random() * 5,
      });
    }
    setWeatherData(weather);

    const preds: YieldPrediction[] = [];
    let baseYield = selectedFarm === 'ETH-001' ? 1350 : selectedFarm === 'COL-042' ? 1280 : 1420;
    
    for (let i = 0; i < predictionHorizon; i++) {
      const monthIdx = (currentMonth + i) % 12;
      const seasonalFactor = 1 + Math.sin(monthIdx * 0.5) * 0.15;
      const trendFactor = 1 + i * 0.02;
      const predicted = baseYield * seasonalFactor * trendFactor;
      const uncertainty = predicted * 0.08 * (1 + i * 0.1);
      
      preds.push({
        month: months[monthIdx],
        predicted: Math.round(predicted),
        upperBound: Math.round(predicted + uncertainty),
        lowerBound: Math.round(predicted - uncertainty),
        rustRisk: Math.round(15 + Math.sin(monthIdx * 0.8) * 25 + Math.random() * 10),
      });
    }
    setPredictions(preds);
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  const riskLevel = (risk: number): { color: string; label: string } => {
    if (risk < 20) return { color: '#4caf50', label: 'Low' };
    if (risk < 40) return { color: '#ff9800', label: 'Medium' };
    if (risk < 60) return { color: '#f44336', label: 'High' };
    return { color: '#b71c1c', label: 'Critical' };
  };

  return (
    <div>
      <div className="header">
        <h1>Yield Predictor</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              background: 'white',
            }}
          >
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>
                {farm.name} ({farm.country})
              </option>
            ))}
          </select>
          <select
            value={predictionHorizon}
            onChange={(e) => setPredictionHorizon(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              background: 'white',
            }}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
          <button className="btn btn-primary" onClick={generateMockData}>
            Refresh Prediction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card metric-card">
          <div className="metric-label">Model Accuracy</div>
          <div className="metric-value">{modelMetrics.accuracy}%</div>
          <div className="metric-trend positive">▲ 3% vs last season</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">RMSE</div>
          <div className="metric-value">{modelMetrics.rmse} kg/ha</div>
          <div className="metric-trend positive">▼ 12 vs last season</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">MAPE</div>
          <div className="metric-value">{modelMetrics.mape}%</div>
          <div className="metric-trend positive">▼ 1.2% vs last season</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">R² Score</div>
          <div className="metric-value">{modelMetrics.r2}</div>
          <div className="metric-trend positive">▲ 0.05 vs last season</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Yield Forecast with Confidence Interval</h2>
          <div className="chart-container-large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip formatter={(value: number) => `${formatNumber(value)} kg/ha`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#a5d6a7"
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#c8e6c9"
                  name="Lower Bound"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#2e7d32"
                  strokeWidth={3}
                  name="Predicted Yield"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Weather Forecast</h2>
          <div className="chart-container-large">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherData.slice(0, predictionHorizon)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f44336"
                  name="Temperature (°C)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rainfall"
                  stroke="#1565c0"
                  name="Rainfall (mm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Disease Risk Assessment</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rustRisk" name="Rust Risk (%)">
                  {predictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskLevel(entry.rustRisk).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Monthly Prediction Details</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Month</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Predicted (kg/ha)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Range</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>Rust Risk</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(p => {
                const risk = riskLevel(p.rustRisk);
                return (
                  <tr key={p.month} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem' }}>{p.month}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {formatNumber(p.predicted)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                      {formatNumber(p.lowerBound)} - {formatNumber(p.upperBound)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        background: risk.color,
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {risk.label} ({p.rustRisk}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recommendations</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#2e7d32' }}>
              🌱 Agronomic Recommendations
            </h3>
            <ul style={{ fontSize: '0.875rem', color: '#666', paddingLeft: '1.25rem' }}>
              <li>Apply MBT55 in next 2 weeks for optimal rust protection</li>
              <li>Increase irrigation by 15% during predicted dry spell in 3 months</li>
              <li>Schedule pruning before flowering peak in month 4</li>
            </ul>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1565c0' }}>
              💰 Financial Recommendations
            </h3>
            <ul style={{ fontSize: '0.875rem', color: '#666', paddingLeft: '1.25rem' }}>
              <li>Lock in carbon credits now at current $80/tCO₂e price</li>
              <li>Consider yield-linked token issuance for months 4-6</li>
              <li>Premium quality expected: target specialty buyers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPredictor;
