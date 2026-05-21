import { supabase } from './supabase';

// ── Books ─────────────────────────────────────────────────────

/** Cache an Open Library book in our DB then add it to user's shelf */
export async function addBookToShelf(book, shelf) {
  // 1. upsert book metadata
  const { error: upsertErr } = await supabase.rpc('upsert_book', {
    p_id:       book.id,
    p_title:    book.title,
    p_author:   book.author ?? null,
    p_year:     book.year ?? null,
    p_pages:    book.pages ?? null,
    p_cover_id: book.coverId ?? null,
    p_subjects: book.subjects ?? [],
  });
  if (upsertErr) throw upsertErr;

  // 2. add to shelf
  const { error } = await supabase.rpc('add_to_shelf', {
    p_book_id: book.id,
    p_shelf:   shelf,
  });
  if (error) throw error;
}

/** Log page progress (updates current_page + optionally marks DoubleDo habit) */
export async function logPages(bookId, page, note = null, shareToFeed = false) {
  const { error } = await supabase.rpc('log_pages', {
    p_book_id: bookId,
    p_page:    page,
    p_note:    note,
    p_share:   shareToFeed,
  });
  if (error) throw error;
}

// ── Shelves ───────────────────────────────────────────────────

export async function getMyShelf(shelf = null) {
  const { data, error } = await supabase.rpc('get_my_shelves');
  if (error) throw error;
  if (shelf) return data.filter(b => b.shelf === shelf);
  return data;
}

// ── Feed ──────────────────────────────────────────────────────

export async function getFeed() {
  const { data, error } = await supabase.rpc('get_read_feed');
  if (error) throw error;
  return data ?? [];
}

export async function toggleLike(reviewId) {
  const { data, error } = await supabase.rpc('toggle_review_like', { p_review_id: reviewId });
  if (error) throw error;
  return data; // true = liked, false = unliked
}

// ── Duo ───────────────────────────────────────────────────────

export async function getMyDuos() {
  const { data, error } = await supabase
    .from('book_duos')
    .select(`
      id, status, started_at, book_id,
      books ( title, author, cover_id, pages ),
      user1:users!book_duos_user1_id_fkey ( id, username ),
      user2:users!book_duos_user2_id_fkey ( id, username )
    `)
    .or(`user1_id.eq.${(await supabase.auth.getUser()).data.user?.id},user2_id.eq.${(await supabase.auth.getUser()).data.user?.id}`)
    .eq('status', 'active');
  if (error) throw error;
  return data ?? [];
}

export async function getDuo(duoId) {
  const { data, error } = await supabase.rpc('get_duo', { p_duo_id: duoId });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function sendDuoMessage(duoId, body, page = null) {
  const { error } = await supabase
    .from('duo_messages')
    .insert({ duo_id: duoId, body, page });
  if (error) throw error;
}

// ── Reviews ───────────────────────────────────────────────────

export async function upsertReview(bookId, rating, body) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('book_reviews')
    .upsert({ user_id: user.id, book_id: bookId, rating, body, updated_at: new Date().toISOString() });
  if (error) throw error;

  // push finished feed event
  await supabase.rpc('add_to_shelf', { p_book_id: bookId, p_shelf: 'finished' });
}
