import streamlit as st
import sys
import os
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# ===== デバッグ（確認後削除） =====
import importlib.util, sys

# models パッケージとして登録
models_path = os.path.join(BASE_DIR, 'models')

import models
st.write("models location:", models.__file__)
st.write("models.__path__:", models.__path__)

try:
    from models.carbon_sequestration import CarbonSequestrationEngine
    st.write("✅ インポートOK")
except Exception as e:
    st.exception(e)
st.stop()
# ==================================

from models.coffee_impact import PBPEImpactEngine, FarmMetrics, CertificationLevel
from models.carbon_sequestration import CarbonSequestrationEngine, SoilProfile, ClimateData, ManagementPractice, SoilType, ClimateZone
from models.financial_engine import FinancialEngine, BondParameters, MarketConditions, BondType, RiskProfile

# ページ設定
st.set_page_config(
    page_title="🌍 PBPE Planetary Dashboard",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSSカスタマイズ
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #2e7d32;
        text-align: center;
        margin-bottom: 1rem;
    }
    .kpi-card {
        background: #1e1e1e;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #333;
        text-align: center;
    }
    .kpi-value {
        font-size: 2rem;
        font-weight: bold;
        color: #4caf50;
    }
    .kpi-label {
        font-size: 0.9rem;
        color: #b0b0b0;
        margin-top: 0.5rem;
    }
    .insight-box {
        background: linear-gradient(135deg, #1b5e20, #2e7d32);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# エンジンの初期化
@st.cache_resource
def init_engines():
    coffee_engine = PBPEImpactEngine(carbon_price_usd=80.0, coffee_price_usd_kg=3.50)
    carbon_engine = CarbonSequestrationEngine()
    financial_engine = FinancialEngine(discount_rate=0.08)
    return coffee_engine, carbon_engine, financial_engine

coffee_engine, carbon_engine, financial_engine = init_engines()

# サイドバー
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/000000/coffee-beans-.png", width=80)
    st.title("🌍 PBPE Dashboard")
    st.markdown("---")
    tab = st.radio(
        "📊 メニュー",
        ["🏠 Dashboard", "🌱 Carbon Ledger", "📈 Impact Simulator", 
         "🌾 Yield Predictor", "💰 Finance Engine", "🌡️ Climate Impact"],
        label_visibility="visible"
    )
    st.markdown("---")
    st.markdown("**System Status**")
    st.success("✅ All systems operational")
    st.caption(f"Last updated: {datetime.now().strftime('%H:%M:%S')}")

# ==================== Dashboard ====================
if tab == "🏠 Dashboard":
    st.markdown('<h1 class="main-header">🌍 PBPE Planetary Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("### 気候変動ファイナンス市場創出プラットフォーム")
    
    # KPIカード
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown('<div class="kpi-card"><div class="kpi-value">1.25M</div><div class="kpi-label">総炭素隔離量 (tCO₂e)</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown('<div class="kpi-card"><div class="kpi-value">50,000</div><div class="kpi-label">アクティブ農家数</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown('<div class="kpi-card"><div class="kpi-value">$5.0B</div><div class="kpi-label">総ロック価値 (TVL)</div></div>', unsafe_allow_html=True)
    with col4:
        st.markdown('<div class="kpi-card"><div class="kpi-value">94.1x</div><div class="kpi-label">システム乗数</div></div>', unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 資本フローと炭素隔離の2列表示
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("💰 資本フロー概要")
        flow_data = pd.DataFrame({
            'Layer': ['Investors', 'MABC Bonds', 'SafelyChain', 'AGRIX', 'Farms'],
            'Value': [50000, 20000, 49250, 45310, 41770]
        })
        st.bar_chart(flow_data.set_index('Layer'))
        
    with col2:
        st.subheader("🌱 炭素隔離トレンド")
        dates = pd.date_range('2024-01-01', periods=90, freq='D')
        carbon_data = pd.DataFrame({
            'date': dates,
            'sequestration': np.cumsum(np.random.normal(40000, 10000, 90))
        })
        st.line_chart(carbon_data.set_index('date'))
    
    # 主要指標
    st.markdown("---")
    st.subheader("📊 主要パフォーマンス指標")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("農家ROI", "17.8x", "+23%")
    with col2:
        st.metric("炭素隔離速度", "2.5 tCO₂e/ha/年", "+233%")
    with col3:
        st.metric("さび病抑制率", "85%", "+35%")
    with col4:
        st.metric("化学肥料削減", "40%", "-140 kg/ha")

# ==================== Carbon Ledger ====================
elif tab == "🌱 Carbon Ledger":
    st.markdown('<h1 class="main-header">🌱 Carbon Ledger</h1>', unsafe_allow_html=True)
    
    # 期間選択
    time_range = st.selectbox("期間", ["7日間", "30日間", "90日間", "1年間"], index=1)
    days = {"7日間": 7, "30日間": 30, "90日間": 90, "1年間": 365}[time_range]
    
    # 炭素隔離データ生成
    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
    carbon_data = pd.DataFrame({
        'date': dates,
        'Daily Sequestration (tCO₂e)': np.random.normal(40000, 10000, days),
        'Cumulative (tCO₂e)': np.cumsum(np.random.normal(40000, 10000, days))
    })
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("日次炭素隔離量")
        st.line_chart(carbon_data.set_index('date')['Daily Sequestration (tCO₂e)'])
    with col2:
        st.subheader("累積炭素貯留量")
        st.area_chart(carbon_data.set_index('date')['Cumulative (tCO₂e)'])
    
    # 農場別データ
    st.subheader("🌍 農場別炭素クレジット")
    farm_data = pd.DataFrame({
        'Farm': ['Sidama Estate', 'Finca Paraiso', 'Fazenda Izabel', 'Hacienda Minita', 'Karatu Farm'],
        'Country': ['Ethiopia', 'Colombia', 'Brazil', 'Costa Rica', 'Kenya'],
        'Area (ha)': [250, 180, 500, 120, 90],
        'Credits (tCO₂e)': [625, 450, 1250, 360, 225],
        'Revenue ($)': [50000, 36000, 100000, 28800, 18000]
    })
    st.dataframe(farm_data, use_container_width=True)
    st.bar_chart(farm_data.set_index('Farm')['Credits (tCO₂e)'])

# ==================== Impact Simulator ====================
elif tab == "📈 Impact Simulator":
    st.markdown('<h1 class="main-header">📈 Impact Simulator</h1>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        area_ha = st.number_input("農場面積 (ha)", min_value=1, max_value=1000, value=10)
    with col2:
        coffee_price = st.number_input("コーヒー価格 ($/kg)", min_value=1.0, max_value=10.0, value=3.50, step=0.10)
    with col3:
        carbon_price = st.number_input("炭素価格 ($/tCO₂e)", min_value=10, max_value=200, value=80, step=5)
    
    mbtt55 = st.checkbox("🌱 MBT55/HMT238適用", value=True)
    
    # 計算
    if mbtt55:
        yield_val = 1200 * 1.35 * area_ha
        carbon_seq = 2.5 * area_ha
        revenue = yield_val * coffee_price + carbon_seq * carbon_price * 0.85
        cost = 235 * area_ha
        profit = revenue - cost
        roi = profit / cost
    else:
        yield_val = 1200 * area_ha
        carbon_seq = 0.75 * area_ha
        revenue = yield_val * coffee_price
        cost = 350 * area_ha
        profit = revenue - cost
        roi = profit / cost if cost > 0 else 0
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("収量", f"{yield_val:,.0f} kg", f"+{35 if mbtt55 else 0}%")
    with col2:
        st.metric("炭素隔離", f"{carbon_seq:,.1f} tCO₂e", f"+{233 if mbtt55 else 0}%")
    with col3:
        st.metric("収益", f"${revenue:,.0f}", f"+{110 if mbtt55 else 0}%")
    with col4:
        st.metric("ROI", f"{roi:.1f}x", f"{'✅' if roi > 10 else '❌'}")
    
    # 比較グラフ
    st.subheader("Baseline vs MBT55 比較")
    comparison = pd.DataFrame({
        'Metric': ['Yield (kg/ha)', 'Revenue ($/ha)', 'Carbon (tCO₂e/ha)', 'Profit ($/ha)'],
        'Baseline': [1200, 4200, 0.75, 1850],
        'MBT55': [1620, 5670, 2.5, 3892]
    })
    st.bar_chart(comparison.set_index('Metric'))

# ==================== Yield Predictor ====================
elif tab == "🌾 Yield Predictor":
    st.markdown('<h1 class="main-header">🌾 Yield Predictor</h1>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        farm_select = st.selectbox("農場選択", ["Sidama Estate (Ethiopia)", "Finca Paraiso (Colombia)", "Fazenda Izabel (Brazil)"])
    with col2:
        months = st.slider("予測期間 (月)", 1, 12, 6)
    
    # 予測データ
    months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    current_month = datetime.now().month
    pred_months = months_labels[current_month-1:] + months_labels[:current_month-1]
    pred_months = pred_months[:months]
    
    base_yield = 1350 if "Sidama" in farm_select else 1280 if "Paraiso" in farm_select else 1420
    predictions = [base_yield * (1 + 0.02*i + np.random.normal(0, 0.03)) for i in range(months)]
    
    pred_df = pd.DataFrame({
        'Month': pred_months,
        'Predicted Yield (kg/ha)': predictions,
        'Upper Bound': [p * 1.08 for p in predictions],
        'Lower Bound': [p * 0.92 for p in predictions]
    })
    
    st.subheader("収量予測（信頼区間付き）")
    st.line_chart(pred_df.set_index('Month')[['Predicted Yield (kg/ha)', 'Upper Bound', 'Lower Bound']])
    
    # 病害リスク
    st.subheader("🛡️ 病害リスク評価")
    rust_risk = pd.DataFrame({
        'Month': pred_months,
        'Rust Risk (%)': [max(0, min(100, 15 + 25*np.sin(i*0.8) + np.random.normal(0, 5))) for i in range(months)]
    })
    st.bar_chart(rust_risk.set_index('Month'))

# ==================== Finance Engine ====================
elif tab == "💰 Finance Engine":
    st.markdown('<h1 class="main-header">💰 Finance Engine</h1>', unsafe_allow_html=True)
    
    finance_tab = st.selectbox("セクション", ["債券一覧", "ポートフォリオ", "市場データ"])
    
    if finance_tab == "債券一覧":
        st.subheader("📋 利用可能な債券・トークン")
        bonds = pd.DataFrame({
            'Name': ['Sidama Regenerative Bond', 'Cerrado Climate Bond', 'Colombia Carbon Token', 'Ethiopia Yield Token'],
            'Type': ['Regenerative', 'Climate', 'Carbon-Linked', 'Yield-Linked'],
            'Face Value': ['$1,000', '$1,000', '$500', '$250'],
            'Coupon': ['6.0%', '5.5%', '7.0%', '8.0%'],
            'Maturity': ['10年', '7年', '5年', '3年'],
            'Yield': ['5.8%', '5.7%', '6.5%', '7.2%']
        })
        st.dataframe(bonds, use_container_width=True)
        
    elif finance_tab == "ポートフォリオ":
        st.subheader("📊 最適ポートフォリオ配分")
        portfolio = pd.DataFrame({
            'Asset': ['Regenerative Bonds', 'Carbon Tokens', 'Yield Tokens', 'Ecosystem Credits', 'Cash'],
            'Allocation (%)': [40, 30, 15, 10, 5],
            'Expected Return (%)': [7.0, 15.0, 18.0, 10.0, 2.0],
            'Risk (%)': [5.0, 25.0, 20.0, 15.0, 0.5]
        })
        st.dataframe(portfolio, use_container_width=True)
        
        col1, col2 = st.columns(2)
        with col1:
            st.bar_chart(portfolio.set_index('Asset')['Allocation (%)'])
        with col2:
            st.bar_chart(portfolio.set_index('Asset')[['Expected Return (%)', 'Risk (%)']])
        
    elif finance_tab == "市場データ":
        st.subheader("📈 炭素価格推移")
        market_dates = pd.date_range(end=datetime.now(), periods=180, freq='D')
        market_data = pd.DataFrame({
            'date': market_dates,
            'Carbon Price ($/tCO₂e)': 75 + np.cumsum(np.random.normal(0.1, 0.5, 180)),
            'Coffee Price ($/kg)': 3.2 + np.cumsum(np.random.normal(0.005, 0.05, 180))
        })
        st.line_chart(market_data.set_index('date'))

# ==================== Climate Impact ====================
elif tab == "🌡️ Climate Impact":
    st.markdown('<h1 class="main-header">🌡️ Climate Impact Analysis</h1>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="insight-box">
        <h3>💡 重要インサイト</h3>
        <p>気候変動が進むほど、PBPE農業の相対的優位性が拡大します。<br>
        SSP5-8.5シナリオ（+4.4℃）では、PBPE農業の収益性は従来農業の <b>1.9倍</b> に達します。</p>
    </div>
    """, unsafe_allow_html=True)
    
    # 緩和効果
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("🌍 炭素緩和効果（年間）")
        mitigation = pd.DataFrame({
            'Category': ['土壌炭素', 'バイオ炭', 'N₂O削減', '森林伐採回避', '輸送削減'],
            'Amount (MtCO₂e/yr)': [12.5, 5.0, 3.0, 8.0, 1.5]
        })
        st.bar_chart(mitigation.set_index('Category'))
    
    with col2:
        st.subheader("🛡️ 気候レジリエンス比較")
        resilience = pd.DataFrame({
            'ストレス': ['高温', '干ばつ', '豪雨', '病害虫'],
            '従来農業 (%)': [25, 40, 35, 30],
            'PBPE農業 (%)': [8, 15, 12, 5]
        })
        st.bar_chart(resilience.set_index('ストレス'))

# フッター
st.markdown("---")
st.caption("© 2026 PBPE Initiative | Planetary Bio-Phenome Engine | Contact: info@terraviss.com")
