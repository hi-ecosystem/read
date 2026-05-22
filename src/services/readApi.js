import { supabase } from './supabase';

// ── Books ─────────────────────────────────────────────────────

export async function addBookToShelf(book, shelf) {
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

  const { error } = await supabase.rpc('add_to_shelf', { p_book_id: book.id, p_shelf: shelf });
  if (error) throw error;
}

export async function logPages(bookId, page, note = null, shareToFeed = false) {
  const { error } = await supabase.rpc('log_pages', {
    p_book_id: bookId, p_page: page, p_note: note, p_share: shareToFeed,
  });
  if (error) throw error;
}

export async function moveShelf(bookId, shelf) {
  const { error } = await supabase.rpc('add_to_shelf', { p_book_id: bookId, p_shelf: shelf });
  if (error) throw error;
}

export async function finishBook(bookId) {
  const { error } = await supabase.rpc('finish_book', { p_book_id: bookId });
  if (error) throw error;
}

export async function removeFromShelf(bookId) {
  const { error } = await supabase.rpc('remove_from_shelf', { p_book_id: bookId });
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
  return data;
}

// ── Duo ───────────────────────────────────────────────────────

export async function getMyDuos() {
  const { data: { user: duoUser } } = await supabase.auth.getUser();
  if (!duoUser) return [];
  const { data, error } = await supabase
    .from('book_duos')
    .select(`
      id, status, started_at, book_id,
      books ( title, author, cover_id, pages ),
      user1:users!book_duos_user1_id_fkey ( id, username ),
      user2:users!book_duos_user2_id_fkey ( id, username )
    `)
    .or(`user1_id.eq.${duoUser.id},user2_id.eq.${duoUser.id}`)
    .eq('status', 'active');
  if (error) throw error;
  return data ?? [];
}

export async function getFriends() {
  const { data, error } = await supabase.rpc('get_read_friends');
  if (error) throw error;
  return data ?? [];
}

export async function createDuo(bookId, partnerId) {
  const { data, error } = await supabase.rpc('create_duo', {
    p_book_id: bookId, p_partner_id: partnerId,
  });
  if (error) throw error;
  return data;
}

export async function getDuo(duoId) {
  const { data, error } = await supabase.rpc('get_duo', { p_duo_id: duoId });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function sendDuoMessage(duoId, body, page = null) {
  const { error } = await supabase.from('duo_messages').insert({ duo_id: duoId, body, page });
  if (error) throw error;
}

export async function endDuo(duoId) {
  const { error } = await supabase.rpc('end_duo', { p_duo_id: duoId });
  if (error) throw error;
}

// ── Reviews ───────────────────────────────────────────────────

export async function upsertReview(bookId, rating, body) {
  const { error } = await supabase.rpc('submit_review', {
    p_book_id: bookId,
    p_rating:  rating  || null,
    p_body:    body    || null,
  });
  if (error) throw error;
}

export async function getMyReview(bookId) {
  const { data: { user: reviewUser } } = await supabase.auth.getUser();
  if (!reviewUser) return null;
  const { data, error } = await supabase
    .from('book_reviews')
    .select('rating, body')
    .eq('user_id', reviewUser.id)
    .eq('book_id', bookId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Stats ─────────────────────────────────────────────────────

export async function getMyStats() {
  const { data, error } = await supabase.rpc('get_my_stats');
  if (error) throw error;
  return data?.[0] ?? null;
}
