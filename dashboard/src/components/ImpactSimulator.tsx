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
  RadialBarChart,
  RadialBar,
} from 'recharts';

interface SimulationParams {
  areaHa: number;
  baselineYield: number;
  coffeePrice: number;
  carbonPrice: number;
  mbtt55Applied: boolean;
  rustRisk: number;
  projectionYears: number;
}

interface SimulationResult {
  year: number;
  yield: number;
  revenue: number;
  carbonSeq: number;
  carbonRevenue: number;
  totalRevenue: number;
  avoidedLoss: number;
  netProfit: number;
}

const ImpactSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    areaHa: 10,
    baselineYield: 1200,
    coffeePrice: 3.50,
    carbonPrice: 80,
    mbtt55Applied: true,
    rustRisk: 60,
    projectionYears: 5,
  });

  const [results, setResults] = useState<SimulationResult[]>([]);
  const [summary, setSummary] = useState({
    totalYieldIncrease: 0,
    totalCarbonSeq: 0,
    totalRevenue: 0,
    totalAvoidedLoss: 0,
    roi: 0,
    npv: 0,
  });

  const [activeScenario, setActiveScenario] = useState<'baseline' | 'mbtt55' | 'comparison'>('comparison');

  useEffect(() => {
  // activeScenario に応じてパラメータを自動設定
  if (activeScenario === 'baseline') {
    setParams(prev => ({ ...prev, mbtt55Applied: false }));
  } else if (activeScenario === 'mbtt55') {
    setParams(prev => ({ ...prev, mbtt55Applied: true }));
  }
  // simulate() は params の変更を検知して自動実行される
}, [activeScenario]);  // activeScenario が変わったときも実行

