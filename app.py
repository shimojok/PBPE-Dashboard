import streamlit as st
import pandas as pd
import numpy as np
import sys
sys.path.append('./models')

from coffee_impact import PBPEImpactEngine, FarmMetrics
from carbon_sequestration import CarbonSequestrationEngine

st.set_page_config(
    page_title="PBPE Dashboard",
    page_icon="🌍",
    layout="wide"
)

# サイドバー
st.sidebar.title("🌍 PBPE Dashboard")
tab = st.sidebar.radio(
    "メニュー",
    ["Dashboard", "Carbon Ledger", "Impact Simulator", "Yield Predictor", "Finance Engine"]
)

# メイン表示
if tab == "Dashboard":
    st.title("PBPE Dashboard")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("総炭素隔離量", "1.25M tCO₂e", "+12.5%")
    with col2:
        st.metric("アクティブ農家数", "50,000", "+8.3%")
    with col3:
        st.metric("総ロック価値", "$5.0B", "+15.2%")
    with col4:
        st.metric("農家ROI", "17.8x", "+23%")

elif tab == "Carbon Ledger":
    st.title("Carbon Ledger")
    # 炭素隔離データのグラフ表示
    chart_data = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=30, freq='D'),
        'sequestration': np.random.normal(40000, 10000, 30).cumsum()
    })
    st.line_chart(chart_data.set_index('date'))

elif tab == "Impact Simulator":
    st.title("Impact Simulator")
    
    area = st.slider("農場面積 (ha)", 1, 100, 10)
    mbtt55 = st.checkbox("MBT55適用", True)
    
    if mbtt55:
        revenue = area * 4177
        st.metric("推定収益", f"${revenue:,.0f}", f"+{110}%")
    else:
        revenue = area * 1850
        st.metric("推定収益", f"${revenue:,.0f}", "基準値")
