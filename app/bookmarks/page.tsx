'use client';
import { NavigationBar } from '../components/navigation-bar';
import { BookmarkList } from '../components/bookmark-list';
import { useAuth } from '../hooks/use-auth-hook';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="app-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ambient"><div className="ambient-1" /><div className="ambient-2" /></div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem', borderWidth: 3 }} />
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading your collection…</p>
        </div>
      </div>
    );
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there';

  return (
    <div className="app-bg" style={{ minHeight: '100vh' }}>
      <div className="ambient">
        <div className="ambient-1" />
        <div className="ambient-2" />
        <div className="ambient-3" />
      </div>

      <NavigationBar />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '5.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Welcome back, {firstName}
          </p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bookmark size={24} style={{ color: 'var(--violet)', flexShrink: 0 }} />
            My Collection
          </h1>
        </div>

        <div className="divider" style={{ marginBottom: '1.75rem' }} />

        <BookmarkList userId={user.id} />
      </main>
    </div>
  );
}