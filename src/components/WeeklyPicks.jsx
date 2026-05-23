import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import BookCover from './BookCover';
import { resolveBookCover } from '../services/openLibrary';
import { addToWant } from '../services/readApi';
import { toast } from 'react-hot-toast';
import './WeeklyPicks.css';

function getWeekRange(lang) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (lang === 'ru') {
    const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    if (monday.getMonth() === sunday.getMonth()) {
      return `${monday.getDate()}–${sunday.getDate()} ${months[sunday.getMonth()]}`;
    }
    return `${monday.getDate()} ${months[monday.getMonth()]} – ${sunday.getDate()} ${months[sunday.getMonth()]}`;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${months[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}`;
  }
  return `${months[monday.getMonth()]} ${monday.getDate()} – ${months[sunday.getMonth()]} ${sunday.getDate()}`;
}

// Badge config per shelf
const SHELF_BADGE = {
  finished: { icon: '✓', cls: 'finished' },
  reading:  { icon: '●', cls: 'reading'  },
  want:     { icon: '♡', cls: 'want'     },
};

export default function WeeklyPicks({ picks }) {
  const { t, lang } = useLang();
  const [adding, setAdding] = useState(null);

  if (!picks || picks.length === 0) return null;

  const weekRange = getWeekRange(lang);

  const handleTap = async (pick) => {
    // Already on shelf — just inform, don't re-add
    if (pick.myShelf) {
      const labels = {
        ru: { finished: 'Уже прочитана', reading: 'Уже читаешь', want: 'Уже в списке' },
        en: { finished: 'Already read',  reading: 'Currently reading', want: 'Already in list' },
      };
      toast(labels[lang]?.[pick.myShelf] ?? '');
      return;
    }

    if (adding) return;
    setAdding(pick.bookId);
    try {
      await addToWant(pick.bookId);
      toast.success(t('addToWant'));
    } catch {
      toast.error(t('addError'));
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="weekly-picks card">
      <div className="weekly-picks__header">
        <div>
          <div className="weekly-picks__title">{t('weeklyPicksTitle')}</div>
          <div className="weekly-picks__date">{weekRange}</div>
        </div>
        <span className="weekly-picks__star">✦</span>
      </div>

      <div className="weekly-picks__books">
        {picks.map((pick) => {
          const url     = resolveBookCover(pick.coverId, pick.coverUrl);
          const isAdding = adding === pick.bookId;
          const badge   = pick.myShelf ? SHELF_BADGE[pick.myShelf] : null;
          const onShelf = !!pick.myShelf;

          return (
            <button
              key={pick.bookId}
              className={`weekly-picks__book${isAdding ? ' weekly-picks__book--adding' : ''}${onShelf ? ' weekly-picks__book--on-shelf' : ''}`}
              onClick={() => handleTap(pick)}
              disabled={isAdding}
            >
              <div className="weekly-picks__cover-wrap">
                <BookCover
                  title={pick.title}
                  author={pick.author}
                  coverUrl={url}
                  width={84}
                  height={124}
                />
                {/* Dimming overlay for books on shelf */}
                {onShelf && <div className="weekly-picks__cover-dim" />}
                {/* Shelf status badge */}
                {badge && (
                  <div className={`weekly-picks__badge weekly-picks__badge--${badge.cls}`}>
                    {badge.icon}
                  </div>
                )}
                {/* Adding spinner overlay */}
                {isAdding && <div className="weekly-picks__cover-overlay" />}
              </div>
              <div className="weekly-picks__book-title">{pick.title}</div>
              <div className="weekly-picks__book-author">{pick.author}</div>
            </button>
          );
        })}
      </div>

      <div className="weekly-picks__hint">{t('weeklyPicksHint')}</div>
    </div>
  );
}
