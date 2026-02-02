export type Statistics = {
  totalCards: number;
  totalBucket: number;
  totalLow: number;
  totalHigh: number;
  totalNormal: number;
  filtered: number;
  filteredBucket: number;
  filteredLow: number;
  filteredHigh: number;
  filteredNormal: number;
};

export function getEmptyStatistics(): Statistics {
  return {
    totalCards: 0,
    totalBucket: 0,
    totalLow: 0,
    totalHigh: 0,
    totalNormal: 0,
    filtered: 0,
    filteredBucket: 0,
    filteredLow: 0,
    filteredHigh: 0,
    filteredNormal: 0,
  };
}
