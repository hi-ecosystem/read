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
    // For Google Books: coverId is null, coverUrl holds the thumbnail URL
    p_cover_url: book.coverId ? null : (book.coverUrl ?? null),
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

export async function getPopularFeed() {
  const { data, error } = await supabase.rpc('get_popular_feed', { p_limit: 50 });
  if (error) throw error;
  return data ?? [];
}

export async function getBookTopReview(bookId) {
  const { data, error } = await supabase.rpc('get_book_top_review', { p_book_id: bookId });
  if (error) throw error;
  return data?.[0] ?? null;
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

  // Fire-and-forget: notify friends (deduped server-side — only fires on first review)
  if (rating || body) {
    supabase.functions.invoke('notify-review', { body: { book_id: bookId } }).catch(() => {});
  }
}

export async function setNotifyFriendReviews(value) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('users')
    .update({ notify_friend_reviews: value })
    .eq('id', user.id);
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

export async function searchUsers(query) {
  if (!query || query.trim().length < 1) return [];
  const { data, error } = await supabase.rpc('search_users', { p_query: query.trim() });
  if (error) throw error;
  return data ?? [];
}

export async function getUserProfile(username) {
  const { data, error } = await supabase.rpc('get_user_profile', { p_username: username });
  if (error) throw error;
  return data; // null если пользователь не найден
}

export async function addToWant(bookId) {
  const { error } = await supabase.rpc('add_to_shelf', { p_book_id: bookId, p_shelf: 'want' });
  if (error) throw error;
}

export async function setShowReadingProgress(value) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('users')
    .update({ show_reading_progress: value })
    .eq('id', user.id);
  if (error) throw error;
}

export async function setProfilePublic(value) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('users')
    .update({ profile_public: value })
    .eq('id', user.id);
  if (error) throw error;
}

// ── Friends ───────────────────────────────────────────────────

export async function sendFriendRequest(username) {
  const { data, error } = await supabase.rpc('send_friend_request', { friend_username: username });
  if (error) throw error;
  return data; // { success, error?, friendship_id? }
}

export async function getFriendshipStatus(username) {
  const { data, error } = await supabase.rpc('get_friendship_status', { target_username: username });
  if (error) throw error;
  return data; // { success, status ('none'|'pending'|'accepted'), friendship_id?, is_requester? }
}

export async function getPendingRequests() {
  const { data, error } = await supabase.rpc('get_pending_friend_requests');
  if (error) throw error;
  return data ?? [];
}

export async function getSentRequests() {
  const { data, error } = await supabase.rpc('get_sent_friend_requests');
  if (error) throw error;
  return data ?? [];
}

export async function cancelFriendRequest(friendshipId) {
  const { data, error } = await supabase.rpc('cancel_friend_request', { friendship_id: friendshipId });
  if (error) throw error;
  return data;
}

export async function removeFriend(friendshipId) {
  const { data, error } = await supabase.rpc('remove_friend', { friendship_id: friendshipId });
  if (error) throw error;
  return data;
}

export async function respondToFriendRequest(friendshipId, action) {
  const { data, error } = await supabase.rpc('respond_to_friend_request', {
    friendship_id:   friendshipId,
    response_action: action,   // 'accept' | 'decline'
  });
  if (error) throw error;
  return data;
}

export async function getPopularBooks() {
  const { data, error } = await supabase.rpc('get_popular_books', { p_limit: 20 });
  if (error) throw error;
  return (data ?? []).map(b => ({
    id:       b.book_id,
    title:    b.title,
    author:   b.author,
    coverId:  b.cover_id,
    coverUrl: b.cover_url,
    pages:    b.pages,
    year:     b.year,
    readers:  b.readers,
  }));
}

// ── Stats ─────────────────────────────────────────────────────

export async function getMyStats() {
  const { data, error } = await supabase.rpc('get_my_stats');
  if (error) throw error;
  return data?.[0] ?? null;
}

// ── Weekly picks ──────────────────────────────────────────────

export async function getWeeklyPicks() {
  const { data, error } = await supabase.rpc('get_weekly_picks');
  if (error) throw error;
  return (data ?? []).map(b => ({
    bookId:   b.book_id,
    title:    b.title,
    author:   b.author,
    coverId:  b.cover_id,
    coverUrl: b.cover_url,
    myShelf:  b.my_shelf ?? null,   // 'reading' | 'finished' | 'want' | null
  }));
}