// params が変わったらシミュレーション実行
useEffect(() => {
  simulate();
}, [params]);

  const simulate = () => {
    const results: SimulationResult[] = [];
    const YIELD_INCREASE = params.mbtt55Applied ? 0.35 : 0;
    const RUST_SUPPRESSION = params.mbtt55Applied ? 0.85 : 0;
    const CARBON_SEQ_RATE = params.mbtt55Applied ? 2.5 : 0.75;
    const SAR_BOOST = 1.2;

    let totalYieldIncrease = 0;
    let totalCarbonSeq = 0;
    let totalRevenue = 0;
    let totalAvoidedLoss = 0;

    for (let year = 1; year <= params.projectionYears; year++) {
      const rustImpact = 1 - (params.rustRisk / 100) * (1 - RUST_SUPPRESSION * SAR_BOOST);
      const effectiveYield = params.baselineYield * (1 + YIELD_INCREASE) * rustImpact;
      const yieldTotal = effectiveYield * params.areaHa;
      
      const coffeeRevenue = yieldTotal * params.coffeePrice;
      const carbonSeq = CARBON_SEQ_RATE * params.areaHa;
      const carbonRevenue = carbonSeq * params.carbonPrice * 0.85;
      
      const potentialLoss = params.baselineYield * params.areaHa * params.coffeePrice * (params.rustRisk / 100) * 0.7;
      const avoidedLoss = potentialLoss * RUST_SUPPRESSION * SAR_BOOST;
      
      const inputCostSavings = params.mbtt55Applied ? 140 * params.areaHa : 0;
      const mbtt55Cost = params.mbtt55Applied ? 120 * params.areaHa : 0;
      
      const totalYearRevenue = coffeeRevenue + carbonRevenue + avoidedLoss + inputCostSavings - mbtt55Cost;
      
      results.push({
        year,
        yield: effectiveYield,
        revenue: coffeeRevenue,
        carbonSeq,
        carbonRevenue,
        totalRevenue: totalYearRevenue,
        avoidedLoss,
        netProfit: totalYearRevenue - mbtt55Cost,
      });

      totalYieldIncrease += (effectiveYield - params.baselineYield) * params.areaHa;
      totalCarbonSeq += carbonSeq;
      totalRevenue += totalYearRevenue;
      totalAvoidedLoss += avoidedLoss;
    }

    setResults(results);

    const investment = params.mbtt55Applied ? 235 * params.areaHa : 0;
    const totalBenefit = totalRevenue;
    const roi = investment > 0 ? (totalBenefit - investment) / investment : 0;
    
    const discountRate = 0.08;
    let npv = -investment;
    results.forEach((r, i) => {
      npv += r.totalRevenue / Math.pow(1 + discountRate, i + 1);
    });

    setSummary({
      totalYieldIncrease,
      totalCarbonSeq,
      totalRevenue,
      totalAvoidedLoss,
      roi: roi * 100,
      npv,
    });
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const comparisonData = [
    { name: 'Yield (kg/ha)', baseline: 1200, mbtt55: 1620, improvement: 35 },
    { name: 'Revenue ($/ha)', baseline: 4200, mbtt55: 5670, improvement: 35 },
    { name: 'Carbon Seq (tCO₂e/ha)', baseline: 0.75, mbtt55: 2.5, improvement: 233 },
    { name: 'Net Profit ($/ha)', baseline: 1850, mbtt55: 3892, improvement: 110 },
  ];

  const sdgImpactData = [
    { name: 'SDG 1: No Poverty', value: 110, fill: '#E5243B' },
    { name: 'SDG 2: Zero Hunger', value: 40, fill: '#DDA63A' },
    { name: 'SDG 13: Climate Action', value: 233, fill: '#3F7E44' },
    { name: 'SDG 15: Life on Land', value: 85, fill: '#56C02B' },
  ];

  return (
    <div>
      <div className="header">
        <h1>Impact Simulator</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveScenario('baseline')}
            className={`btn ${activeScenario === 'baseline' ? 'btn-primary' : 'btn-outline'}`}
          >
            Baseline
          </button>
          <button
            onClick={() => setActiveScenario('mbtt55')}
            className={`btn ${activeScenario === 'mbtt55' ? 'btn-primary' : 'btn-outline'}`}
          >
            MBT55
          </button>
          <button
            onClick={() => setActiveScenario('comparison')}
            className={`btn ${activeScenario === 'comparison' ? 'btn-primary' : 'btn-outline'}`}
          >
            Comparison
          </button>
          <button className="btn btn-primary">Export Report</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Simulation Parameters</h2>
        <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Farm Area (ha)
            </label>
            <input
              type="number"
              value={params.areaHa}
              onChange={(e) => setParams({ ...params, areaHa: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Baseline Yield (kg/ha)
            </label>
            <input
              type="number"
              value={params.baselineYield}
              onChange={(e) => setParams({ ...params, baselineYield: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Coffee Price ($/kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={params.coffeePrice}
              onChange={(e) => setParams({ ...params, coffeePrice: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Carbon Price ($/tCO₂e)
            </label>
            <input
              type="number"
              value={params.carbonPrice}
              onChange={(e) => setParams({ ...params, carbonPrice: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Rust Risk (%)
            </label>
            <input
              type="number"
              value={params.rustRisk}
              onChange={(e) => setParams({ ...params, rustRisk: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
              Projection Years
            </label>
            <input
              type="number"
              value={params.projectionYears}
              onChange={(e) => setParams({ ...params, projectionYears: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={params.mbtt55Applied}
                onChange={(e) => setParams({ ...params, mbtt55Applied: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>MBT55 Applied</span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card metric-card">
          <div className="metric-label">Total Yield Increase</div>
          <div className="metric-value">{formatNumber(summary.totalYieldIncrease)} kg</div>
          <div className="metric-trend positive">▲ {params.mbtt55Applied ? '35' : '0'}% vs baseline</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Total Carbon Seq</div>
          <div className="metric-value">{summary.totalCarbonSeq.toFixed(1)} tCO₂e</div>
          <div className="metric-trend positive">▲ {params.mbtt55Applied ? '233' : '0'}% vs baseline</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatCurrency(summary.totalRevenue)}</div>
          <div className="metric-trend positive">Over {params.projectionYears} years</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">ROI</div>
          <div className="metric-value">{summary.roi.toFixed(0)}%</div>
          <div className="metric-trend positive">NPV: {formatCurrency(summary.npv)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Revenue Projection</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#2e7d32" name="Coffee Revenue" />
                <Bar dataKey="carbonRevenue" fill="#1565c0" name="Carbon Revenue" />
                <Bar dataKey="avoidedLoss" fill="#ff6f00" name="Avoided Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Cumulative Impact</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="totalRevenue" stroke="#2e7d32" strokeWidth={2} name="Total Revenue" />
                <Line type="monotone" dataKey="netProfit" stroke="#1565c0" strokeWidth={2} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Baseline vs MBT55 Comparison</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#90a4ae" name="Baseline" />
                <Bar dataKey="mbtt55" fill="#2e7d32" name="MBT55" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>SDG Impact Contribution</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="20%"
                outerRadius="80%"
                data={sdgImpactData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise={true}
                  dataKey="value"
                  label={{ fill: '#666', position: 'insideStart', fontSize: 10 }}
                />
                <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Detailed Annual Breakdown</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666' }}>Year</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Yield (kg/ha)</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Coffee Revenue</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Carbon Seq (tCO₂e)</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Carbon Revenue</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Avoided Loss</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.year} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.75rem' }}>Year {r.year}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{r.yield.toFixed(0)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(r.revenue)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{r.carbonSeq.toFixed(1)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(r.carbonRevenue)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2e7d32' }}>{formatCurrency(r.avoidedLoss)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>
                  {formatCurrency(r.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImpactSimulator;
