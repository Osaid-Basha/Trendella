import { useTheme } from "../state/theme";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand dark:border-slate-700 dark:hover:border-brand"
      aria-label="Toggle color theme"
    >
      <span role="img" aria-hidden="true">
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
};
