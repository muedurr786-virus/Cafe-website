export type MenuCategory = 'Espresso' | 'Pour Over' | 'Whole Bean' | 'Pastries';

export interface BrewParams {
  doseGrams: number;
  waterTempC: number;
  extractionSec: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  priceUsd: number;
  origin: string;
  roastLevel: string;
  tastingNotes: string[];
  brewParams: BrewParams;
  available: boolean;
  image: string;
  description: string;
}

export interface SpatialZone {
  id: string;
  name: string;
  seating: string;
  acoustics: string;
  lighting: string;
  signatureEquipment: string;
  hotspot: {
    x: number;
    y: number;
  };
  image: string;
  description: string;
}

export interface ShopLocation {
  address: string;
  neighborhood: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  transitNotes: string[];
}

export interface HeroMetric {
  label: string;
  value: string;
}

export interface ShopProfile {
  name: string;
  headline: string;
  tagline: string;
  founded: number;
  roasterSpec: string;
  heroImage: string;
  panoramaImage: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  heroMetrics: HeroMetric[];
}

export interface CoffeeShopPayload {
  schemaVersion: string;
  shop: ShopProfile;
  location: ShopLocation;
  spatialZones: SpatialZone[];
  menuItems: MenuItem[];
}

export interface CuratedOrderItem {
  itemId: string;
  itemName: string;
  customization: string;
  pairingReason: string;
}

export interface SpatialWalkthroughStep {
  step: number;
  zoneName: string;
  sensoryDetail: string;
  recommendedDurationMin: number;
}

export interface AiShopViewResponse {
  headline: string;
  recommendedZoneId: string;
  atmosphereSummary: string;
  curatedOrder: CuratedOrderItem[];
  spatialWalkthrough: SpatialWalkthroughStep[];
  baristaJsonSpecs: {
    brewMethod: string;
    grindProfile: string;
    waterTempC: number;
    suggestedSeat: string;
  };
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}
