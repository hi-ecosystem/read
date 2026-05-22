/* ── read. i18n ─────────────────────────────────────────────────
   Shared key with hi-dashboard: localStorage 'hi_lang'
   Values: 'ru' | 'en'   Default: 'ru'
────────────────────────────────────────────────────────────────── */

export const strings = {
  ru: {
    // ── BottomNav ────────────────────────────────────────────────
    navFeed:  'Лента',
    navShelf: 'Полка',
    navAdd:   'Добавить',
    navDuo:   'Дуэт',
    navMe:    'Я',

    // ── Login ────────────────────────────────────────────────────
    loginSub:      'трекер книг · hi. экосистема',
    loginSendBtn:  'Получить код',
    loginSending:  'Отправка…',
    loginVerify:   'Войти',
    loginVerifying:'Проверка…',
    loginBack:     '← другой email',
    loginHint:     e => `Код отправлен на ${e}`,
    loginErrEmail: 'Введи email',
    loginErrCode:  'Введи 6-значный код',
    loginErrOtp:   'Неверный или устаревший код',

    // ── Feed ─────────────────────────────────────────────────────
    feedEmpty:       'Пока нет активности друзей.',
    feedEmptyHint:   'Найди друзей через поиск 🔍',
    searchPlaceholder:'Имя пользователя…',
    searchCancel:    'Отмена',
    searchSearching: 'Поиск…',
    searchNotFound:  q => `Пользователь «${q}» не найден`,
    searchPrompt:    'Начни вводить имя пользователя',
    actStarted:      'начал(а) читать',
    actFinished:     'закончил(а)',
    actRated:        'оценил(а)',
    actCheckedIn:    'отметился',
    withLabel:       'с',
    addToWant:       'добавить · хочу читать',
    addingWant:      'Добавляю…',
    likeBtn:         'нравится',
    commingSoon:     'Комментарии скоро появятся',

    // ── Shelf ────────────────────────────────────────────────────
    tabReading:  'Читаю',
    tabFinished: 'Прочитано',
    tabWant:     'Хочу',
    shelfReading:   'Читаю',
    shelfFinished:  'Прочитано',
    shelfWant:      'Хочу читать',
    // Sheet actions
    sheetLogPages:   'Обновить страницу',
    sheetMoveRead:   'Переместить: Читаю',
    sheetMoveFinish: 'Отметить прочитанной',
    sheetMoveWant:   'Переместить: Хочу читать',
    sheetReview:     'Написать отзыв',
    sheetRemove:     'Убрать с полки',

    // ── Add Book ─────────────────────────────────────────────────
    addTitle:        'Добавить книгу',
    addPlaceholder:  'Поиск книги…',
    addSearching:    'Поиск…',
    addNoResults:    'Ничего не найдено',
    addToShelf:      shelf => `Добавить · ${shelf}`,
    addAdded:        'Уже на полке',
    addSuccess:      shelf => `Добавлено в «${shelf}»`,
    addError:        'Не удалось добавить. Попробуй снова.',

    // ── Me ───────────────────────────────────────────────────────
    meTitle:     'Я',
    statReading: 'Читаю',
    statFinished:'Прочитано',
    statWant:    'Хочу',
    statPages:   'Страниц',
    statReviews: 'Отзывов',
    statDuos:    'Активных дуэтов',
    signOut:     'Выйти',
    signingOut:  'Выхожу…',
    loading:     'Загрузка…',

    // ── Duo ──────────────────────────────────────────────────────
    duoTitle:       'Дуэты',
    duoEmpty:       'Нет активных дуэтов',
    duoNewBtn:      '+ Новый дуэт',
    duoWith:        'с',

    // ── UserProfile ──────────────────────────────────────────────
    profileSince:   d => `в read. с ${d}`,
    profileFinished: n => `Прочитанные книги · ${n}`,
    profileEmpty:   'Пока нет прочитанных книг',
    profileRead:    'Прочитано',
    profileReading: 'Читает',
    profileReviews: 'Отзывов',
    profileWant:    'Хочет',
    profileNotFound:'Пользователь не найден',
    profileLoading: 'Загрузка…',
    profileFinishedAt: ts => {
      const diff = (Date.now() - new Date(ts)) / 1000
      if (diff < 86400) return 'прочитано сегодня'
      if (diff < 86400 * 30) return `прочитано ${Math.floor(diff / 86400)} дн. назад`
      if (diff < 86400 * 365) return `прочитано ${Math.floor(diff / (86400 * 30))} мес. назад`
      return `прочитано ${Math.floor(diff / (86400 * 365))} г. назад`
    },
    profileJoined: ts => new Date(ts).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
  },

  en: {
    // ── BottomNav ────────────────────────────────────────────────
    navFeed:  'Feed',
    navShelf: 'Shelf',
    navAdd:   'Add',
    navDuo:   'Duo',
    navMe:    'Me',

    // ── Login ────────────────────────────────────────────────────
    loginSub:      'book tracker · hi. ecosystem',
    loginSendBtn:  'Get code',
    loginSending:  'Sending…',
    loginVerify:   'Sign in',
    loginVerifying:'Checking…',
    loginBack:     '← other email',
    loginHint:     e => `Code sent to ${e}`,
    loginErrEmail: 'Enter your email',
    loginErrCode:  'Enter the 6-digit code',
    loginErrOtp:   'Invalid or expired code',

    // ── Feed ─────────────────────────────────────────────────────
    feedEmpty:       'No friend activity yet.',
    feedEmptyHint:   'Find friends via search 🔍',
    searchPlaceholder:'Username…',
    searchCancel:    'Cancel',
    searchSearching: 'Searching…',
    searchNotFound:  q => `User "${q}" not found`,
    searchPrompt:    'Start typing a username',
    actStarted:      'started reading',
    actFinished:     'finished',
    actRated:        'rated',
    actCheckedIn:    'checked in',
    withLabel:       'with',
    addToWant:       'add to · want to read',
    addingWant:      'Adding…',
    likeBtn:         'like',
    commingSoon:     'Comments coming soon',

    // ── Shelf ────────────────────────────────────────────────────
    tabReading:  'Reading',
    tabFinished: 'Finished',
    tabWant:     'Want',
    shelfReading:   'Reading',
    shelfFinished:  'Finished',
    shelfWant:      'Want to read',
    // Sheet actions
    sheetLogPages:   'Update page',
    sheetMoveRead:   'Move to: Reading',
    sheetMoveFinish: 'Mark as finished',
    sheetMoveWant:   'Move to: Want to read',
    sheetReview:     'Write a review',
    sheetRemove:     'Remove from shelf',

    // ── Add Book ─────────────────────────────────────────────────
    addTitle:        'Add a book',
    addPlaceholder:  'Search for a book…',
    addSearching:    'Searching…',
    addNoResults:    'No results found',
    addToShelf:      shelf => `Add to ${shelf}`,
    addAdded:        'Already on shelf',
    addSuccess:      shelf => `Added to ${shelf}`,
    addError:        'Could not save. Try again.',

    // ── Me ───────────────────────────────────────────────────────
    meTitle:     'Me',
    statReading: 'Reading',
    statFinished:'Finished',
    statWant:    'Want',
    statPages:   'Pages read',
    statReviews: 'Reviews',
    statDuos:    'Active duos',
    signOut:     'Sign out',
    signingOut:  'Signing out…',
    loading:     'Loading…',

    // ── Duo ──────────────────────────────────────────────────────
    duoTitle:       'Duos',
    duoEmpty:       'No active duos',
    duoNewBtn:      '+ New duo',
    duoWith:        'with',

    // ── UserProfile ──────────────────────────────────────────────
    profileSince:    d => `on read. since ${d}`,
    profileFinished: n => `Books read · ${n}`,
    profileEmpty:    'No books read yet',
    profileRead:     'Read',
    profileReading:  'Reading',
    profileReviews:  'Reviews',
    profileWant:     'Want',
    profileNotFound: 'User not found',
    profileLoading:  'Loading…',
    profileFinishedAt: ts => {
      const diff = (Date.now() - new Date(ts)) / 1000
      if (diff < 86400) return 'read today'
      if (diff < 86400 * 30) return `read ${Math.floor(diff / 86400)} days ago`
      if (diff < 86400 * 365) return `read ${Math.floor(diff / (86400 * 30))} months ago`
      return `read ${Math.floor(diff / (86400 * 365))} years ago`
    },
    profileJoined: ts => new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  },
}

export function t(lang, key, ...args) {
  const entry = strings[lang]?.[key] ?? strings.en[key] ?? key
  return typeof entry === 'function' ? entry(...args) : entry
}
