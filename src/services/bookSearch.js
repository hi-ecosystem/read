import { searchBooks as searchOpenLibrary } from './openLibrary';
import { searchGoogleBooks } from './googleBooks';

/** Normalise title for dedup comparison */
function norm(str) {
  return (str ?? '').toLowerCase().replace(/[^\wа-яёА-ЯЁ\s]/g, '').trim();
}

/**
 * Search both Google Books and Open Library in parallel.
 * Google Books results come first (better Russian coverage).
 * Open Library fills in books not already found by Google.
 */
export async function searchAllBooks(query) {
  if (!query.trim()) return [];

  const [gbResults, olResults] = await Promise.all([
    searchGoogleBooks(query).catch(() => []),
    searchOpenLibrary(query).catch(() => []),
  ]);

  // Deduplicate: if OL has the same title as a GB result, skip it
  const seen = new Set(gbResults.map(b => norm(b.title)));
  const uniqueOL = olResults.filter(b => !seen.has(norm(b.title)));

  return [...gbResults, ...uniqueOL];
}
