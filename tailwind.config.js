/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Play brand colors
        'play-indigo': '#6366F1',
        'play-teal': '#14B8A6',
        'play-violet': '#8B5CF6',
        'play-surface': '#1E293B',
        'play-dark': '#0F172A',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'triangle-float': 'triangle-float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'play': '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
        'play-lg': '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
        'play-glow': '0 0 30px rgba(99, 102, 241, 0.3)',
        'teal-glow': '0 0 30px rgba(20, 184, 166, 0.3)',
      },
      backgroundImage: {
        'gradient-play': 'linear-gradient(135deg, #6366F1 0%, #14B8A6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'triangle-pattern': `
          linear-gradient(45deg, rgba(99, 102, 241, 0.1) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(99, 102, 241, 0.1) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(99, 102, 241, 0.1) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(99, 102, 241, 0.1) 75%)
        `,
      },
      backgroundSize: {
        'triangle': '20px 20px',
      },
      backgroundPosition: {
        'triangle': '0 0, 0 10px, 10px -10px, -10px 0px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}