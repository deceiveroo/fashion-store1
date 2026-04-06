'use client';

import { useState, useEffect } from 'react';
import { tokens, themeConfigs } from '@/app/config/design-tokens';

// Define types for our theme
type ThemeType = 'minimal' | 'luxury' | 'eco';
type AccentColor = string;

interface DesignConfig {
  theme: ThemeType;
  accentColor: AccentColor;
  cardStyle: 'flat' | 'lifted';
  buttonStyle: 'rounded' | 'angular';
}

interface DesignTokens {
  colors: typeof tokens.colors;
  radii: typeof tokens.radii;
  spacing: typeof tokens.spacing;
  typography: typeof tokens.typography;
  shadows: typeof tokens.shadows;
  transitions: typeof tokens.transitions;
  theme: ThemeType;
  cardStyle: 'flat' | 'lifted';
  buttonStyle: 'rounded' | 'angular';
}

// Default configuration
const DEFAULT_CONFIG: DesignConfig = {
  theme: 'minimal',
  accentColor: tokens.colors.accent,
  cardStyle: 'lifted',
  buttonStyle: 'rounded',
};

export function useDesign() {
  const [designConfig, setDesignConfig] = useState<DesignConfig>(DEFAULT_CONFIG);
  const [tokensWithTheme, setTokensWithTheme] = useState<DesignTokens>(getTokensForTheme(DEFAULT_CONFIG.theme, DEFAULT_CONFIG.accentColor));

  // Load config from localStorage or site_config API on mount
  useEffect(() => {
    const loadDesignConfig = async () => {
      try {
        // First try to get from localStorage
        const savedConfig = localStorage.getItem('designConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig) as DesignConfig;
          setDesignConfig(parsedConfig);
          setTokensWithTheme(getTokensForTheme(parsedConfig.theme, parsedConfig.accentColor));
          return;
        }

        // If not in localStorage, fetch from site_config API
        const response = await fetch('/api/site-config');
        if (response.ok) {
          const siteConfig = await response.json();
          const config: DesignConfig = {
            theme: siteConfig.theme || DEFAULT_CONFIG.theme,
            accentColor: siteConfig.accentColor || DEFAULT_CONFIG.accentColor,
            cardStyle: siteConfig.cardStyle || DEFAULT_CONFIG.cardStyle,
            buttonStyle: siteConfig.buttonStyle || DEFAULT_CONFIG.buttonStyle,
          };
          
          setDesignConfig(config);
          setTokensWithTheme(getTokensForTheme(config.theme, config.accentColor));
        }
      } catch (error) {
        console.error('Failed to load design config:', error);
        // Use default config if loading fails
        setDesignConfig(DEFAULT_CONFIG);
        setTokensWithTheme(getTokensForTheme(DEFAULT_CONFIG.theme, DEFAULT_CONFIG.accentColor));
      }
    };

    loadDesignConfig();
  }, []);

  // Update CSS variables when tokens change
  useEffect(() => {
    const root = document.documentElement;
    
    const safeEntries = (o: object | undefined) => Object.entries(o ?? {});
    safeEntries(tokensWithTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    safeEntries(tokensWithTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    safeEntries(tokensWithTheme.radii).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    safeEntries(tokensWithTheme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, [tokensWithTheme]);

  const updateDesign = (newConfig: Partial<DesignConfig>) => {
    const updatedConfig = { ...designConfig, ...newConfig };
    setDesignConfig(updatedConfig);
    
    // Update tokens based on new config
    const newTokens = getTokensForTheme(updatedConfig.theme || designConfig.theme, updatedConfig.accentColor || designConfig.accentColor);
    setTokensWithTheme(newTokens);
    
    // Save to localStorage
    localStorage.setItem('designConfig', JSON.stringify(updatedConfig));
  };

  return {
    tokens: tokensWithTheme,
    config: designConfig,
    updateDesign,
    isThemeLoaded: !!tokensWithTheme.theme,
  };
}

// Helper function to get tokens for a specific theme and accent color
function getTokensForTheme(theme: ThemeType, accentColor: AccentColor): DesignTokens {
  const themeConfig = themeConfigs[theme];
  
  // Generate color palette based on accent color
  const generatePalette = (baseColor: string) => {
    // This is a simplified version - in a real app you might use a library
    // to generate tints and shades of the base color
    return {
      ...themeConfig.colors,
      accent: baseColor,
      accentHover: getHoverColor(baseColor),
    };
  };
  
  const colorPalette = generatePalette(accentColor);
  
  return {
    colors: colorPalette,
    radii: tokens.radii,
    spacing: tokens.spacing,
    typography: tokens.typography,
    shadows: themeConfig.theme === 'luxury' 
      ? { ...tokens.shadows, card: tokens.shadows.lg } 
      : tokens.shadows,
    transitions: tokens.transitions,
    theme,
    cardStyle: DEFAULT_CONFIG.cardStyle, // This would come from the config in a real implementation
    buttonStyle: DEFAULT_CONFIG.buttonStyle, // This would come from the config in a real implementation
  };
}

// Helper function to calculate hover color
function getHoverColor(color: string): string {
  // Convert hex to RGB if needed and calculate a darker/lighter version
  // This is a simplified version - a real implementation might be more sophisticated
  if (color.startsWith('#')) {
    // Remove # and parse hex
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken by 10%
    const darkenFactor = 0.9;
    const newR = Math.floor(r * darkenFactor);
    const newG = Math.floor(g * darkenFactor);
    const newB = Math.floor(b * darkenFactor);
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  // If not hex, return original color
  return color;
}