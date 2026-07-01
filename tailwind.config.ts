import type { Config } from 'tailwindcss'

// Tokens are stored in src/index.css as "R G B" triples specifically so this
// wrapper can splice in an alpha channel — this is what makes opacity
// modifiers (bg-primary/80, bg-line/60, etc.) work at all.
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: withOpacity('--surface'),
        'surface-elevated': withOpacity('--surface-elevated'),
        ink: withOpacity('--ink'),
        muted: withOpacity('--muted'),
        line: withOpacity('--line'),
        primary: withOpacity('--primary'),
        good: withOpacity('--good'),
        fair: withOpacity('--fair'),
        poor: withOpacity('--poor'),
        closed: withOpacity('--closed'),
        'fun-dive': withOpacity('--fun-dive'),
        course: withOpacity('--course'),
        liveaboard: withOpacity('--liveaboard'),
        'non-dive': withOpacity('--non-dive'),
        // Shadcn bridge utilities (consumed by vendored ui/* components).
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        card: withOpacity('--card'),
        'card-foreground': withOpacity('--card-foreground'),
        popover: withOpacity('--popover'),
        'popover-foreground': withOpacity('--popover-foreground'),
        'primary-foreground': withOpacity('--primary-foreground'),
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        'muted-foreground': withOpacity('--muted-foreground'),
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
