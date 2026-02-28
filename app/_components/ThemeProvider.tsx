'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type ThemeContextValue = {
  brandColor: string;
  setBrandColor: (color: string) => void;
};

const DEFAULT_BRAND = '#c69a45';
const STORAGE_KEY = 'barberpro_brand_color';

const ThemeContext = createContext<ThemeContextValue>({
  brandColor: DEFAULT_BRAND,
  setBrandColor: () => undefined
});

function isValidCssColor(color: string) {
  return typeof color === 'string' && color.trim().length > 0;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brandColor, setBrandColorState] = useState(DEFAULT_BRAND);

  const applyBrandColor = useCallback((color: string) => {
    if (!isValidCssColor(color)) return;
    document.documentElement.style.setProperty('--brand', color);
    document.documentElement.style.setProperty('--primary', color);
  }, []);

  const setBrandColor = useCallback(
    (color: string) => {
      if (!isValidCssColor(color)) return;
      setBrandColorState(color);
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, color);
      applyBrandColor(color);
    },
    [applyBrandColor]
  );

  useEffect(() => {
    const fromCache = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (fromCache) {
      setBrandColorState(fromCache);
      applyBrandColor(fromCache);
    } else {
      applyBrandColor(DEFAULT_BRAND);
    }

    const loadThemeFromSupabase = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return;

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('unit_id')
          .eq('id', userData.user.id)
          .single();

        if (profileError || !profile?.unit_id) return;

        const { data: settings, error: settingsError } = await supabase
          .from('unit_settings')
          .select('primary_color')
          .eq('unit_id', profile.unit_id)
          .single();

        if (settingsError || !settings?.primary_color) return;
        setBrandColor(settings.primary_color);
      } catch {
        // fallback silently to cached/default brand
      }
    };

    void loadThemeFromSupabase();
  }, [applyBrandColor, setBrandColor]);

  const value = useMemo(() => ({ brandColor, setBrandColor }), [brandColor, setBrandColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
