import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import BookCover from './BookCover';
import { resolveBookCover } from '../services/openLibrary';
import { addToWant } from '../services/readApi';
import { toast } from 'react-hot-toast';
import './WeeklyPicks.css';

function getWeekRange(lang) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
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

export default function WeeklyPicks({ picks }) {
  const { t, lang } = useLang();
  const [adding, setAdding] = useState(null);

  if (!picks || picks.length === 0) return null;

  const weekRange = getWeekRange(lang);

  const handleAdd = async (pick) => {
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
          const url = resolveBookCover(pick.coverId, pick.coverUrl);
          const isAdding = adding === pick.bookId;
          return (
            <button
              key={pick.bookId}
              className={`weekly-picks__book${isAdding ? ' weekly-picks__book--adding' : ''}`}
              onClick={() => handleAdd(pick)}
              disabled={!!adding}
            >
              <div className="weekly-picks__cover-wrap">
                <BookCover
                  title={pick.title}
                  author={pick.author}
                  coverUrl={url}
                  width={84}
                  height={124}
                />
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
