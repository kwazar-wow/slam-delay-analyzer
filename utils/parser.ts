import Papa from 'papaparse';
import { RawLogEntry, AnalyzedEvent, AnalysisSummary } from '../types';
import { parseTimestampToSeconds } from './time';

const CAST_TIME_PENALTY = 0.5; // 0.5 seconds cast time for Slam

export const parseAndAnalyzeCSV = (csvContent: string): { events: AnalyzedEvent[], summary: AnalysisSummary } => {
  const parseResult = Papa.parse<RawLogEntry>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(), // Remove whitespace/quotes from headers
  });

  const rawData = parseResult.data;
  const analyzedEvents: AnalyzedEvent[] = [];
  let lastMeleeTime: number | null = null;
  
  // 1. Identify the player(s) by finding who is casting Slam.
  // This is necessary to filter out pet/guardian melee swings (e.g., Battle Chicken).
  const slamSources = new Set<string>();
  rawData.forEach(row => {
    if (row.Event && row.Event.includes(' Slam ')) {
      // Extract the source name (everything before " Slam ")
      const source = row.Event.split(' Slam ')[0];
      if (source) {
        slamSources.add(source);
      }
    }
  });

  // Sort mainly to be safe, though logs usually come sorted
  const sortedRawData = rawData.sort((a, b) => {
    return parseTimestampToSeconds(a.Time) - parseTimestampToSeconds(b.Time);
  });

  sortedRawData.forEach((row, index) => {
    if (!row.Time || !row.Event) return;

    const currentTime = parseTimestampToSeconds(row.Time);
    const eventText = row.Event;
    
    let type: 'Melee' | 'Slam' | 'Other' = 'Other';
    let delay: number | undefined = undefined;

    // Check for Melee or Heroic Strike
    const isMelee = eventText.includes(' Melee ');
    const isHeroicStrike = eventText.includes(' Heroic Strike ');

    // Identify Event Type
    if (isMelee || isHeroicStrike) {
      // Check if this Melee/HS event comes from a known Slam source (the player)
      const source = isMelee 
        ? eventText.split(' Melee ')[0]
        : eventText.split(' Heroic Strike ')[0];
      
      if (slamSources.has(source)) {
        type = 'Melee';
        lastMeleeTime = currentTime;
      } else {
        type = 'Other';
      }
    } else if (eventText.includes(' Slam ')) {
      type = 'Slam';
      if (lastMeleeTime !== null) {
        // Calculate raw delay (Slam Time - Melee Time) - 0.5s Cast Time
        // Outliers are now handled in the UI
        delay = (currentTime - lastMeleeTime) - CAST_TIME_PENALTY;
      }
    }

    analyzedEvents.push({
      id: index,
      timestamp: currentTime,
      timestampStr: row.Time,
      type,
      rawEvent: eventText,
      slamDelay: delay,
      prevMeleeTime: type === 'Slam' ? (lastMeleeTime ?? undefined) : undefined
    });
  });

  // Initial summary (will be re-calculated in dashboard if threshold changes)
  const slams = analyzedEvents.filter(e => e.type === 'Slam' && e.slamDelay !== undefined);
  
  const summary: AnalysisSummary = {
    totalSlams: slams.length,
    averageDelay: slams.length > 0 ? slams.reduce((acc, curr) => acc + (curr.slamDelay || 0), 0) / slams.length : 0,
    minDelay: slams.length > 0 ? Math.min(...slams.map(s => s.slamDelay as number)) : 0,
    maxDelay: slams.length > 0 ? Math.max(...slams.map(s => s.slamDelay as number)) : 0,
    perfectSlams: slams.filter(s => (s.slamDelay || 0) < 0.1 && (s.slamDelay || 0) >= 0).length
  };

  return { events: analyzedEvents, summary };
};