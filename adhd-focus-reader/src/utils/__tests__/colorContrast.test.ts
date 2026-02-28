/**
 * Unit tests for color contrast validation utilities
 * Validates Requirements: 2.2, 2.3, 3.1, 3.2
 */

import { describe, it, expect } from 'vitest'
import {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateFontColor,
  getPredefinedColors
} from '../colorContrast'

describe('colorContrast', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000')
      expect(ratio).toBeCloseTo(21, 0) // White on black has 21:1 ratio
    })

    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 0) // Same ratio regardless of order
    })

    it('should return 1:1 for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff')
      expect(ratio).toBeCloseTo(1, 0)
    })

    it('should handle colors without # prefix', () => {
      const ratio = getContrastRatio('ffffff', '000000')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return 0 for invalid hex colors', () => {
      const ratio = getContrastRatio('invalid', '#000000')
      expect(ratio).toBe(0)
    })
  })

  describe('meetsWCAGAA', () => {
    it('should return true for white on black (21:1)', () => {
      expect(meetsWCAGAA('#ffffff', '#000000')).toBe(true)
    })

    it('should return true for yellow on black (19.56:1)', () => {
      expect(meetsWCAGAA('#ffff00', '#000000')).toBe(true)
    })

    it('should return false for dark gray on black (low contrast)', () => {
      expect(meetsWCAGAA('#333333', '#000000')).toBe(false)
    })

    it('should return true for colors meeting exactly 4.5:1', () => {
      // #767676 on black is approximately 4.5:1
      expect(meetsWCAGAA('#767676', '#000000')).toBe(true)
    })
  })

  describe('meetsWCAGAAA', () => {
    it('should return true for white on black (21:1)', () => {
      expect(meetsWCAGAAA('#ffffff', '#000000')).toBe(true)
    })

    it('should return false for colors below 7:1', () => {
      // #767676 is around 4.5:1, below AAA threshold
      expect(meetsWCAGAAA('#767676', '#000000')).toBe(false)
    })
  })

  describe('validateFontColor', () => {
    it('should validate white as acceptable', () => {
      expect(validateFontColor('#ffffff')).toBe(true)
    })

    it('should validate yellow as acceptable', () => {
      expect(validateFontColor('#ffff00')).toBe(true)
    })

    it('should validate green as acceptable', () => {
      expect(validateFontColor('#00ff00')).toBe(true)
    })

    it('should validate cyan as acceptable', () => {
      expect(validateFontColor('#00ffff')).toBe(true)
    })

    it('should reject dark colors with low contrast', () => {
      expect(validateFontColor('#333333')).toBe(false)
    })

    it('should reject black on black', () => {
      expect(validateFontColor('#000000')).toBe(false)
    })
  })

  describe('getPredefinedColors', () => {
    it('should return array of color options', () => {
      const colors = getPredefinedColors()
      expect(Array.isArray(colors)).toBe(true)
      expect(colors.length).toBeGreaterThan(0)
    })

    it('should include required properties for each color', () => {
      const colors = getPredefinedColors()
      colors.forEach((color) => {
        expect(color).toHaveProperty('name')
        expect(color).toHaveProperty('value')
        expect(color).toHaveProperty('contrastRatio')
        expect(typeof color.name).toBe('string')
        expect(typeof color.value).toBe('string')
        expect(typeof color.contrastRatio).toBe('number')
      })
    })

    it('should include white color option', () => {
      const colors = getPredefinedColors()
      const white = colors.find((c) => c.value === '#ffffff')
      expect(white).toBeDefined()
      expect(white?.name).toBe('White')
    })

    it('should have all colors meeting WCAG AA standards', () => {
      const colors = getPredefinedColors()
      colors.forEach((color) => {
        expect(color.contrastRatio).toBeGreaterThanOrEqual(4.5)
      })
    })
  })
})
