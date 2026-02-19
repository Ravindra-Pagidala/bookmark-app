'use client';
import { NavigationBar } from '../components/navigation-bar';
import { ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/use-auth-hook';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.8 20-21 0-1.4-.1-2.7-.5-4z" fill="#FFC107"/>
    <path d="M6.3 14.7l7 5.1C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.4-17.7 11.7z" fill="#FF3D00"/>
    <path d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.7-5.5C29.6 36.1 27 37 24 37c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.6 41.5 15.7 45 24 45z" fill="#4CAF50"/>
    <path d="M44.5 20H24v8.5h11.8c-.7 2.5-2.2 4.6-4.2 6.1l6.7 5.5C41.6 36.9 45 31 45 24c0-1.4-.1-2.7-.5-4z" fill="#1976D2"/>
  </svg>
);

const FEATURES = [
  {
    icon: <ShieldCheck size={18} />,
    color: '#10d986',
    bg: 'rgba(16,217,134,0.1)',
    title: 'Private by default',
    desc: 'Your bookmarks are yours alone — protected by row-level security.',
  },
  {
    icon: <Zap size={18} />,
    color: '#7c6ef7',
    bg: 'rgba(124,110,247,0.1)',
    title: 'Real-time sync',
    desc: 'Open two tabs and watch changes appear instantly — powered by Supabase Realtime.',
  },
  {
    icon: <RefreshCw size={18} />,
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    title: 'One-click access',
    desc: 'Sign in with Google. No passwords, no friction. Just your collection.',
  },
];

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/bookmarks');
  }, [user, router]);

  return (
    <div className="app-bg" style={{ minHeight: '100vh' }}>
      <div className="ambient">
        <div className="ambient-1" />
        <div className="ambient-2" />
      </div>

      <NavigationBar />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem 2rem', position: 'relative', zIndex: 1 }}>
        
        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: '3.5rem' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.25)', borderRadius: 100, padding: '0.35rem 0.85rem', marginBottom: '1.5rem' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--violet-bright)', letterSpacing: '0.04em' }}>REAL-TIME SYNC</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 3.25rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.035em', marginBottom: '1rem' }}>
            Your bookmarks,{' '}
            <span className="gradient-text-violet">beautifully</span>
            {' '}kept.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 440, margin: '0 auto' }}>
            SmartMark saves, syncs and organises your links in real-time across all your devices.
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', marginBottom: '3rem' }}>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '0.8rem 1.5rem',
              background: 'var(--bg-3)', border: '1px solid var(--border-bright)',
              borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-1)', fontWeight: 600, fontSize: '0.9375rem',
              fontFamily: 'Outfit, sans-serif',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              marginBottom: '1.25rem',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)'; }}
          >
            {loading ? <><div className="spinner" /> Redirecting…</> : <><GoogleIcon /> Continue with Google</>}
          </button>

          <div className="divider" style={{ marginBottom: '1.25rem' }} />

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            By signing in you agree to our terms. No email/password needed — Google OAuth only.
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem', width: '100%', maxWidth: 760 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
              <div className="feat-icon" style={{ background: f.bg, color: f.color, flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{f.title}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}