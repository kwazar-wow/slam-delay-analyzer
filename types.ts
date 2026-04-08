export interface RawLogEntry {
  Time: string;
  Event: string;
  [key: string]: string; // For loose CSV parsing
}

export interface AnalyzedEvent {
  id: number;
  timestamp: number; // Seconds from start
  timestampStr: string;
  type: 'Melee' | 'Slam' | 'Other';
  rawEvent: string;
  slamDelay?: number; // The calculated delay (Slam Time - Last Melee Time - 0.5)
  prevMeleeTime?: number; // Reference to the melee swing used for calculation
}

export interface AnalysisSummary {
  totalSlams: number;
  averageDelay: number;
  minDelay: number;
  maxDelay: number;
  perfectSlams: number; // Slams with delay < 0.1s (arbitrary threshold for "good")
}