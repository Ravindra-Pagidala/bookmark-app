'use client';
import { BookmarkCard } from './bookmark-card';
import { Plus, Search, X, Link2, AlignLeft, Globe } from 'lucide-react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useBookmarks } from '../hooks/use-bookmarks-hook';

interface BookmarkListProps {
  userId: string;
}

type SortBy = 'recent' | 'title';

export function BookmarkList({ userId }: BookmarkListProps) {
  const { bookmarks, loading, error, addBookmark, deleteBookmark, subscribed } = useBookmarks(userId);

  const [showModal, setShowModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl]     = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal) setTimeout(() => titleRef.current?.focus(), 80);
  }, [showModal]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...bookmarks]
      .filter(b => !q || b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .sort((a, b) =>
        sortBy === 'title'
          ? a.title.localeCompare(b.title)
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [bookmarks, searchQuery, sortBy]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const title = formTitle.trim();
    let url = formUrl.trim();

    if (!title) { setFormError('Please enter a title.'); return; }
    if (!url)   { setFormError('Please enter a URL.'); return; }

    // Auto-prepend https:// if missing so users can paste bare domains
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    try {
      setFormLoading(true);
      await addBookmark({ title, url });
      setFormTitle('');
      setFormUrl('');
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save bookmark. Please try again.');
    } finally {
      setFormLoading(false);
    }
  }, [formTitle, formUrl, addBookmark]);

  const openModal  = () => { setFormError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFormTitle(''); setFormUrl(''); setFormError(''); };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', paddingTop: '0.5rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bm-card">
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 13, width: '75%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '50%' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚠️</p>
        <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>{error}</p>
        <button className="btn-secondary" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '0.75rem',
        marginBottom: '1.75rem',
      }}>
        {/* Left: count + live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500 }}>
            {filteredBookmarks.length}{bookmarks.length !== filteredBookmarks.length ? ` of ${bookmarks.length}` : ''}{' '}
            {filteredBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
          </span>
          <div className={`pill ${subscribed ? 'pill-green' : ''}`} style={{ fontSize: '0.7rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: subscribed ? 'var(--emerald)' : 'var(--text-3)', display: 'inline-block' }} />
            {subscribed ? 'Live' : 'Connecting…'}
          </div>
        </div>

        {/* Right: search + sort + add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, paddingRight: searchQuery ? 28 : 10, width: 210, height: 34, fontSize: '0.8125rem' }}
              placeholder="Search bookmarks…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort — only two clear options */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            style={{
              height: 34, padding: '0 28px 0 10px',
              background: 'var(--bg-3)', border: '1px solid var(--border-bright)',
              borderRadius: 10, color: 'var(--text-1)',
              fontSize: '0.8125rem', fontWeight: 500,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer', outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239898b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value="recent">Newest first</option>
            <option value="title">A → Z</option>
          </select>

          {/* Add button */}
          <button
            className="btn-primary"
            onClick={openModal}
            style={{ height: 34, padding: '0 0.875rem', fontSize: '0.8125rem', gap: 5 }}
          >
            <Plus size={14} />
            Add bookmark
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredBookmarks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          {searchQuery ? (
            <>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', marginBottom: 6 }}>
                No bookmarks match &ldquo;{searchQuery}&rdquo;
              </p>
              <button className="btn-ghost" onClick={() => setSearchQuery('')} style={{ marginTop: 6, fontSize: '0.8125rem' }}>
                Clear search
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--bg-3)', border: '1px solid var(--border-bright)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <Link2 size={22} color="var(--text-3)" />
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>No bookmarks yet</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
                Save your first link to get started.
              </p>
              <button className="btn-primary" onClick={openModal}>
                <Plus size={14} /> Add bookmark
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {filteredBookmarks.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.875rem',
        }}>
          {filteredBookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={deleteBookmark}
            />
          ))}
        </div>
      )}

      {/* ── Add Bookmark Modal ── */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                  Add bookmark
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 3 }}>
                  Save any link to your collection
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 4, borderRadius: 6,
                  display: 'flex', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  <AlignLeft size={10} /> Title
                </label>
                <input
                  ref={titleRef}
                  className="input"
                  type="text"
                  placeholder="e.g. React documentation"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* URL */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  <Globe size={10} /> URL
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="https://example.com"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  maxLength={2000}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 5 }}>
                  You can paste a bare domain like <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--violet-bright)' }}>youtube.com</code> — we&apos;ll add https:// automatically.
                </p>
              </div>

              {/* Error */}
              {formError && (
                <p style={{
                  fontSize: '0.8125rem', color: 'var(--rose)',
                  background: 'rgba(244,63,114,0.08)', border: '1px solid rgba(244,63,114,0.2)',
                  borderRadius: 8, padding: '0.5rem 0.75rem',
                }}>
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={closeModal} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading || !formTitle.trim() || !formUrl.trim()}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {formLoading
                    ? <><div className="spinner" /> Saving…</>
                    : <><Plus size={14} /> Save bookmark</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}