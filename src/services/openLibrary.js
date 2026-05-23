const BASE = 'https://openlibrary.org';
const COVERS = 'https://covers.openlibrary.org/b/id';

export async function searchBooks(query) {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search.json?q=${encodeURIComponent(query)}&limit=7&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject`
  );
  const data = await res.json();
  return (data.docs || []).map(b => ({
    id: b.key,
    title: b.title,
    author: b.author_name?.[0] ?? 'Unknown',
    year: b.first_publish_year,
    pages: b.number_of_pages_median,
    coverId: b.cover_i,
    coverUrl: b.cover_i ? `${COVERS}/${b.cover_i}-M.jpg` : null,
    subjects: b.subject?.slice(0, 5) ?? [],
  }));
}

export function coverUrl(coverId, size = 'M') {
  return coverId ? `${COVERS}/${coverId}-${size}.jpg` : null;
}

/**
 * Resolve the best cover URL from DB fields.
 * cover_url (text) wins over the numeric OL cover_id.
 */
export function resolveBookCover(coverId, directUrl, size = 'M') {
  if (directUrl) return directUrl;
  return coverUrl(coverId, size);
}
