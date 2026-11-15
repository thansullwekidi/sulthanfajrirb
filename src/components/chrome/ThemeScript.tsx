import type { ReactNode } from "react";

const THEME_SCRIPT = `(function(){try{var key='dossier-theme';var stored=localStorage.getItem(key);var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export function ThemeScript(): ReactNode {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
