from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from .models import DistanceChargeSlab, PricingConfig


@dataclass(frozen=True)
class PricingBreakdown:
    delivery_charge: Decimal
    platform_charge: Decimal
    rain_rush_charge: Decimal
    peak_hour_charge: Decimal
    distance_charge: Decimal


def get_pricing_config() -> PricingConfig:
    cfg = PricingConfig.objects.order_by("-updated_at").first()
    if cfg:
        return cfg
    return PricingConfig.objects.create()


def compute_distance_charge(distance_km: Decimal | None) -> Decimal:
    if distance_km is None:
        return Decimal("0")
    slabs = list(DistanceChargeSlab.objects.order_by("min_km"))
    for slab in slabs:
        if distance_km < slab.min_km:
            continue
        if slab.max_km is None or distance_km <= slab.max_km:
            return slab.charge
    # Default fallback (10+ km)
    return Decimal("120")


def compute_charges(*, distance_km: Decimal | None = None) -> PricingBreakdown:
    cfg = get_pricing_config()
    delivery = cfg.base_delivery_charge
    platform = cfg.platform_charge
    rain = cfg.rain_rush_charge if cfg.is_rain_mode_enabled else Decimal("0")
    peak = cfg.peak_hour_charge if cfg.is_peak_mode_enabled else Decimal("0")
    distance = compute_distance_charge(distance_km)
    return PricingBreakdown(
        delivery_charge=delivery,
        platform_charge=platform,
        rain_rush_charge=rain,
        peak_hour_charge=peak,
        distance_charge=distance,
    )

