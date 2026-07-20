"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "cookie-time-theme";

type ThemeMode = "system" | "light" | "dark";

const options: { mode: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { mode: "system", label: "هماهنگ با سیستم", icon: Monitor },
  { mode: "light", label: "حالت روشن", icon: Sun },
  { mode: "dark", label: "حالت تیره", icon: Moon },
];

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function resolvedTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode, persist: boolean) {
  const root = document.documentElement;
  const theme = resolvedTheme(mode);
  root.dataset.themeMode = mode;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-theme-managed]');
  if (!themeColor) {
    themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.dataset.themeManaged = "true";
    document.head.appendChild(themeColor);
  }
  themeColor.content = theme === "dark" ? "#140b0f" : "#751f39";
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function ThemeSwitcher() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const initialMode = document.documentElement.dataset.themeMode;
    const normalizedMode = isThemeMode(initialMode) ? initialMode : "system";
    applyTheme(normalizedMode, false);
    const modeFrame = window.requestAnimationFrame(() => setMode(normalizedMode));

    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (document.documentElement.dataset.themeMode === "system") {
        applyTheme("system", false);
      }
    };
    systemPreference.addEventListener("change", syncSystemTheme);
    return () => {
      window.cancelAnimationFrame(modeFrame);
      systemPreference.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  function selectMode(nextMode: ThemeMode) {
    setMode(nextMode);
    applyTheme(nextMode, true);
  }

  return (
    <div className="theme-switcher liquid-clear" role="radiogroup" aria-label="انتخاب ظاهر سایت">
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            className={active ? "active" : ""}
            onClick={() => selectMode(option.mode)}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
