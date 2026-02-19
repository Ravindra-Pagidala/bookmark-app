'use client';
import { Trash2, ExternalLink } from 'lucide-react';
import type { Bookmark } from '../types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: number) => void;
}

const COLORS: [string, string][] = [
  ['#7c6ef7', '#22d3ee'],
  ['#10d986', '#22d3ee'],
  ['#f43f72', '#f59e0b'],
  ['#f59e0b', '#7c6ef7'],
  ['#22d3ee', '#10d986'],
  ['#9b8eff', '#f43f72'],
];

function getColorPair(url: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getFaviconUrl(url: string): string {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

function getDomain(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
      .hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getHref(url: string): string {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function formatDate(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffHrs = diffMs / 3_600_000;
  if (diffHrs < 1)  return 'just now';
  if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
  if (diffHrs < 48) return 'yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [c1, c2]  = getColorPair(bookmark.url);
  const faviconUrl = getFaviconUrl(bookmark.url);
  const domain     = getDomain(bookmark.url);
  const href       = getHref(bookmark.url);

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('.bm-delete')) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onDelete(bookmark.id);
  }

  return (
    <div
      className="bm-card bm-card-enter"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      aria-label={`Open ${bookmark.title}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${c1}, ${c2})`,
        borderRadius: '16px 16px 0 0', opacity: 0.75,
      }} />

      <button
        className="bm-delete"
        onClick={handleDelete}
        title="Remove bookmark"
        aria-label="Delete bookmark"
      >
        <Trash2 size={12} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="bm-favicon">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              width={20}
              height={20}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: 4, background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
          )}
        </div>
        <span style={{
          fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500,
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {domain}
        </span>
      </div>

      <p style={{
        fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)',
        lineHeight: 1.4, flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {bookmark.title || 'Untitled'}
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 'auto', paddingTop: 10,
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
          {formatDate(bookmark.created_at)}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-3)',
            textDecoration: 'none', transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--violet-bright)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          Open <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}