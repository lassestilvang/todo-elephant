export const theme = {
  colors: {
    primary: '#1E90FF',   // placeholder blue
    secondary: '#4A90E2', // coordinate blue
    success: '#2ECC71',   // placeholder green
    error: '#E53935',     // placeholder red
    background: '#F5F5F5',
    // High contrast theme colors for accessibility
    highContrast: {
      primary: '#000000',
      secondary: '#333333',
      success: '#000000',
      error: '#000000',
      background: '#FFFFFF',
      text: '#000000',
      border: '#000000'
    }
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

/**
 * WCAG 2.1 compliant color contrast ratios
 * Ensures text has at least 4.5:1 contrast ratio against background
 */
export function getAccessibleColor(foreground: string, background: string): string {
  // Simple luminance-based contrast check
  const getLuminance = (color: string) => {
    // Remove # if present and expand shorthand hex
    let hex = color.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = [
      r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4),
      g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4),
      b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
    ];
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  const fgLum = getLuminance(foreground);
  const bgLum = getLuminance(background);
  const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

  return contrast >= 4.5 ? foreground : (contrast < 1 ? foreground : (fgLum > bgLum ? '#000000' : '#FFFFFF'));
};