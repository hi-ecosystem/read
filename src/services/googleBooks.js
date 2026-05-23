const BASE = 'https://www.googleapis.com/books/v1/volumes';

export async function searchGoogleBooks(query) {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${BASE}?q=${encodeURIComponent(query)}&maxResults=10&printType=books`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map(item => {
      const v = item.volumeInfo;
      // Upgrade thumbnail to https and request a larger zoom level
      const thumb = v.imageLinks?.thumbnail
        ?.replace(/^http:/, 'https:')
        ?.replace('zoom=1', 'zoom=2') ?? null;
      return {
        id: `gb:${item.id}`,
        title: v.title ?? '—',
        author: v.authors?.[0] ?? null,
        year: v.publishedDate ? (parseInt(v.publishedDate, 10) || null) : null,
        pages: v.pageCount ?? null,
        coverId: null,          // bigint column — not used for Google Books
        coverUrl: thumb,        // stored in cover_url text column
        subjects: v.categories ?? [],
        source: 'google',
      };
    });
  } catch {
    return [];
  }
}
