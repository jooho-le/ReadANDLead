// styles/GlobalStyle.ts
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Colors (light) */
    --color-bg: #f4f2ff;
    --color-surface: #ffffff;
    --color-text: #111827;
    --color-text-muted: #6b7280;
    --color-border: #e5e7eb;
    --color-primary: #6c4ef6;
    --color-primary-600: #5a3fe0;
    --color-primary-700: #4a34c2;
    --color-accent: #22c55e;

    /* Typography */
    --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    --fs-display: clamp(28px, 5vw, 40px);
    --fs-h1: clamp(22px, 4vw, 32px);
    --fs-h2: clamp(18px, 3vw, 24px);
    --fs-body: 16px;

    /* Layout */
    --container: 1120px;
    --radius: 14px;
    --gap: 16px;
    --shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
      
  *, *::before, *::after {
    box-sizing: border-box;
  }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #0b0f1a;
      --color-surface: #0f172a;
      --color-text: #e5e7eb;
      --color-text-muted: #9ca3af;
      --color-border: #1f2937;
      --color-primary: #8b7bff;
      --color-primary-600: #7a6df5;
      --color-primary-700: #6c5be0;
    }
  }

  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  * { margin: 0; padding: 0; }

  body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: var(--fs-body);
  }

  a { text-decoration: none; color: inherit; }
  img { max-width: 100%; height: auto; display: block; }

  button {
    border: none; background: none; cursor: pointer; font-family: inherit;
  }

  ul, ol { list-style: none; }

  .container {
    max-width: var(--container);
    margin: 0 auto;
    padding: 0 16px;
  }

  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 24px;
    margin-bottom: 20px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 18px;
    border-radius: 12px;
    font-weight: 600;
    transition: transform .15s ease, box-shadow .2s ease, background-color .2s ease;

    &:focus-visible {
      outline: 2px solid transparent;
      box-shadow: 0 0 0 3px rgba(108, 78, 246, .35);
    }

    &.primary {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-600) 100%);
      color: #fff;
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 12px rgba(108, 78, 246, .35); }
      &:active { transform: translateY(0); background: var(--color-primary-700); }
      &:disabled { background: #cbd5e1; color: #fff; cursor: not-allowed; }
    }

    &.secondary {
      background: var(--color-surface);
      color: var(--color-primary);
      border: 2px solid var(--color-primary);
      &:hover { background: var(--color-primary); color: #fff; }
      &:active { background: var(--color-primary-700); border-color: var(--color-primary-700); }
      &:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
    }
  }

  .input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    font-size: 16px;
    background: #fff;
    color: var(--color-text);
    &:focus {
      outline: none;
      border-color: var(--color-primary-600);
      box-shadow: 0 0 0 3px rgba(108, 78, 246, .25);
    }
    &:disabled { background: #f1f5f9; color: #9ca3af; }
  }

  .title {
    font-size: var(--fs-display);
    font-weight: 800;
    margin-bottom: 12px;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-600) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: var(--fs-h2);
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--color-text);
  }

  .text {
    font-size: 1rem;
    color: var(--color-text-muted);
    line-height: 1.7;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font-size: 14px;
    color: var(--color-text);
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: saturate(1.1) blur(6px);
    background: var(--color-bg);
    background: color-mix(in srgb, var(--color-bg), #fff 30%);
    border-bottom: 1px solid var(--color-border);
  }

  .map-shell { overflow: hidden; }
  .map-area { width: 100%; height: min(70vh, 640px); }
`;

export default GlobalStyle;
