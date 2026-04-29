"""
PBPE Financial Engine
Advanced financial modeling for climate finance instruments
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime, timedelta
import math


class BondType(Enum):
    REGENERATIVE_COFFEE = "regenerative_coffee"
    CARBON_LINKED = "carbon_linked"
    YIELD_LINKED = "yield_linked"
    ECOSYSTEM_SERVICE = "ecosystem_service"


class RiskProfile(Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


@dataclass
class BondParameters:
    """Parameters for bond issuance"""
    bond_type: BondType
    face_value_usd: float
    coupon_rate_bps: int  # Basis points
    maturity_years: int
    total_supply: int
    carbon_target_tco2e: Optional[float] = None
    yield_target_kg: Optional[float] = None
    ecosystem_metric: Optional[str] = None


@dataclass
class MarketConditions:
    """Current market conditions"""
    risk_free_rate: float  # e.g., 0.04 for 4%
    carbon_price_usd: float
    coffee_price_usd_kg: float
    volatility_index: float
    credit_spread_bps: int
    inflation_expectation: float


@dataclass
class CashFlowProjection:
    """Projected cash flows"""
    periods: List[int]
    coupon_payments: List[float]
    principal_repayment: List[float]
    carbon_linked_payments: List[float]
    total_cash_flows: List[float]
    npv: float
    irr: float
    duration: float
    convexity: float


@dataclass
class PortfolioAllocation:
    """Optimal portfolio allocation"""
    regenerative_bonds: float
    carbon_tokens: float
    yield_tokens: float
    ecosystem_credits: float
    cash_reserve: float
    expected_return: float
    portfolio_risk: float
    sharpe_ratio: float


class FinancialEngine:
    """
    Advanced financial modeling engine for PBPE instruments
    """
    
    def __init__(self, discount_rate: float = 0.08):
        self.discount_rate = discount_rate
        
        # Asset class expected returns and risks
        self.asset_returns = {
            BondType.REGENERATIVE_COFFEE: 0.07,
            BondType.CARBON_LINKED: 0.15,
            BondType.YIELD_LINKED: 0.18,
            BondType.ECOSYSTEM_SERVICE: 0.10
        }
        
        self.asset_risks = {
            BondType.REGENERATIVE_COFFEE: 0.05,
            BondType.CARBON_LINKED: 0.25,
            BondType.YIELD_LINKED: 0.20,
            BondType.ECOSYSTEM_SERVICE: 0.15
        }
        
        # Correlation matrix
        self.correlation_matrix = np.array([
            [1.0, 0.3, 0.2, 0.4],  # Regenerative
            [0.3, 1.0, 0.5, 0.3],  # Carbon
            [0.2, 0.5, 1.0, 0.2],  # Yield
            [0.4, 0.3, 0.2, 1.0]   # Ecosystem
        ])
    
    def price_bond(self,
                   params: BondParameters,
                   market: MarketConditions
                   ) -> float:
        """
        Price a bond using discounted cash flow analysis
        """
        face_value = params.face_value_usd
        coupon_rate = params.coupon_rate_bps / 10000
        maturity = params.maturity_years
        total_supply = params.total_supply
        
        # Adjust discount rate for credit risk
        adjusted_rate = market.risk_free_rate + (market.credit_spread_bps / 10000)
        
        # Calculate present value of coupon payments
        coupon_payment = face_value * coupon_rate
        pv_coupons = sum([
            coupon_payment / ((1 + adjusted_rate) ** t)
            for t in range(1, maturity + 1)
        ])
        
        # Present value of principal
        pv_principal = face_value / ((1 + adjusted_rate) ** maturity)
        
        base_price = pv_coupons + pv_principal
        
        # Add carbon premium if applicable
        if params.carbon_target_tco2e:
            carbon_premium = self._calculate_carbon_premium(
                params.carbon_target_tco2e,
                market.carbon_price_usd
            )
            base_price += carbon_premium
        
        return base_price * total_supply
    
    def _calculate_carbon_premium(self,
                                   carbon_target: float,
                                   carbon_price: float
                                   ) -> float:
        """Calculate premium for carbon-linked features"""
        expected_carbon_value = carbon_target * carbon_price
        probability_achievement = 0.85  # Based on MBT55 track record
        return expected_carbon_value * probability_achievement * 0.3  # 30% passed to bondholders
    
    def project_cash_flows(self,
                           params: BondParameters,
                           market: MarketConditions,
                           carbon_achievement_curve: Optional[List[float]] = None
                           ) -> CashFlowProjection:
        """
        Project cash flows over bond life with carbon performance
        """
        maturity = params.maturity_years
        face_value = params.face_value_usd
        base_coupon_rate = params.coupon_rate_bps / 10000
        
        periods = list(range(1, maturity + 1))
        coupon_payments = []
        carbon_linked_payments = []
        
        for t in periods:
            # Dynamic coupon rate based on carbon performance
            if carbon_achievement_curve and t <= len(carbon_achievement_curve):
                achievement_rate = carbon_achievement_curve[t - 1]
                adjusted_rate = self._adjust_coupon_for_carbon(
                    base_coupon_rate,
                    achievement_rate
                )
            else:
                adjusted_rate = base_coupon_rate
            
            coupon = face_value * adjusted_rate
            coupon_payments.append(coupon)
            
            # Carbon-linked bonus at maturity
            if t == maturity and params.carbon_target_tco2e:
                if carbon_achievement_curve:
                    final_achievement = carbon_achievement_curve[-1]
                    if final_achievement >= 1.0:
                        carbon_bonus = params.carbon_target_tco2e * market.carbon_price_usd * 0.1
                        carbon_linked_payments.append(carbon_bonus)
                    else:
                        carbon_linked_payments.append(0)
                else:
                    carbon_linked_payments.append(0)
            else:
                carbon_linked_payments.append(0)
        
        # Principal repayment at maturity
        principal_repayment = [0] * (maturity - 1) + [face_value]
        
        # Total cash flows
        total_cash_flows = [
            coupon_payments[i] + carbon_linked_payments[i] + principal_repayment[i]
            for i in range(maturity)
        ]
        
        # NPV calculation
        npv = -self.price_bond(params, market)
        for t, cf in enumerate(total_cash_flows, 1):
            npv += cf / ((1 + self.discount_rate) ** t)
        
        # IRR calculation
        irr = self._calculate_irr(
            [-self.price_bond(params, market)] + total_cash_flows
        )
        
        # Duration and convexity
        duration = self._calculate_duration(
            total_cash_flows,
            self.discount_rate
        )
        
        convexity = self._calculate_convexity(
            total_cash_flows,
            self.discount_rate
        )
        
        return CashFlowProjection(
            periods=periods,
            coupon_payments=coupon_payments,
            principal_repayment=principal_repayment,
            carbon_linked_payments=carbon_linked_payments,
            total_cash_flows=total_cash_flows,
            npv=npv,
            irr=irr,
            duration=duration,
            convexity=convexity
        )
    
    def _adjust_coupon_for_carbon(self,
                                   base_rate: float,
                                   achievement_rate: float
                                   ) -> float:
        """Adjust coupon rate based on carbon performance"""
        if achievement_rate >= 1.0:
            return base_rate + 0.0050  # +50 bps
        elif achievement_rate >= 0.8:
            return base_rate
        elif achievement_rate >= 0.5:
            return max(0, base_rate - 0.0025)  # -25 bps
        else:
            return max(0, base_rate - 0.0050)  # -50 bps
    
    def _calculate_irr(self, cash_flows: List[float]) -> float:
        """Calculate IRR using Newton-Raphson method"""
        def npv(rate):
            return sum(cf / ((1 + rate) ** t) for t, cf in enumerate(cash_flows))
        
        def npv_derivative(rate):
            return sum(-t * cf / ((1 + rate) ** (t + 1)) 
                      for t, cf in enumerate(cash_flows[1:], 1))
        
        rate = 0.10
        for _ in range(100):
            npv_val = npv(rate)
            npv_deriv = npv_derivative(rate)
            
            if abs(npv_deriv) < 1e-10:
                break
            
            new_rate = rate - npv_val / npv_deriv
            
            if abs(new_rate - rate) < 1e-8:
                return new_rate
            
            rate = new_rate
        
        return rate
    
    def _calculate_duration(self,
                            cash_flows: List[float],
                            discount_rate: float
                            ) -> float:
        """Calculate Macaulay duration"""
        pv_cfs = [cf / ((1 + discount_rate) ** t) for t, cf in enumerate(cash_flows, 1)]
        total_pv = sum(pv_cfs)
        
        if total_pv == 0:
            return 0.0
        
        weighted_sum = sum(t * pv for t, pv in enumerate(pv_cfs, 1))
        return weighted_sum / total_pv
    
    def _calculate_convexity(self,
                             cash_flows: List[float],
                             discount_rate: float
                             ) -> float:
        """Calculate bond convexity"""
        pv_cfs = [cf / ((1 + discount_rate) ** t) for t, cf in enumerate(cash_flows, 1)]
        total_pv = sum(pv_cfs)
        
        if total_pv == 0:
            return 0.0
        
        weighted_sum = sum(t * (t + 1) * pv for t, pv in enumerate(pv_cfs, 1))
        return weighted_sum / (total_pv * (1 + discount_rate) ** 2)
    
    def optimize_portfolio(self,
                           total_capital: float,
                           risk_profile: RiskProfile,
                           constraints: Optional[Dict] = None
                           ) -> PortfolioAllocation:
        """
        Optimize portfolio allocation using Modern Portfolio Theory
        """
        asset_types = list(self.asset_returns.keys())
        n_assets = len(asset_types)
        
        # Expected returns vector
        returns = np.array([self.asset_returns[a] for a in asset_types])
        
        # Covariance matrix
        risks = np.array([self.asset_risks[a] for a in asset_types])
        covariance = np.outer(risks, risks) * self.correlation_matrix
        
        # Risk tolerance based on profile
        risk_aversion = {
            RiskProfile.CONSERVATIVE: 5.0,
            RiskProfile.MODERATE: 2.0,
            RiskProfile.AGGRESSIVE: 0.5
        }[risk_profile]
        
        # Simple mean-variance optimization
        def objective(weights):
            portfolio_return = np.dot(weights, returns)
            portfolio_risk = np.sqrt(np.dot(weights.T, np.dot(covariance, weights)))
            return -(portfolio_return - risk_aversion * portfolio_risk ** 2)
        
        # Constraints
        constraints_list = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}  # Sum to 1
        ]
        
        # Bounds
        bounds = [(0, 0.5) for _ in range(n_assets)]  # Max 50% per asset
        
        # Initial guess
        x0 = np.array([1.0 / n_assets] * n_assets)
        
        # Optimize
        from scipy.optimize import minimize
        result = minimize(objective, x0, method='SLSQP', 
                         bounds=bounds, constraints=constraints_list)
        
        optimal_weights = result.x
        
        portfolio_return = np.dot(optimal_weights, returns)
        portfolio_risk = np.sqrt(np.dot(optimal_weights.T, np.dot(covariance, optimal_weights)))
        sharpe_ratio = (portfolio_return - 0.02) / portfolio_risk  # Assuming 2% risk-free
        
        return PortfolioAllocation(
            regenerative_bonds=optimal_weights[0] * total_capital,
            carbon_tokens=optimal_weights[1] * total_capital,
            yield_tokens=optimal_weights[2] * total_capital,
            ecosystem_credits=optimal_weights[3] * total_capital,
            cash_reserve=total_capital * 0.05,  # 5% cash buffer
            expected_return=portfolio_return,
            portfolio_risk=portfolio_risk,
            sharpe_ratio=sharpe_ratio
        )
    
    def calculate_carbon_credit_value(self,
                                      carbon_sequestration_tco2e: float,
                                      market: MarketConditions,
                                      project_lifetime_years: int = 10
                                      ) -> Dict[str, float]:
        """
        Calculate present value of future carbon credits
        """
        annual_credit_value = carbon_sequestration_tco2e * market.carbon_price_usd
        
        # Carbon price growth assumption
        carbon_price_growth = 0.05  # 5% annual growth
        
        # Discount rate with project risk premium
        project_discount_rate = self.discount_rate + 0.02  # +2% risk premium
        
        # Calculate NPV of carbon stream
        npv = 0
        annual_values = []
        
        for year in range(1, project_lifetime_years + 1):
            future_price = market.carbon_price_usd * ((1 + carbon_price_growth) ** year)
            future_value = carbon_sequestration_tco2e * future_price
            present_value = future_value / ((1 + project_discount_rate) ** year)
            
            npv += present_value
            annual_values.append(future_value)
        
        return {
            "annual_credit_value_base": annual_credit_value,
            "npv_carbon_stream": npv,
            "annual_values": annual_values,
            "effective_price_per_tco2e": npv / (carbon_sequestration_tco2e * project_lifetime_years),
            "carbon_price_growth_assumed": carbon_price_growth,
            "discount_rate_used": project_discount_rate
        }
    
    def calculate_farmer_roi(self,
                             investment_per_ha: float,
                             annual_revenue_increase_per_ha: float,
                             carbon_revenue_per_ha: float,
                             project_years: int = 5
                             ) -> Dict[str, float]:
        """
        Calculate farmer ROI with MBT55 investment
        """
        total_annual_benefit = annual_revenue_increase_per_ha + carbon_revenue_per_ha
        
        # Simple payback period
        payback_years = investment_per_ha / total_annual_benefit if total_annual_benefit > 0 else float('inf')
        
        # 5-year ROI
        total_benefit_5yr = total_annual_benefit * project_years
        roi_5yr = (total_benefit_5yr - investment_per_ha) / investment_per_ha
        
        # NPV calculation
        npv = -investment_per_ha
        for year in range(1, project_years + 1):
            npv += total_annual_benefit / ((1 + self.discount_rate) ** year)
        
        # IRR calculation
        cash_flows = [-investment_per_ha] + [total_annual_benefit] * project_years
        irr = self._calculate_irr(cash_flows)
        
        return {
            "investment_per_ha": investment_per_ha,
            "annual_benefit_per_ha": total_annual_benefit,
            "payback_years": payback_years,
            "roi_5yr_percent": roi_5yr * 100,
            "npv_per_ha": npv,
            "irr_percent": irr * 100
        }
    
    def calculate_system_multiplier(self,
                                    layer_investments: Dict[str, float],
                                    layer_outputs: Dict[str, float]
                                    ) -> float:
        """
        Calculate PBPE system multiplier
        
        M = Σ Outputs / Σ Investments
        """
        total_investment = sum(layer_investments.values())
        total_output = sum(layer_outputs.values())
        
        if total_investment == 0:
            return 0.0
        
        return total_output / total_investment


# Example usage
if __name__ == "__main__":
    engine = FinancialEngine(discount_rate=0.08)
    
    # Define bond parameters
    params = BondParameters(
        bond_type=BondType.REGENERATIVE_COFFEE,
        face_value_usd=1000.0,
        coupon_rate_bps=600,  # 6%
        maturity_years=10,
        total_supply=100000,
        carbon_target_tco2e=25000.0
    )
    
    # Define market conditions
    market = MarketConditions(
        risk_free_rate=0.04,
        carbon_price_usd=80.0,
        coffee_price_usd_kg=3.50,
        volatility_index=18.0,
        credit_spread_bps=200,  # 2%
        inflation_expectation=0.025
    )
    
    # Price bond
    bond_price = engine.price_bond(params, market)
    print(f"Bond Issue Value: ${bond_price:,.2f}")
    
    # Project cash flows with carbon achievement curve
    achievement_curve = [0.2, 0.4, 0.6, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4]
    cash_flows = engine.project_cash_flows(params, market, achievement_curve)
    
    print(f"\nCash Flow Projection:")
    print(f"  NPV: ${cash_flows.npv:,.2f}")
    print(f"  IRR: {cash_flows.irr*100:.2f}%")
    print(f"  Duration: {cash_flows.duration:.2f} years")
    print(f"  Convexity: {cash_flows.convexity:.2f}")
    
    # Optimize portfolio
    portfolio = engine.optimize_portfolio(
        total_capital=10000000,  # $10M
        risk_profile=RiskProfile.MODERATE
    )
    
    print(f"\nPortfolio Allocation (${portfolio.regenerative_bonds + portfolio.carbon_tokens + portfolio.yield_tokens + portfolio.ecosystem_credits + portfolio.cash_reserve:,.2f} total):")
    print(f"  Regenerative Bonds: ${portfolio.regenerative_bonds:,.2f}")
    print(f"  Carbon Tokens: ${portfolio.carbon_tokens:,.2f}")
    print(f"  Yield Tokens: ${portfolio.yield_tokens:,.2f}")
    print(f"  Ecosystem Credits: ${portfolio.ecosystem_credits:,.2f}")
    print(f"  Cash Reserve: ${portfolio.cash_reserve:,.2f}")
    print(f"  Expected Return: {portfolio.expected_return*100:.2f}%")
    print(f"  Portfolio Risk: {portfolio.portfolio_risk*100:.2f}%")
    print(f"  Sharpe Ratio: {portfolio.sharpe_ratio:.2f}")
    
    # Farmer ROI
    roi = engine.calculate_farmer_roi(
        investment_per_ha=235.0,
        annual_revenue_increase_per_ha=1956.0,
        carbon_revenue_per_ha=170.0,
        project_years=5
    )
    
    print(f"\nFarmer ROI Analysis:")
    print(f"  Investment: ${roi['investment_per_ha']:.2f}/ha")
    print(f"  Annual Benefit: ${roi['annual_benefit_per_ha']:.2f}/ha")
    print(f"  Payback Period: {roi['payback_years']:.2f} years")
    print(f"  5-Year ROI: {roi['roi_5yr_percent']:.1f}%")
    print(f"  NPV: ${roi['npv_per_ha']:.2f}/ha")
    print(f"  IRR: {roi['irr_percent']:.1f}%")
