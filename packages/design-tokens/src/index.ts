/**
 * Phase 02 design tokens, shared by the native applications and the admin web.
 * Keep the CSS custom properties in styles/tokens.css in sync.
 */
export const colors = {
  ink: '#17243F',
  inkSoft: '#485B75',
  muted: '#8090A6',
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  border: '#E5EAF2',
  primary: '#3956E8',
  primaryLight: '#EEF1FF',
  teal: '#079F91',
  tealLight: '#E5F8F3',
  amber: '#D58B19',
  amberLight: '#FFF5E0',
  danger: '#CE4962',
  dangerLight: '#FFF0F2',
  dark: '#101F3F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  display: 32,
  heading: 24,
  title: 19,
  body: 15,
  small: 13,
  caption: 11,
} as const;

export const theme = { colors, spacing, radii, typography } as const;
