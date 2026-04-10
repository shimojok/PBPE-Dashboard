```python
"""
PBPE Coffee Impact Calculation Engine
Complete mathematical models for climate finance market creation
"""

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import json


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class CertificationLevel(Enum):
    BRONZE = "bronze"      # 20-35% yield increase
    SILVER = "silver"      # 35-50% yield increase
    GOLD = "gold"          # 50%+ yield increase
    PLATINUM = "platinum"  # Gold + carbon negative


@dataclass
class FarmMetrics:
    """Real-time farm metrics from AGRIX sensors"""
    farm_id: str
    area_ha: float
    location: Tuple[float, float]  # (latitude, longitude)
    
    # Yield metrics
    yield_base_kg_ha: float
    yield_current_kg_ha: float
    yield_projection_kg_ha: float
    
    # Soil metrics
    soc_percent: float
    soc_change_rate: float  # % per year
    soil_ph: float
    soil_moisture_percent: float
    bulk_density_g_cm3: float = 1.3
    soil_depth_cm: float = 30.0
    
    # Disease metrics
    rust_incidence: float  # 0-1
    rust_severity: float   # 0-1
    other_diseases: Dict[str, float] = field(default_factory=dict)
    
    # MBT55 application
    mbtt55_applied: bool = False
    mbtt55_application_date: Optional[datetime] = None
    mbtt55_application_rate_kg_ha: float = 0.0
    
    # Input usage
    chemical_fertilizer_kg_ha: float = 0.0
    pesticide_kg_ha: float = 0.0
    labor_hours_ha: float = 0.0
    
    # Quality metrics
    quality_score: float = 0.0  # Cupping score 0-100
    bean_size_screen: int = 0   # Screen size
    defect_percent: float = 0.0
    
    # Weather data
    avg_temperature_c: float = 25.0
    annual_rainfall_mm: float = 1500.0
    elevation_m: float = 1200.0
    
    # Timestamp
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class PBPECredit:
    """PBPE credit issuance record"""
    credit_id: str
    farm_id: str
    carbon_seq_tco2e: float
    yield_increase_kg: float
    quality_improvement_points: float
    total_credit_value_usd: float
    verification_hash: str
    issuance_date: datetime
    expiry_date: datetime
    certification_level: CertificationLevel


@dataclass
class FinancialProjection:
    """Financial projection results"""
    npv_usd: float
    irr_percent: float
    payback_years: float
    annual_cashflows: List[float]
    discounted_cashflows: List[float]
    roi_multiplier: float
    break_even_year: int


class PBPEImpactEngine:
    """
    Core calculation engine for PBPE impact metrics
    
    This engine implements the mathematical models defined in the PBPE
    architecture for quantifying climate, economic, and social impacts.
    """
    
    # Empirical constants from MBT55 trials
    YIELD_INCREASE_FACTOR = 0.35      # 35% average yield increase
    RUST_SUPPRESSION_RATE = 0.85      # 85% rust suppression
    CHEMICAL_REDUCTION_RATE = 0.40    # 40% fertilizer/pesticide reduction
    CARBON_SEQ_RATE_BASE = 2.5        # tCO₂e/ha/year base rate
    HUMIFICATION_FACTOR = 2.3         # MBT55 acceleration factor
    SAR_BOOST = 1.2                   # Systemic acquired resistance boost
    QUALITY_IMPROVEMENT_POINTS = 2.0  # Cupping score improvement
    
    # Layer multiplier constants
    LAYER_MULTIPLIERS = {
        "mbtt55_bio": 17.8,
        "agrix_intelligence": 1.4,
        "safelychain_tokenization": 1.8,
        "mabc_finance": 2.1
    }
    
    # Carbon sequestration parameters
    SOC_SEQUESTRATION_RATIO = 3.67    # tCO₂e per ton SOC
    ROOT_SHOOT_RATIO = 0.3            # Root biomass ratio
    BIOMASS_CARBON_FRACTION = 0.47    # Carbon fraction in biomass
    
    def __init__(self, 
                 carbon_price_usd: float = 80.0,
                 coffee_price_usd_kg: float = 3.50,
                 discount_rate: float = 0.08):
        """
        Initialize PBPE Impact Engine
        
        Args:
            carbon_price_usd: Price per tCO₂e in USD
            coffee_price_usd_kg: Base coffee price per kg in USD
            discount_rate: Discount rate for NPV calculations
        """
        self.carbon_price = carbon_price_usd
        self.coffee_price = coffee_price_usd_kg
        self.discount_rate = discount_rate
        
        # Quality premium matrix (USD per cupping point per kg)
        self.quality_premium_matrix = {
            (80, 85): 0.10,
            (85, 90): 0.20,
            (90, 95): 0.35,
            (95, 100): 0.50
        }
    
    def calculate_farmer_revenue(self, farm: FarmMetrics) -> Dict[str, float]:
        """
        Calculate farmer revenue with MBT55 application
        
        Equation:
        P_farmer = [Y_base × (1 + ΔY) × (1 - R × (1-η))] × (P + P_qual) 
                 + ΔC × P_carbon × λ 
                 - C_chem × (1 - γ)
        
        Returns:
            Dictionary with detailed revenue breakdown
        """
        # Yield component with disease suppression
        if farm.mbtt55_applied:
            yield_factor = 1 + self.YIELD_INCREASE_FACTOR
            rust_factor = 1 - farm.rust_incidence * farm.rust_severity * \
                         (1 - self.RUST_SUPPRESSION_RATE * self.SAR_BOOST)
        else:
            yield_factor = 1.0
            rust_factor = 1 - farm.rust_incidence * farm.rust_severity
        
        effective_yield = farm.yield_base_kg_ha * yield_factor * rust_factor
        
        # Quality premium calculation
        quality_delta = self.QUALITY_IMPROVEMENT_POINTS if farm.mbtt55_applied else 0
        quality_premium = self._calculate_quality_premium(
            farm.quality_score, 
            farm.quality_score + quality_delta
        )
        effective_price = self.coffee_price + quality_premium
        
        # Coffee revenue
        coffee_revenue = effective_yield * effective_price * farm.area_ha
        
        # Carbon sequestration calculation
        carbon_seq = self.calculate_carbon_sequestration(farm)
        permanence_factor = 0.85  # Long-term storage factor
        carbon_revenue = carbon_seq * self.carbon_price * permanence_factor * farm.area_ha
        
        # Input cost savings
        if farm.mbtt55_applied:
            chem_savings = (farm.chemical_fertilizer_kg_ha * 2.5 + 
                          farm.pesticide_kg_ha * 15) * self.CHEMICAL_REDUCTION_RATE
            mbtt55_cost = farm.mbtt55_application_rate_kg_ha * 120  # $120/kg MBT55
        else:
            chem_savings = 0
            mbtt55_cost = 0
        
        input_cost_savings = chem_savings * farm.area_ha
        total_mbtt55_cost = mbtt55_cost * farm.area_ha
        
        # Net revenue calculation
        net_revenue = coffee_revenue + carbon_revenue + input_cost_savings - total_mbtt55_cost
        
        # Additional revenue streams
        ecosystem_credits = self._calculate_ecosystem_credits(farm)
        insurance_payout = self._calculate_insurance_payout(farm)
        
        total_revenue = net_revenue + ecosystem_credits + insurance_payout
        
        return {
            "coffee_revenue_usd": coffee_revenue,
            "carbon_revenue_usd": carbon_revenue,
            "input_cost_savings_usd": input_cost_savings,
            "mbtt55_cost_usd": total_mbtt55_cost,
            "ecosystem_credits_usd": ecosystem_credits,
            "insurance_payout_usd": insurance_payout,
            "net_revenue_usd": net_revenue,
            "total_revenue_usd": total_revenue,
            "revenue_per_ha_usd": total_revenue / farm.area_ha,
            "effective_yield_kg_ha": effective_yield,
            "quality_score_final": farm.quality_score + quality_delta,
            "roi_multiplier": (total_revenue / (total_mbtt55_cost + 1)) if farm.mbtt55_applied else 1.0
        }
    
    def calculate_carbon_sequestration(self, farm: FarmMetrics) -> float:
        """
        Calculate carbon sequestration rate in tCO₂e/ha/year
        
        Equation:
        d(SOC)/dt = k_hum × B_microbe × f(T, moisture) × OM/(C/N) - k_resp × SOC × e^(Ea/RT)
        """
        if not farm.mbtt55_applied:
            return self.CARBON_SEQ_RATE_BASE * 0.3  # Baseline without MBT55
        
        # Temperature factor (optimum around 28°C)
        t_opt = 28.0
        t_factor = np.exp(-((farm.avg_temperature_c - t_opt) / 15) ** 2)
        
        # Moisture factor (optimum around 60% field capacity)
        moisture_opt = 60.0
        m_factor = np.exp(-((farm.soil_moisture_percent - moisture_opt) / 30) ** 2)
        
        # MBT55-enhanced sequestration
        base_seq = self.CARBON_SEQ_RATE_BASE
        enhanced_seq = base_seq * self.HUMIFICATION_FACTOR * t_factor * m_factor
        
        # Add biomass carbon
        biomass_carbon = self._calculate_biomass_carbon(farm)
        
        return enhanced_seq + biomass_carbon
    
    def _calculate_biomass_carbon(self, farm: FarmMetrics) -> float:
        """Calculate carbon stored in increased biomass"""
        if not farm.mbtt55_applied:
            return 0.0
        
        # Above-ground biomass increase
        yield_increase = farm.yield_base_kg_ha * self.YIELD_INCREASE_FACTOR
        ag_biomass = yield_increase * (1 + self.ROOT_SHOOT_RATIO)
        
        # Convert to carbon (tC/ha) then to tCO₂e/ha
        carbon_stored = ag_biomass * self.BIOMASS_CARBON_FRACTION / 1000
        co2e_stored = carbon_stored * self.SOC_SEQUESTRATION_RATIO
        
        return co2e_stored
    
    def _calculate_quality_premium(self, base_score: float, new_score: float) -> float:
        """Calculate quality premium based on cupping score"""
        for (min_score, max_score), premium in self.quality_premium_matrix.items():
            if min_score <= new_score < max_score:
                # Linear interpolation within range
                range_premium = premium
                if base_score >= min_score:
                    return range_premium * (new_score - base_score) / (max_score - min_score)
                else:
                    return range_premium * (new_score - min_score) / (max_score - min_score)
        return 0.0
    
    def _calculate_ecosystem_credits(self, farm: FarmMetrics) -> float:
        """Calculate ecosystem service credits"""
        if not farm.mbtt55_applied:
            return 0.0
        
        # Water quality improvement (reduced runoff)
        water_credit = farm.area_ha * 50  # $50/ha/year
        
        # Biodiversity improvement
        biodiversity_credit = farm.area_ha * 30  # $30/ha/year
        
        # Soil health improvement
        soil_credit = farm.area_ha * farm.soc_change_rate * 1000 * 0.5  # $0.5 per 0.1% SOC increase
        
        return water_credit + biodiversity_credit + soil_credit
    
    def _calculate_insurance_payout(self, farm: FarmMetrics) -> float:
        """Calculate parametric insurance payout based on conditions"""
        if not farm.mbtt55_applied:
            return 0.0
        
        payout = 0.0
        
        # Drought insurance
        if farm.soil_moisture_percent < 30:
            payout += farm.area_ha * 200
        
        # Disease insurance (already covered by MBT55 effectiveness)
        if farm.rust_incidence > 0.3:
            # Partial payout even with MBT55 for severe outbreaks
            base_loss = farm.yield_base_kg_ha * farm.rust_incidence * self.coffee_price
            mbtt55_protection = self.RUST_SUPPRESSION_RATE * self.SAR_BOOST
            uncovered_loss = base_loss * (1 - mbtt55_protection)
            payout += uncovered_loss * farm.area_ha * 0.8  # 80% coverage
        
        return payout
    
    def calculate_disease_avoidance(self, farm: FarmMetrics) -> Dict[str, float]:
        """
        Calculate economic value of disease avoidance through MBT55
        
        Equation:
        L_avoided = Area × Y_base × P × R_rust × Severity × η_MBT55 × (1 + θ_SAR)
        """
        if not farm.mbtt55_applied:
            return {
                "potential_loss_usd": 0.0,
                "avoided_loss_usd": 0.0,
                "suppression_rate": 0.0,
                "effective_protection": 0.0
            }
        
        # Potential loss without MBT55
        potential_loss = (farm.area_ha * farm.yield_base_kg_ha * self.coffee_price * 
                         farm.rust_incidence * farm.rust_severity)
        
        # Avoided loss with MBT55
        effective_protection = self.RUST_SUPPRESSION_RATE * self.SAR_BOOST
        avoided_loss = potential_loss * effective_protection
        
        # Additional avoidance from other diseases
        other_disease_avoidance = 0.0
        for disease, incidence in farm.other_diseases.items():
            other_disease_avoidance += (farm.area_ha * farm.yield_base_kg_ha * 
                                        self.coffee_price * incidence * 0.3 * effective_protection)
        
        total_avoided = avoided_loss + other_disease_avoidance
        
        return {
            "potential_loss_usd": potential_loss + other_disease_avoidance / effective_protection,
            "avoided_loss_usd": total_avoided,
            "suppression_rate": self.RUST_SUPPRESSION_RATE,
            "sar_boost": self.SAR_BOOST,
            "effective_protection": effective_protection,
            "rust_avoided_usd": avoided_loss,
            "other_diseases_avoided_usd": other_disease_avoidance
        }
    
    def calculate_scope3_impact(self, 
                                 coffee_purchase_kg: float,
                                 is_pbpe_certified: bool,
                                 certification_level: Optional[CertificationLevel] = None
                                 ) -> Dict[str, float]:
        """
        Calculate corporate Scope 3 reduction value
        
        Equation:
        V_corp = Q × ω_CO2e × P_carbon
        """
        if not is_pbpe_certified:
            return {
                "scope3_reduction_tco2e": 0.0,
                "value_usd": 0.0,
                "certification_level": None,
                "consumer_impact_statement": ""
            }
        
        # Base omega value (tCO₂e sequestered per ton coffee)
        omega_base = 2.5 / 1000  # Convert to tCO₂e/kg
        
        # Certification level multiplier
        level_multipliers = {
            CertificationLevel.BRONZE: 0.8,
            CertificationLevel.SILVER: 1.0,
            CertificationLevel.GOLD: 1.3,
            CertificationLevel.PLATINUM: 1.6
        }
        
        multiplier = level_multipliers.get(certification_level, 1.0)
        omega_co2e_per_kg = omega_base * multiplier
        
        scope3_reduction = coffee_purchase_kg * omega_co2e_per_kg
        value_usd = scope3_reduction * self.carbon_price
        
        # Consumer impact statement
        area_regenerated = coffee_purchase_kg * 0.25  # m² per kg
        impact_statement = f"Every cup regenerates {area_regenerated/250:.3f}m² of farmland"
        
        return {
            "scope3_reduction_tco2e": scope3_reduction,
            "value_usd": value_usd,
            "certification_level": certification_level.value if certification_level else None,
            "omega_co2e_per_kg": omega_co2e_per_kg,
            "area_regenerated_m2": area_regenerated,
            "consumer_impact_statement": impact_statement,
            "equivalent_trees_planted": scope3_reduction * 0.05  # 20 trees per tCO₂e
        }
    
    def calculate_capital_multiplier(self, 
                                      layer_investments: Dict[str, float]
                                      ) -> Dict[str, float]:
        """
        Calculate PBPE capital multiplier effect
        
        Equation:
        M_PBPE = Π (1 + μ_l)
        """
        cumulative = 1.0
        layer_results = {}
        
        for layer, multiplier in self.LAYER_MULTIPLIERS.items():
            cumulative *= multiplier
            layer_results[layer] = {
                "layer_multiplier": multiplier,
                "cumulative_multiplier": cumulative,
                "value_created_per_dollar": cumulative
            }
        
        total_investment = sum(layer_investments.values())
        total_value = total_investment * cumulative
        
        return {
            **layer_results,
            "total_multiplier": cumulative,
            "total_investment_usd": total_investment,
            "total_value_created_usd": total_value,
            "value_multiple": total_value / total_investment if total_investment > 0 else 0
        }
    
    def calculate_financial_projections(self,
                                        initial_investment: float,
                                        annual_cashflows: List[float],
                                        projection_years: int = 10
                                        ) -> FinancialProjection:
        """
        Calculate NPV, IRR, and other financial metrics
        
        Equation:
        NPV = Σ CF_t / (1+r)^t - I₀
        """
        # NPV calculation
        npv = -initial_investment
        discounted_cfs = []
        
        for t, cf in enumerate(annual_cashflows[:projection_years], 1):
            pv = cf / ((1 + self.discount_rate) ** t)
            npv += pv
            discounted_cfs.append(pv)
        
        # IRR calculation via binary search
        def npv_at_rate(rate: float) -> float:
            result = -initial_investment
            for t, cf in enumerate(annual_cashflows[:projection_years], 1):
                result += cf / ((1 + rate) ** t)
            return result
        
        irr = self._calculate_irr(npv_at_rate)
        
        # Payback period
        payback_years = self._calculate_payback(initial_investment, annual_cashflows)
        
        # ROI multiplier
        total_cashflow = sum(annual_cashflows[:projection_years])
        roi_multiplier = total_cashflow / initial_investment if initial_investment > 0 else 0
        
        # Break-even year
        break_even = self._find_break_even_year(initial_investment, annual_cashflows)
        
        return FinancialProjection(
            npv_usd=npv,
            irr_percent=irr * 100,
            payback_years=payback_years,
            annual_cashflows=annual_cashflows[:projection_years],
            discounted_cashflows=discounted_cfs,
            roi_multiplier=roi_multiplier,
            break_even_year=break_even
        )
    
    def _calculate_irr(self, npv_function, low: float = 0.0, high: float = 5.0, 
                      iterations: int = 100) -> float:
        """Binary search for IRR"""
        for _ in range(iterations):
            mid = (low + high) / 2
            npv = npv_function(mid)
            
            if abs(npv) < 0.01:
                return mid
            elif npv > 0:
                low = mid
            else:
                high = mid
        
        return (low + high) / 2
    
    def _calculate_payback(self, investment: float, cashflows: List[float]) -> float:
        """Calculate payback period in years"""
        cumulative = -investment
        
        for year, cf in enumerate(cashflows, 1):
            cumulative += cf
            if cumulative >= 0:
                # Linear interpolation for partial year
                if year > 1:
                    prev_cumulative = cumulative - cf
                    fraction = -prev_cumulative / cf
                    return year - 1 + fraction
                return float(year)
        
        return float('inf')
    
    def _find_break_even_year(self, investment: float, cashflows: List[float]) -> int:
        """Find first year with positive cumulative cash flow"""
        cumulative = -investment
        
        for year, cf in enumerate(cashflows, 1):
            cumulative += cf
            if cumulative >= 0:
                return year
        
        return -1
    
    def generate_pbpe_credit(self, farm: FarmMetrics) -> Optional[PBPECredit]:
        """Generate PBPE credit based on farm metrics"""
        if not farm.mbtt55_applied:
            return None
        
        # Calculate carbon sequestration
        carbon_seq = self.calculate_carbon_sequestration(farm)
        
        # Calculate yield increase
        yield_increase = farm.yield_base_kg_ha * self.YIELD_INCREASE_FACTOR * farm.area_ha
        
        # Determine certification level
        yield_increase_pct = (farm.yield_current_kg_ha - farm.yield_base_kg_ha) / farm.yield_base_kg_ha
        
        if yield_increase_pct >= 0.5 and carbon_seq >= 4.0:
            cert_level = CertificationLevel.PLATINUM
        elif yield_increase_pct >= 0.5:
            cert_level = CertificationLevel.GOLD
        elif yield_increase_pct >= 0.35:
            cert_level = CertificationLevel.SILVER
        else:
            cert_level = CertificationLevel.BRONZE
        
        # Calculate credit value
        carbon_value = carbon_seq * self.carbon_price * 0.85
        yield_value = yield_increase * self.coffee_price * 0.3
        quality_value = farm.quality_score * 10  # Simplified
        
        total_value = carbon_value + yield_value + quality_value
        
        # Generate verification hash
        import hashlib
        import uuid
        
        hash_input = f"{farm.farm_id}:{carbon_seq}:{yield_increase}:{farm.quality_score}:{datetime.now().isoformat()}"
        verification_hash = hashlib.sha256(hash_input.encode()).hexdigest()
        
        return PBPECredit(
            credit_id=str(uuid.uuid4()),
            farm_id=farm.farm_id,
            carbon_seq_tco2e=carbon_seq * farm.area_ha,
            yield_increase_kg=yield_increase,
            quality_improvement_points=self.QUALITY_IMPROVEMENT_POINTS,
            total_credit_value_usd=total_value,
            verification_hash=verification_hash,
            issuance_date=datetime.now(),
            expiry_date=datetime.now() + timedelta(days=365 * 5),  # 5 years
            certification_level=cert_level
        )
    
    def calculate_portfolio_impact(self, farms: List[FarmMetrics]) -> Dict[str, float]:
        """Calculate aggregate impact across a portfolio of farms"""
        total_area = sum(f.area_ha for f in farms)
        total_carbon_seq = sum(self.calculate_carbon_sequestration(f) * f.area_ha for f in farms if f.mbtt55_applied)
        total_yield_increase = sum(
            f.yield_base_kg_ha * self.YIELD_INCREASE_FACTOR * f.area_ha 
            for f in farms if f.mbtt55_applied
        )
        
        total_revenue = 0.0
        total_avoided_loss = 0.0
        
        for farm in farms:
            revenue = self.calculate_farmer_revenue(farm)
            disease = self.calculate_disease_avoidance(farm)
            total_revenue += revenue["total_revenue_usd"]
            total_avoided_loss += disease["avoided_loss_usd"]
        
        return {
            "total_farms": len(farms),
            "total_area_ha": total_area,
            "mbtt55_adoption_rate": sum(1 for f in farms if f.mbtt55_applied) / len(farms),
            "total_carbon_sequestration_tco2e": total_carbon_seq,
            "total_yield_increase_kg": total_yield_increase,
            "total_revenue_usd": total_revenue,
            "total_avoided_loss_usd": total_avoided_loss,
            "average_roi": total_revenue / (len([f for f in farms if f.mbtt55_applied]) * 235 * 10) if farms else 0,
            "carbon_value_usd": total_carbon_seq * self.carbon_price,
            "equivalent_trees_planted": total_carbon_seq * 0.05 * 20  # 20 trees per tCO₂e
        }
    
    def export_to_json(self, data: Dict) -> str:
        """Export calculation results to JSON"""
        def default_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            if isinstance(obj, Enum):
                return obj.value
            return str(obj)
        
        return json.dumps(data, default=default_serializer, indent=2)


# Example usage and simulation
if __name__ == "__main__":
    # Initialize engine
    engine = PBPEImpactEngine(
        carbon_price_usd=80.0,
        coffee_price_usd_kg=3.50,
        discount_rate=0.08
    )
    
    # Create sample farm
    farm = FarmMetrics(
        farm_id="ETH-001",
        area_ha=10.0,
        location=(7.5, 36.0),
        yield_base_kg_ha=1200.0,
        yield_current_kg_ha=1620.0,
        yield_projection_kg_ha=1700.0,
        soc_percent=1.2,
        soc_change_rate=0.3,
        soil_ph=6.2,
        soil_moisture_percent=55.0,
        rust_incidence=0.15,
        rust_severity=0.3,
        mbtt55_applied=True,
        mbtt55_application_rate_kg_ha=1.0,
        chemical_fertilizer_kg_ha=350.0,
        pesticide_kg_ha=5.0,
        quality_score=82.5,
        avg_temperature_c=24.0,
        annual_rainfall_mm=1600.0,
        elevation_m=1400.0
    )
    
    # Calculate impacts
    revenue = engine.calculate_farmer_revenue(farm)
    disease = engine.calculate_disease_avoidance(farm)
    credit = engine.generate_pbpe_credit(farm)
    
    print("=" * 60)
    print("PBPE Coffee Impact Calculation Results")
    print("=" * 60)
    print(f"\nFarm: {farm.farm_id}")
    print(f"Area: {farm.area_ha} ha")
    print(f"MBT55 Applied: {farm.mbtt55_applied}")
    print(f"\n--- Revenue Breakdown ---")
    print(f"Coffee Revenue: ${revenue['coffee_revenue_usd']:,.2f}")
    print(f"Carbon Revenue: ${revenue['carbon_revenue_usd']:,.2f}")
    print(f"Input Cost Savings: ${revenue['input_cost_savings_usd']:,.2f}")
    print(f"Ecosystem Credits: ${revenue['ecosystem_credits_usd']:,.2f}")
    print(f"Total Revenue: ${revenue['total_revenue_usd']:,.2f}")
    print(f"Revenue per Hectare: ${revenue['revenue_per_ha_usd']:,.2f}")
    print(f"ROI Multiplier: {revenue['roi_multiplier']:.1f}x")
    
    print(f"\n--- Disease Avoidance ---")
    print(f"Potential Loss: ${disease['potential_loss_usd']:,.2f}")
    print(f"Avoided Loss: ${disease['avoided_loss_usd']:,.2f}")
    print(f"Effective Protection: {disease['effective_protection']*100:.1f}%")
    
    if credit:
        print(f"\n--- PBPE Credit Generated ---")
        print(f"Credit ID: {credit.credit_id[:8]}...")
        print(f"Carbon Sequestered: {credit.carbon_seq_tco2e:.2f} tCO₂e")
        print(f"Credit Value: ${credit.total_credit_value_usd:,.2f}")
        print(f"Certification: {credit.certification_level.value.upper()}")
    
    print("\n" + "=" * 60)
```
