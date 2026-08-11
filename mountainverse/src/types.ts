export type Continent = 'Asia' | 'Europe' | 'Africa' | 'North America' | 'South America' | 'Antarctica' | 'Australia / Oceania';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Extreme';

export interface RouteHotspot {
  id: string;
  name: string;
  altitudeMeters: number;
  description: string;
  xRatio: number; // 3D coordinate ratios for terrain pins (-0.5 to 0.5)
  yRatio: number;
  zRatio: number;
  type: 'base_camp' | 'camp' | 'hazard' | 'key_feature' | 'summit';
}

export interface TrekkingRoute {
  name: string;
  difficulty: Difficulty;
  durationDays: number;
  distanceKm: number;
  bestMonths: string[];
  description: string;
  successRatePercent: number;
}

export interface MountainGeology {
  rockType: string;
  tectonicOrigin: string;
  ageMillionsYears: number;
  formationType: 'Fold Mountain' | 'Volcano (Stratovolcano)' | 'Fault-Block' | 'Dome Mountain' | 'Plutonic' | 'Glacial Horn';
  funFact: string;
}

export interface MountainClimate {
  summerAvgTempC: number;
  winterAvgTempC: number;
  deathZoneAltitudeMeters?: number;
  glaciersCount: number;
  predominantWindKmH: number;
  wildlife: string[];
  flora: string[];
}

export interface MountainExpedition {
  year: number;
  climberName: string;
  nationalities: string[];
  notes: string;
  isFirstAscent: boolean;
}

export interface Mountain {
  id: string;
  name: string;
  localNames?: string[];
  continent: Continent;
  country: string[];
  mountainRange: string;
  elevationMeters: number;
  prominenceMeters: number;
  isolationKm: number;
  latitude: number;
  longitude: number;
  isSevenSummit: boolean;
  isVolcano: boolean;
  isUnesco: boolean;
  tagline: string;
  summary: string;
  heroImage: string;
  galleryImages: string[];
  geology: MountainGeology;
  climate: MountainClimate;
  routes: TrekkingRoute[];
  expeditions: MountainExpedition[];
  hotspots: RouteHotspot[];
  culturalSignificance: string;
  conservationStatus: string;
  // Procedural 3D heightmap generation seed / parameters
  terrainType: 'pyramid' | 'crater' | 'massive_ridge' | 'twin_peak' | 'plateau_cone' | 'sharp_spire';
  roughness: number;
  peakSharpness: number;
  snowLineRatio: number; // 0 to 1 where snow starts
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  mountainId?: string;
  category: 'Geology' | 'Records' | 'History' | 'Geography' | 'Wildlife';
}

export interface Article {
  id: string;
  title: string;
  category: 'Geology & Uplift' | 'Glaciers & Climate' | 'Altitude Science' | 'Mountaineering Safety' | 'Ecosystems';
  readTimeMinutes: number;
  author: string;
  date: string;
  summary: string;
  contentMarkdown: string;
  coverImage: string;
}

export interface TimelineEvent {
  year: number;
  title: string;
  mountainName: string;
  location: string;
  description: string;
  category: 'First Ascent' | 'Solo Legend' | 'Scientific Discovery' | 'Tragedy & Rescue' | 'Speed Record';
  heroClimber?: string;
}
