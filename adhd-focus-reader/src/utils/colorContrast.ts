/**
 * Color contrast validation utilities for WCAG AA compliance
 * Validates Requirements: 2.2, 2.3, 3.1, 3.2
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Calculate relative luminance for a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return 0
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if color combination meets WCAG AA standard for large text (4.5:1)
 * Large text is defined as 18pt+ or 14pt+ bold
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5
}

/**
 * Check if color combination meets WCAG AAA standard for large text (7:1)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 7.0
}

/**
 * Validate font color against black background
 * Returns true if the color meets WCAG AA standards
 */
export function validateFontColor(color: string): boolean {
  return meetsWCAGAA(color, '#000000')
}

/**
 * Get predefined color options that meet WCAG AA standards
 */
export interface ColorOption {
  name: string
  value: string
  contrastRatio: number
}

export function getPredefinedColors(): ColorOption[] {
  const colors = [
    { name: 'Red', value: '#ff0000' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#00bfff' },
    { name: 'Cyan', value: '#00ffff' },
    { name: 'Magenta', value: '#ff00ff' }
  ]

  return colors.map((color) => ({
    ...color,
    contrastRatio: getContrastRatio(color.value, '#000000')
  }))
}
