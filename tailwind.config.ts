import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        primary: 'var(--primary)',
        good: 'var(--good)',
        fair: 'var(--fair)',
        poor: 'var(--poor)',
        closed: 'var(--closed)',
        'fun-dive': 'var(--fun-dive)',
        course: 'var(--course)',
        liveaboard: 'var(--liveaboard)',
        'non-dive': 'var(--non-dive)',
        // Shadcn bridge utilities (consumed by vendored ui/* components).
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        'primary-foreground': 'var(--primary-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'muted-foreground': 'var(--muted-foreground)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { lg: '0.625rem', md: '0.5rem', sm: '0.375rem' },
    },
  },
  plugins: [],
} satisfies Config
