// styles/theme.ts
export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  spacing: (factor: number) => `${factor * 0.25}rem`,
  radius: '0.5rem',
  shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};