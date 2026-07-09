import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Theme provider — binary light/dark, follows the OS until the user picks.
 *
 * The visual switch is pure CSS: toggling the `.dark` class on <html> re-points
 * the semantic tokens in index.css (`:root` → `.dark`). This provider only owns
 * the class + the persisted choice; no component reads colors from here.
 *
 * First paint is handled by a blocking inline script in index.html (reads the
 * same localStorage key + OS pref and sets the class before React mounts) so
 * there's no flash. This provider re-applies on mount to stay authoritative and
 * keeps following the OS until an explicit choice is stored.
 * ───────────────────────────────────────────────────────────────────────── */

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private-mode / disabled storage — fall back to OS preference.
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => readStoredTheme() ?? getSystemTheme()
  );
  // Once true, we stop mirroring the OS — the stored choice wins.
  const [hasExplicitChoice, setHasExplicitChoice] = useState<boolean>(
    () => readStoredTheme() !== null
  );

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Track OS changes only while the user hasn't made an explicit choice.
  useEffect(() => {
    if (hasExplicitChoice) {
      return;
    }
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [hasExplicitChoice]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    setHasExplicitChoice(true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — the class still applies for this session.
    }
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Provider + hook colocated by design; Fast Refresh's component-only rule
// doesn't apply to this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
