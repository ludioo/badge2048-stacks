import type { Tile } from './types';

/**
 * Merge tiles in a row/column
 * - Removes nulls
 * - Merges identical adjacent tiles (only once per merge)
 * - Returns merged row and score increment
 */
export function mergeTiles(tiles: Tile[]): {
  merged: Tile[];
  score: number;
} {
  // Remove nulls and keep only numbers
  const nonNullTiles = tiles.filter((tile): tile is number => tile !== null);
  
  if (nonNullTiles.length === 0) {
    return { merged: tiles, score: 0 };
  }

  const merged: Tile[] = [];
  let score = 0;
  let i = 0;

  while (i < nonNullTiles.length) {
    if (i < nonNullTiles.length - 1 && nonNullTiles[i] === nonNullTiles[i + 1]) {
      // Merge two identical tiles
      const mergedValue = nonNullTiles[i] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      i += 2; // Skip both tiles since they merged
    } else {
      // No merge, just add the tile
      merged.push(nonNullTiles[i]);
      i += 1;
    }
  }

  // Pad with nulls to maintain original length
  while (merged.length < tiles.length) {
    merged.push(null);
  }

  return { merged, score };
}
