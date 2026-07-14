/**
 * Global theme definitions shared across components.
 * Uses brand neuatral place holders that can be swapped for
 * company colors later.
 */
export type ThemeState = {
  darkTheme: boolean;
};

export const theme = {
  colors: {
    primary: '#1E90FF',   // placeholder blue
    secondary: '#4A90E2', // coordinate blue
    success: '#2ECC71',   // placeholder green
    error: '#E53935',     // placeholder red
    background: '#F5F5F5'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: '0.5rem'
};

export const transition = {
  duration: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};