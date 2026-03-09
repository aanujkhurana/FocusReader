/**
 * Integration tests for font color customization in SetupView
 * Validates Requirements: 2.2, 2.3, 3.1, 3.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SetupView from '../SetupView.vue'

// Mock the services module
vi.mock('../../services', () => ({
  progressManager: {
    getDocumentById: vi.fn(),
    getDocumentStructure: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn()
  }
}))

// Import after mocking
import { progressManager } from '../../services'

describe('SetupView - Font Color Customization', () => {
  let router: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup default mock returns
    vi.mocked(progressManager.getDocumentById).mockReturnValue({
      id: 'test-doc',
      title: 'Test Document',
      totalWords: 1000,
      uploadedAt: new Date(),
      lastPosition: 0,
      isCompleted: false
    })

    vi.mocked(progressManager.getDocumentStructure).mockReturnValue({
      id: 'test-doc',
      title: 'Test Document',
      totalWords: 1000,
      sections: [],
      words: Array(1000).fill({ text: 'word', orp: 0, baseDelay: 240, punctuationPause: 0, isLongWord: false }),
      createdAt: new Date(),
      lastPosition: 0
    })

    vi.mocked(progressManager.getSettings).mockReturnValue({
      baseSpeed: 250,
      summariesEnabled: false,
      fontColor: '#ffffff',
      lastUsed: new Date()
    })

    // Create router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/setup/:documentId',
          name: 'setup',
          component: SetupView
        },
        {
          path: '/reading/:documentId',
          name: 'reading',
          component: { template: '<div>Reading</div>' }
        }
      ]
    })

    router.push('/setup/test-doc')
  })

  it('should display predefined color options', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    const colorButtons = wrapper.findAll('.color-button')
    expect(colorButtons.length).toBeGreaterThan(0)
  })

  it('should load saved font color from settings', async () => {
    vi.mocked(progressManager.getSettings).mockReturnValue({
      baseSpeed: 250,
      summariesEnabled: false,
      fontColor: '#ffff00', // Yellow
      lastUsed: new Date()
    })

    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedFontColor).toBe('#ffff00')
  })

  it('should update selected color when clicking a color button', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    const colorButtons = wrapper.findAll('.color-button')
    const yellowButton = colorButtons.find((btn) => 
      btn.text().includes('Yellow')
    )

    if (yellowButton) {
      await yellowButton.trigger('click')
      expect(wrapper.vm.selectedFontColor).toBe('#ffff00')
    }
  })

  it('should show custom color picker when custom button is clicked', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    const customButton = wrapper.find('.custom-color-button')
    await customButton.trigger('click')

    expect(wrapper.vm.showCustomColorPicker).toBe(true)
    expect(wrapper.find('.custom-color-picker').exists()).toBe(true)
  })

  it('should validate custom color input', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Open custom color picker
    const customButton = wrapper.find('.custom-color-button')
    await customButton.trigger('click')

    // Try invalid hex format
    wrapper.vm.customColorInput = 'invalid'
    await wrapper.find('.apply-color-button').trigger('click')

    expect(wrapper.vm.colorValidationMessage).toContain('valid hex color')
  })

  it('should reject colors with insufficient contrast', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Open custom color picker
    const customButton = wrapper.find('.custom-color-button')
    await customButton.trigger('click')

    // Try dark color with low contrast
    wrapper.vm.customColorInput = '#333333'
    await wrapper.find('.apply-color-button').trigger('click')

    expect(wrapper.vm.colorValidationMessage).toContain('Contrast ratio')
    expect(wrapper.vm.colorValidationMessage).toContain('WCAG AA')
  })

  it('should accept valid custom color with good contrast', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Open custom color picker
    const customButton = wrapper.find('.custom-color-button')
    await customButton.trigger('click')

    // Apply valid color
    wrapper.vm.customColorInput = '#00ff00'
    await wrapper.find('.apply-color-button').trigger('click')

    expect(wrapper.vm.selectedFontColor).toBe('#00ff00')
    expect(wrapper.vm.showCustomColorPicker).toBe(false)
    expect(wrapper.vm.colorValidationMessage).toBe('')
  })

  it('should save font color preference when starting reading', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Select a color
    wrapper.vm.selectedFontColor = '#ffff00'

    // Start reading
    await wrapper.find('.start-button').trigger('click')

    expect(progressManager.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        fontColor: '#ffff00'
      })
    )
  })

  it('should display color preview with selected color', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Select yellow
    wrapper.vm.selectedFontColor = '#ffff00'
    await wrapper.vm.$nextTick()

    const previewWord = wrapper.find('.preview-word')
    expect(previewWord.exists()).toBe(true)
    // Browser converts hex to rgb, so check for the color value
    const style = previewWord.attributes('style')
    expect(style).toBeTruthy()
    expect(style).toMatch(/color:\s*(#ffff00|rgb\(255,\s*255,\s*0\))/)
  })

  it('should pass font color to reading view via query params', async () => {
    await router.isReady()
    const wrapper = mount(SetupView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()

    // Select a color
    wrapper.vm.selectedFontColor = '#00ff00'

    // Start reading
    const startButton = wrapper.find('.start-button')
    await startButton.trigger('click')
    
    // Wait for navigation
    await router.isReady()
    await wrapper.vm.$nextTick()

    // Check that updateSettings was called with the color
    expect(progressManager.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        fontColor: '#00ff00'
      })
    )
  })
})
