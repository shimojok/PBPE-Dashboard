# PBPE‑Dashboard I/O Specification

### Economic Visualization Layer — Input/Output Contract

### Version 1.0 (Canonical English Edition)

---

## 1. Purpose

This document defines the **input/output contract** for the PBPE‑Dashboard.  
The dashboard converts scientific outputs from upstream engines into:

- PBPE Value (USD)
- PBPE Credits
- Economic indicators
- Financial‑layer inputs

This specification is authoritative for all PBPE‑Dashboard integrations.

---

## 2. Upstream Inputs

PBPE‑Dashboard receives data from four engines:

- AGRIX‑OS
- MBT‑Biosecurity‑Engine
- HealthBook‑AI
- MBT Probiotics

All inputs must follow the schemas below.

---

## 2.1 AGRIX → PBPE‑Dashboard

### **Entity: AGRIXInput**

|Field|Type|Description|
|---|---|---|
|yield_actual|float|Actual yield (t/ha)|
|disease_incidence|float|Disease incidence (%)|
|soil_carbon_baseline_tc|float|Baseline SOC (tC/ha)|
|microclimate_temperature|float|°C|
|microclimate_humidity|float|0–1|
|crop_stress_index|float|0–1|
|ndvi|float|Vegetation index|
|evi|float|Enhanced vegetation index|
|canopy_temperature|float|°C|

---

## 2.2 MBT‑Biosecurity‑Engine → PBPE‑Dashboard

### **Entity: BiosecurityKPIInput**

|KPI|Field Name|Type|Description|
|---|---|---|---|
|1|disease_loss_reduction_pct|float|% reduction|
|2|yield_gain_pct|float|% increase|
|3|quality_premium_score|float|Composite score|
|4|anti_spoilage_pct|float|% reduction|
|5|food_loss_reduction_t|float|Tons|
|6|cost_reduction_usd|float|USD|
|7|livestock_biosecurity_score|float|0–1|
|8|delta_c_tc_per_ha|float|tC/ha|
|9|ghg_reduction_tco2e|float|tCO₂e|
|10|price_stability_index|float|0–1|
|11|pbpe_biosecurity_value_usd|float|USD|
|12|biosecurity_roi_pct|float|%|

---

## 2.3 HealthBook‑AI → PBPE‑Dashboard

### **Entity: HealthBookInput**

|Field|Type|Description|
|---|---|---|
|antibiotic_reduction_pct|float|% reduction|
|zoonotic_risk_reduction_pct|float|% reduction|
|one_health_index|float|0–1|
|livestock_productivity_gain_pct|float|% increase|

---

## 2.4 MBT Probiotics → PBPE‑Dashboard

### **Entity: ProbioticsInput**

|Field|Type|Description|
|---|---|---|
|enteric_methane_reduction_tco2e|float|tCO₂e|
|livestock_fcr_improvement_pct|float|% improvement|
|livestock_antibiotic_reduction_pct|float|% reduction|
|livestock_infection_reduction_pct|float|% reduction|

---

# 3. Internal Processing

PBPE‑Dashboard performs three internal transformations.

---

## 3.1 Scientific → Economic Conversion

### **Entity: PBPEValue**

```
PBPE_Value_USD =
    Disease_Loss_Reduction_USD
  + Cost_Reduction_USD
  + Yield_Gain_USD
  + Quality_Premium_USD
  + Food_Loss_Reduction_USD
  + Climate_Credits_USD
```

---

## 3.2 Credit Generation

### **Entity: PBPEDashboardCredits**

|Credit Type|Field|Type|
|---|---|---|
|Biosecurity Credits|biosecurity_credits|float|
|Carbon Credits|carbon_credits_tco2|float|
|Food Loss Credits|food_loss_credits_t|float|
|Quality Credits|quality_credits_score|float|
|Price Stability Credits|price_stability_credits_score|float|

---

## 3.3 Economic Indicators

### **Entity: EconomicIndicators**

|Field|Type|Description|
|---|---|---|
|farmer_income_uplift_pct|float|%|
|supply_stability_score|float|0–1|
|regional_pbpe_value_usd|float|USD|
|sector_pbpe_value_usd|float|USD|
|corporate_scope3_reduction_tco2e|float|tCO₂e|
|climate_impact_score|float|0–1|

---

# 4. Downstream Outputs

PBPE‑Dashboard outputs data to:

- PBPE‑Finance
- PBPE‑Marketplace

---

## 4.1 PBPE‑Dashboard → PBPE‑Finance

### **Entity: FinanceInput**

|Field|Type|
|---|---|
|pbpe_biosecurity_value_usd|float|
|biosecurity_credits|float|
|carbon_credits_tco2|float|
|food_loss_credits_t|float|
|quality_credits_score|float|
|price_stability_credits_score|float|
|farmer_income_uplift_pct|float|
|regional_pbpe_value_usd|float|
|sector_pbpe_value_usd|float|

---

## 4.2 PBPE‑Dashboard → PBPE‑Marketplace

### **Entity: MarketplaceInput**

|Field|Type|
|---|---|
|verified_credits|object|
|scope3_reduction_tco2e|float|
|corporate_impact_report|object|
|regional_impact_map|object|
|buyer_dashboard_data|object|

---

# 5. API Specification

---

## 5.1 GET /dashboard/kpi/{farm_id}

**Returns:**  
`BiosecurityKPIInput` + `AGRIXInput` + `HealthBookInput` + `ProbioticsInput`

---

## 5.2 GET /dashboard/pbpe_value/{farm_id}

**Returns:**  
`PBPEValue` + breakdown

---

## 5.3 GET /dashboard/credits/{farm_id}

**Returns:**  
`PBPEDashboardCredits`

---

## 5.4 GET /dashboard/impact/global

**Returns:**  
Global PBPE Value, ΔC, GHG reduction, food loss reduction

---

# 6. Data Model Mapping

PBPE‑Dashboard consumes:

```
MBT-Biosecurity-Engine/08_Dashboard/Data_Model.json
```

Mapping:

|Data Model Field|Dashboard Field|
|---|---|
|CropPerformance.*|yield, disease, quality|
|PostHarvest.*|spoilage, marketable yield|
|SoilClimate.*|delta_c, ch4, n2o|
|Livestock.*|biosecurity score|
|Economics.*|price, income|
|PBPECredits.*|credits|

---
