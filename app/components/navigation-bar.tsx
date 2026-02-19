'use client';
import Link from 'next/link';
import { LogOut, Bookmark } from 'lucide-react';
import { useAuth } from '../hooks/use-auth-hook';

function UserAvatar({ name, email }: { name?: string; email?: string }) {
  // Always use initial letter — never rely on Google avatar URL (breaks for some accounts)
  const initial = (name?.[0] ?? email?.[0] ?? 'U').toUpperCase();
  const colors = ['#7c6ef7', '#10d986', '#22d3ee', '#f43f72', '#f59e0b'];
  // Pick a consistent color based on the initial
  const color = colors[initial.charCodeAt(0) % colors.length];

  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: '#fff',
      flexShrink: 0, letterSpacing: 0,
    }}>
      {initial}
    </div>
  );
}

export function NavigationBar() {
  const { user, signOut, loading } = useAuth();

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'User';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo — always links to correct page */}
        <Link
          href={user ? '/bookmarks' : '/login'}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div className="logo-icon">
            <Bookmark size={15} color="#fff" fill="#fff" />
          </div>
          <div>
            <div className="logo-name">SmartMark</div>
            <div className="logo-tag">Live Sync</div>
          </div>
        </Link>

        {/* Right — only show user controls when logged in. On login page: nothing. */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.35rem 0.75rem 0.35rem 0.4rem',
              background: 'var(--bg-3)', border: '1px solid var(--border-bright)',
              borderRadius: 100,
            }}>
              <UserAvatar name={user.user_metadata?.full_name} email={user.email} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-2)' }} className="hidden sm:block">
                {displayName}
              </span>
            </div>

            {/* Sign out — text + icon, clearly labelled */}
            <button
              onClick={signOut}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.4rem 0.875rem',
                background: 'transparent',
                border: '1px solid var(--border-bright)',
                borderRadius: 100, cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--text-2)', fontSize: '0.8125rem', fontWeight: 500,
                fontFamily: 'Outfit, sans-serif',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--rose)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,63,114,0.35)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
              }}
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}