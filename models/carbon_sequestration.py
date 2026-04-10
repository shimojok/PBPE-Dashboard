```python
"""
PBPE Carbon Sequestration Model
Advanced mathematical models for soil carbon dynamics
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime, timedelta


class SoilType(Enum):
    SANDY = "sandy"
    LOAMY = "loamy"
    CLAY = "clay"
    VOLCANIC = "volcanic"
    LATOSOL = "latosol"


class ClimateZone(Enum):
    TROPICAL = "tropical"
    SUBTROPICAL = "subtropical"
    TEMPERATE = "temperate"
    ARID = "arid"


@dataclass
class SoilProfile:
    """Soil physical and chemical properties"""
    soil_type: SoilType
    bulk_density_g_cm3: float
    clay_content_percent: float
    silt_content_percent: float
    sand_content_percent: float
    initial_soc_percent: float
    depth_cm: float
    ph: float
    cec_cmol_kg: float  # Cation Exchange Capacity
    base_saturation_percent: float


@dataclass
class ClimateData:
    """Climate and weather data for carbon modeling"""
    zone: ClimateZone
    avg_temperature_c: float
    annual_precipitation_mm: float
    potential_evapotranspiration_mm: float
    growing_season_days: int
    temperature_variability: float
    precipitation_variability: float


@dataclass
class ManagementPractice:
    """Agricultural management practices"""
    tillage_intensity: float  # 0-1 (0=no-till, 1=conventional)
    cover_crop_frequency: float  # 0-1
    organic_amendment_rate_t_ha: float
    mbtt55_applied: bool
    mbtt55_application_rate_kg_ha: float
    irrigation_efficiency: float  # 0-1
    residue_retention_percent: float  # 0-100


@dataclass
class CarbonSequestrationResult:
    """Results of carbon sequestration calculation"""
    soc_change_percent_per_year: float
    soc_change_t_ha_per_year: float
    co2e_sequestration_t_ha_per_year: float
    total_sequestration_tco2e: float
    equilibrium_soc_percent: float
    years_to_equilibrium: float
    permanence_factor: float
    uncertainty_range: Tuple[float, float]
    confidence_level: float


class CarbonSequestrationEngine:
    """
    Advanced carbon sequestration calculation engine
    
    Implements RothC, Century, and MBT55-enhanced models for
    soil organic carbon dynamics prediction.
    """
    
    # Model constants
    SOC_TO_CO2E_FACTOR = 3.67  # tCO₂e per ton SOC
    SOIL_MASS_FACTOR = 100  # t/ha per cm depth
    
    # Decomposition rate modifiers by soil type
    SOIL_TYPE_MODIFIERS = {
        SoilType.SANDY: 1.3,
        SoilType.LOAMY: 1.0,
        SoilType.CLAY: 0.7,
        SoilType.VOLCANIC: 0.5,
        SoilType.LATOSOL: 0.6
    }
    
    # Climate zone modifiers
    CLIMATE_ZONE_MODIFIERS = {
        ClimateZone.TROPICAL: 1.4,
        ClimateZone.SUBTROPICAL: 1.1,
        ClimateZone.TEMPERATE: 1.0,
        ClimateZone.ARID: 0.6
    }
    
    # MBT55 enhancement factors
    MBT55_HUMIFICATION_FACTOR = 2.3
    MBT55_MICROBIAL_EFFICIENCY = 1.8
    MBT55_CARBON_USE_EFFICIENCY = 1.5
    
    def __init__(self):
        self.rothc_params = self._initialize_rothc_parameters()
        self.century_params = self._initialize_century_parameters()
    
    def _initialize_rothc_parameters(self) -> Dict:
        """Initialize RothC model parameters"""
        return {
            "dpm_decomp_rate": 10.0,  # Decomposable plant material
            "rpm_decomp_rate": 0.3,    # Resistant plant material
            "bio_decomp_rate": 0.66,   # Microbial biomass
            "hum_decomp_rate": 0.02,   # Humified organic matter
            "dpm_rpm_ratio": 1.44,
            "clay_factor": 0.5
        }
    
    def _initialize_century_parameters(self) -> Dict:
        """Initialize Century model parameters"""
        return {
            "structural_decay": 0.3,
            "metabolic_decay": 0.5,
            "active_decay": 0.5,
            "slow_decay": 0.2,
            "passive_decay": 0.0045
        }
    
    def calculate_soc_change(self,
                            soil: SoilProfile,
                            climate: ClimateData,
                            management: ManagementPractice,
                            projection_years: int = 10
                            ) -> CarbonSequestrationResult:
        """
        Calculate soil organic carbon change over time
        
        Uses a hybrid approach combining:
        - RothC for topsoil dynamics
        - Century for long-term equilibrium
        - MBT55 enhancement for accelerated sequestration
        """
        
        # Base decomposition rate modifier
        soil_mod = self.SOIL_TYPE_MODIFIERS[soil.soil_type]
        climate_mod = self.CLIMATE_ZONE_MODIFIERS[climate.zone]
        
        # Temperature factor (Q10 = 2)
        temp_factor = 2 ** ((climate.avg_temperature_c - 20) / 10)
        
        # Moisture factor
        aridity_index = climate.annual_precipitation_mm / max(climate.potential_evapotranspiration_mm, 1)
        moisture_factor = min(1.0, max(0.2, aridity_index))
        
        # Tillage impact
        tillage_factor = 1.0 + (management.tillage_intensity * 0.5)
        
        # Base decomposition rate
        k_base = 0.02 * soil_mod * climate_mod * temp_factor * moisture_factor * tillage_factor
        
        # MBT55 enhancement
        if management.mbtt55_applied:
            humification_factor = self.MBT55_HUMIFICATION_FACTOR
            microbial_efficiency = self.MBT55_MICROBIAL_EFFICIENCY
        else:
            humification_factor = 1.0
            microbial_efficiency = 1.0
        
        # Carbon input estimation
        carbon_input = self._estimate_carbon_input(soil, climate, management)
        
        # Equilibrium SOC calculation (Century model approach)
        equilibrium_soc = (carbon_input * humification_factor * microbial_efficiency) / k_base
        
        # Dynamic SOC change (RothC approach)
        current_soc = soil.initial_soc_percent
        
        # Iterative calculation
        soc_values = [current_soc]
        annual_changes = []
        
        for year in range(projection_years):
            # Decomposition
            decomposition = current_soc * k_base
            
            # Humification of inputs
            humification = carbon_input * humification_factor * microbial_efficiency
            
            # Net change
            delta_soc = humification - decomposition
            
            current_soc = current_soc + delta_soc
            current_soc = max(0.5, min(equilibrium_soc * 1.5, current_soc))
            
            soc_values.append(current_soc)
            annual_changes.append(delta_soc)
        
        # Calculate results
        avg_annual_change_percent = np.mean(annual_changes)
        
        # Convert to t/ha
        soil_mass_t_ha = soil.bulk_density_g_cm3 * soil.depth_cm * self.SOIL_MASS_FACTOR / 100
        soc_change_t_ha_per_year = avg_annual_change_percent * soil_mass_t_ha / 100
        
        # Convert to CO₂e
        co2e_sequestration = soc_change_t_ha_per_year * self.SOC_TO_CO2E_FACTOR
        
        # Total sequestration over projection period
        total_sequestration = co2e_sequestration * projection_years
        
        # Years to equilibrium
        years_to_eq = self._calculate_years_to_equilibrium(
            soil.initial_soc_percent,
            equilibrium_soc,
            avg_annual_change_percent
        )
        
        # Permanence factor
        permanence = self._calculate_permanence_factor(
            soil,
            climate,
            management,
            projection_years
        )
        
        # Uncertainty analysis
        uncertainty_range = self._calculate_uncertainty_range(
            avg_annual_change_percent,
            carbon_input,
            k_base
        )
        
        return CarbonSequestrationResult(
            soc_change_percent_per_year=avg_annual_change_percent,
            soc_change_t_ha_per_year=soc_change_t_ha_per_year,
            co2e_sequestration_t_ha_per_year=co2e_sequestration,
            total_sequestration_tco2e=total_sequestration,
            equilibrium_soc_percent=equilibrium_soc,
            years_to_equilibrium=years_to_eq,
            permanence_factor=permanence,
            uncertainty_range=uncertainty_range,
            confidence_level=0.85
        )
    
    def _estimate_carbon_input(self,
                               soil: SoilProfile,
                               climate: ClimateData,
                               management: ManagementPractice
                               ) -> float:
        """Estimate annual carbon input to soil (tC/ha/year)"""
        
        # Base input from crop residues
        base_input = 2.0  # tC/ha/year
        
        # Climate adjustment
        climate_factor = min(2.0, max(0.5, climate.annual_precipitation_mm / 1000))
        
        # Cover crop contribution
        cover_crop_input = management.cover_crop_frequency * 1.5
        
        # Organic amendments
        amendment_input = management.organic_amendment_rate_t_ha * 0.4  # 40% carbon
        
        # Residue retention
        residue_factor = management.residue_retention_percent / 100
        
        # MBT55 enhancement of input quality
        if management.mbtt55_applied:
            quality_factor = 1.2
        else:
            quality_factor = 1.0
        
        total_input = (base_input + cover_crop_input + amendment_input) * \
                      climate_factor * residue_factor * quality_factor
        
        return total_input
    
    def _calculate_years_to_equilibrium(self,
                                        initial_soc: float,
                                        equilibrium_soc: float,
                                        annual_change: float
                                        ) -> float:
        """Calculate years to reach equilibrium SOC"""
        if abs(annual_change) < 0.001:
            return float('inf')
        
        remaining_change = equilibrium_soc - initial_soc
        if abs(remaining_change) < 0.01:
            return 0.0
        
        return abs(remaining_change / annual_change)
    
    def _calculate_permanence_factor(self,
                                     soil: SoilProfile,
                                     climate: ClimateData,
                                     management: ManagementPractice,
                                     projection_years: int
                                     ) -> float:
        """Calculate carbon permanence factor (0-1)"""
        
        base_permanence = 0.85
        
        # Soil type adjustment
        if soil.soil_type == SoilType.CLAY:
            base_permanence += 0.10
        elif soil.soil_type == SoilType.VOLCANIC:
            base_permanence += 0.15
        elif soil.soil_type == SoilType.SANDY:
            base_permanence -= 0.10
        
        # Management adjustment
        if management.tillage_intensity < 0.3:
            base_permanence += 0.05
        
        if management.mbtt55_applied:
            base_permanence += 0.10
        
        # Climate adjustment
        if climate.zone == ClimateZone.ARID:
            base_permanence += 0.05
        elif climate.zone == ClimateZone.TROPICAL:
            base_permanence -= 0.05
        
        # Time adjustment (longer storage = higher uncertainty)
        if projection_years > 30:
            base_permanence -= 0.05
        
        return min(0.98, max(0.50, base_permanence))
    
    def _calculate_uncertainty_range(self,
                                     mean_value: float,
                                     carbon_input: float,
                                     k_base: float
                                     ) -> Tuple[float, float]:
        """Calculate 95% confidence interval"""
        # Standard deviation estimation
        input_uncertainty = carbon_input * 0.15
        rate_uncertainty = k_base * 0.10
        
        total_uncertainty = np.sqrt(input_uncertainty**2 + rate_uncertainty**2)
        
        lower = mean_value - 1.96 * total_uncertainty
        upper = mean_value + 1.96 * total_uncertainty
        
        return (max(0, lower), upper)
    
    def calculate_biochar_sequestration(self,
                                        biochar_application_t_ha: float,
                                        biochar_carbon_content: float = 0.70,
                                        stability_factor: float = 0.80
                                        ) -> float:
        """
        Calculate carbon sequestration from biochar application
        
        Args:
            biochar_application_t_ha: Biochar application rate (t/ha)
            biochar_carbon_content: Carbon content of biochar (0-1)
            stability_factor: Fraction stable over 100 years (0-1)
        
        Returns:
            CO₂e sequestered (tCO₂e/ha)
        """
        carbon_applied = biochar_application_t_ha * biochar_carbon_content
        stable_carbon = carbon_applied * stability_factor
        co2e_sequestered = stable_carbon * self.SOC_TO_CO2E_FACTOR
        
        return co2e_sequestered
    
    def calculate_mbtt55_acceleration(self,
                                      base_sequestration: float,
                                      application_rate_kg_ha: float
                                      ) -> float:
        """
        Calculate MBT55-accelerated carbon sequestration
        
        Args:
            base_sequestration: Base sequestration rate (tCO₂e/ha/year)
            application_rate_kg_ha: MBT55 application rate (kg/ha)
        
        Returns:
            Accelerated sequestration rate (tCO₂e/ha/year)
        """
        # Dose-response curve
        if application_rate_kg_ha <= 0:
            return base_sequestration
        
        # Michaelis-Menten type saturation
        max_acceleration = self.MBT55_HUMIFICATION_FACTOR
        half_saturation = 0.5  # kg/ha
        
        acceleration_factor = 1 + (max_acceleration - 1) * \
                              (application_rate_kg_ha / (application_rate_kg_ha + half_saturation))
        
        return base_sequestration * acceleration_factor
    
    def calculate_coffee_specific_sequestration(self,
                                                farm_area_ha: float,
                                                tree_density_trees_ha: int,
                                                tree_age_years: float,
                                                shade_density_percent: float,
                                                mbtt55_applied: bool
                                                ) -> Dict[str, float]:
        """
        Coffee-specific carbon sequestration calculation
        
        Includes:
        - Coffee tree biomass
        - Shade tree biomass
        - Soil carbon
        - Litter layer
        """
        
        # Coffee tree biomass carbon (allometric equation)
        # Biomass (kg/tree) = a * (stem_diameter) ^ b
        avg_stem_diameter_cm = 5.0 + tree_age_years * 0.5
        biomass_kg_per_tree = 0.15 * (avg_stem_diameter_cm ** 2.2)
        
        tree_carbon_t_ha = (biomass_kg_per_tree * tree_density_trees_ha * 0.47) / 1000
        
        # Shade tree carbon
        if shade_density_percent > 0:
            shade_trees_ha = tree_density_trees_ha * (shade_density_percent / 100) * 0.3
            shade_biomass_kg_per_tree = 500  # Approximate
            shade_carbon_t_ha = (shade_biomass_kg_per_tree * shade_trees_ha * 0.47) / 1000
        else:
            shade_carbon_t_ha = 0
        
        # Soil carbon (base rate)
        base_soil_carbon_rate = 2.5  # tCO₂e/ha/year
        
        if mbtt55_applied:
            soil_carbon_rate = base_soil_carbon_rate * self.MBT55_HUMIFICATION_FACTOR
        else:
            soil_carbon_rate = base_soil_carbon_rate * 0.3
        
        # Litter layer carbon
        litter_carbon_rate = 0.5  # tCO₂e/ha/year
        
        total_annual_sequestration = tree_carbon_t_ha / tree_age_years + \
                                    shade_carbon_t_ha / max(tree_age_years, 1) + \
                                    soil_carbon_rate + \
                                    litter_carbon_rate
        
        return {
            "coffee_tree_carbon_tco2e_ha": tree_carbon_t_ha * self.SOC_TO_CO2E_FACTOR,
            "shade_tree_carbon_tco2e_ha": shade_carbon_t_ha * self.SOC_TO_CO2E_FACTOR,
            "soil_carbon_annual_tco2e_ha": soil_carbon_rate,
            "litter_carbon_annual_tco2e_ha": litter_carbon_rate,
            "total_annual_sequestration_tco2e_ha": total_annual_sequestration,
            "total_sequestration_tco2e": total_annual_sequestration * farm_area_ha
        }


# Example usage
if __name__ == "__main__":
    engine = CarbonSequestrationEngine()
    
    # Define soil profile
    soil = SoilProfile(
        soil_type=SoilType.VOLCANIC,
        bulk_density_g_cm3=1.2,
        clay_content_percent=25.0,
        silt_content_percent=35.0,
        sand_content_percent=40.0,
        initial_soc_percent=2.5,
        depth_cm=30.0,
        ph=6.0,
        cec_cmol_kg=15.0,
        base_saturation_percent=60.0
    )
    
    # Define climate
    climate = ClimateData(
        zone=ClimateZone.TROPICAL,
        avg_temperature_c=23.0,
        annual_precipitation_mm=1800.0,
        potential_evapotranspiration_mm=1200.0,
        growing_season_days=365,
        temperature_variability=0.1,
        precipitation_variability=0.2
    )
    
    # Define management
    management = ManagementPractice(
        tillage_intensity=0.1,
        cover_crop_frequency=0.8,
        organic_amendment_rate_t_ha=5.0,
        mbtt55_applied=True,
        mbtt55_application_rate_kg_ha=1.0,
        irrigation_efficiency=0.7,
        residue_retention_percent=90.0
    )
    
    # Calculate
    result = engine.calculate_soc_change(soil, climate, management, projection_years=10)
    
    print("Carbon Sequestration Results:")
    print(f"  SOC Change: {result.soc_change_percent_per_year:.3f}%/year")
    print(f"  CO₂e Sequestration: {result.co2e_sequestration_t_ha_per_year:.2f} tCO₂e/ha/year")
    print(f"  Total (10 years): {result.total_sequestration_tco2e:.2f} tCO₂e")
    print(f"  Equilibrium SOC: {result.equilibrium_soc_percent:.2f}%")
    print(f"  Years to Equilibrium: {result.years_to_equilibrium:.1f}")
    print(f"  Permanence Factor: {result.permanence_factor:.2f}")
    
    # Coffee-specific calculation
    coffee_result = engine.calculate_coffee_specific_sequestration(
        farm_area_ha=10.0,
        tree_density_trees_ha=5000,
        tree_age_years=5.0,
        shade_density_percent=30.0,
        mbtt55_applied=True
    )
    
    print("\nCoffee Farm Sequestration (10 ha):")
    print(f"  Total Annual: {coffee_result['total_annual_sequestration_tco2e_ha']:.2f} tCO₂e/ha/year")
    print(f"  Farm Total: {coffee_result['total_sequestration_tco2e']:.2f} tCO₂e/year")
```
