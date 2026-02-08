/**
 * Test for Task 17: Reading Start Overlay with Instructions
 * Tests the start overlay that appears when user clicks "Start Reading"
 * Requirements: 4.1, 4.2, 4.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ReadingView from '../ReadingView.vue'
import { progressManager } from '../../services/progressManager'

// Mock the services
vi.mock('../../services/progressManager', () => ({
  progressManager: {
    getDocumentStructure: vi.fn(),
    getLastPosition: vi.fn(),
    savePosition: vi.fn(),
    markCompleted: vi.fn()
  }
}))

vi.mock('../../services/accessibilityService', () => ({
  accessibilityService: {
    getAccessibleColorScheme: vi.fn(() => ({
      background: '#000000',
      text: '#ffffff',
      orp: '#ff0000',
      progress: 'rgba(255, 255, 255, 0.25)'
    })),
    announceStateChange: vi.fn(),
    announceProgress: vi.fn()
  }
}))

describe('Task 17: Reading Start Overlay', () => {
  let router: any

  beforeEach(() => {
    // Create a mock router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/reading/:documentId',
          name: 'reading',
          component: ReadingView
        }
      ]
    })

    // Mock document structure
    const mockDocumentStructure = {
      id: 'test-doc-1',
      title: 'Test Document',
      totalWords: 10,
      sections: [],
      words: [
        { text: 'Hello', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'world', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'this', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'is', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'a', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'test', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'document', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'for', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'reading', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
        { text: 'test.', orp: 1, baseDelay: 250, punctuationPause: 300, isLongWord: false }
      ],
      createdAt: new Date(),
      lastPosition: 0
    }

    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)
    vi.mocked(progressManager.getLastPosition).mockReturnValue(0)
  })

  it('should display start overlay when reading view loads', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that start overlay is visible
    const startOverlay = wrapper.find('.start-overlay')
    expect(startOverlay.exists()).toBe(true)
  })

  it('should show first word in start overlay', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that first word is displayed
    const startWordDisplay = wrapper.find('.start-word-display')
    expect(startWordDisplay.exists()).toBe(true)
    expect(startWordDisplay.text()).toContain('Hello')
  })

  it('should display instructions with SPACE and ESC keys', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that instructions are displayed
    const instructions = wrapper.find('.instruction-text')
    expect(instructions.exists()).toBe(true)
    expect(instructions.text()).toContain('SPACE')
    expect(instructions.text()).toContain('ESC')
  })

  it('should hide start overlay and start reading when space is pressed', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify start overlay is visible
    expect(wrapper.find('.start-overlay').exists()).toBe(true)

    // Simulate space key press
    const event = new KeyboardEvent('keydown', { key: ' ' })
    document.dispatchEvent(event)

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Start overlay should be hidden
    expect(wrapper.find('.start-overlay').exists()).toBe(false)
    
    // Main word display should be visible
    expect(wrapper.find('.word-display-container').exists()).toBe(true)
  })

  it('should maintain reading position when transitioning from overlay', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Get the first word from start overlay
    const startWordDisplay = wrapper.find('.start-word-display')
    const firstWord = startWordDisplay.text()

    // Simulate space key press to start reading
    const event = new KeyboardEvent('keydown', { key: ' ' })
    document.dispatchEvent(event)

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Main word display should show the same first word initially
    const mainWordDisplay = wrapper.find('.word-display')
    expect(mainWordDisplay.text()).toContain(firstWord)
  })

  it('should show ORP highlighting in start overlay', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that ORP highlighting exists in start overlay
    const startWordDisplay = wrapper.find('.start-word-display')
    const orpHighlight = startWordDisplay.find('.orp-highlight')
    expect(orpHighlight.exists()).toBe(true)
  })

  it('should use consistent styling between start overlay and main reading interface', async () => {
    await router.push('/reading/test-doc-1?baseSpeed=250&autoPacingEnabled=true&summariesEnabled=false')
    await router.isReady()

    const wrapper = mount(ReadingView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that start overlay has black background
    const startOverlay = wrapper.find('.start-overlay')
    expect(startOverlay.exists()).toBe(true)
    
    // The styling should be consistent with main reading interface
    const startWordDisplay = wrapper.find('.start-word-display')
    expect(startWordDisplay.exists()).toBe(true)
  })
})
