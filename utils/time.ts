/**
 * Parses a timestamp string like "00:02.696" into total seconds (float).
 */
export const parseTimestampToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Clean up quotes if present (though parser usually handles this)
  const cleanStr = timeStr.replace(/"/g, '').trim();
  
  const parts = cleanStr.split(':');
  if (parts.length !== 2) return 0;

  const minutes = parseFloat(parts[0]);
  const seconds = parseFloat(parts[1]);

  return (minutes * 60) + seconds;
};

/**
 * Formats seconds back to "MM:SS.ms" for display
 */
export const formatSecondsToTimestamp = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(3);
  const formattedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
  return `${mins < 10 ? '0' : ''}${mins}:${formattedSecs}`;
};