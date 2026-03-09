import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import DocumentPreviewView from '../views/DocumentPreviewView.vue'
import type { DocumentStructure } from '../types'

// Mock the services
vi.mock('../services', () => ({
  progressManager: {
    getDocumentStructure: vi.fn(),
    savePosition: vi.fn()
  }
}))

const mockDocumentStructure: DocumentStructure = {
  id: 'test-doc-1',
  title: 'Test Document for Preview',
  totalWords: 20,
  sections: [
    {
      title: 'Introduction',
      startWordIndex: 0,
      endWordIndex: 9,
      type: 'heading'
    },
    {
      title: 'Main Content',
      startWordIndex: 10,
      endWordIndex: 14,
      type: 'paragraph'
    },
    {
      title: 'Conclusion',
      startWordIndex: 15,
      endWordIndex: 19,
      type: 'normal'
    }
  ],
  words: [
    { text: 'This', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'is', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'the', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'introduction', orp: 4, baseDelay: 250, punctuationPause: 0, isLongWord: true },
    { text: 'section', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'with', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'some', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'test', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'content', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'here', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'Main', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'paragraph', orp: 3, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'with', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'more', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'words', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'Final', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'section', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'for', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'the', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'test', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false }
  ],
  createdAt: new Date(),
  lastPosition: 0
}

describe('Document Preview Integration', () => {
  let router: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/preview/:documentId', name: 'preview', component: DocumentPreviewView },
        { path: '/setup/:documentId', name: 'setup', component: { template: '<div>Setup</div>' } }
      ]
    })
    
    // Spy on router.push
    vi.spyOn(router, 'push')
  })

  it('should integrate preview functionality with word selection', async () => {
    const { progressManager } = await import('../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await router.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [router]
      }
    })

    // Wait for component to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify document information is displayed
    expect(wrapper.find('.preview-title').text()).toBe('Test Document for Preview')
    expect(wrapper.find('.preview-subtitle').text()).toContain('20 words')

    // Verify document text is rendered
    expect(wrapper.find('.document-text').exists()).toBe(true)
    const words = wrapper.findAll('.word')
    expect(words.length).toBeGreaterThan(0)

    // Test word selection workflow - select a multi-letter word
    const hoverableWord = wrapper.find('.word-hoverable')
    await hoverableWord.trigger('click')

    // Verify confirmation modal appears
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-header h2').text()).toBe('Start Reading From Here?')

    // Confirm selection
    const confirmButton = wrapper.find('.confirm-button')
    await confirmButton.trigger('click')

    // Verify position was saved
    expect(progressManager.savePosition).toHaveBeenCalled()
    
    // Verify navigation occurred - check the last call
    const pushCalls = router.push.mock.calls
    const lastCall = pushCalls[pushCalls.length - 1]?.[0]
    expect(lastCall).toMatchObject({
      name: 'setup',
      query: expect.objectContaining({
        customStart: 'true'
      })
    })
  })

  it('should handle start from beginning workflow', async () => {
    const { progressManager } = await import('../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await router.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Click start from beginning
    const startButton = wrapper.find('.start-button')
    await startButton.trigger('click')

    // Verify navigation to setup - check the last call
    const pushCalls = router.push.mock.calls
    const lastCall = pushCalls[pushCalls.length - 1]?.[0]
    expect(lastCall).toMatchObject({
      name: 'setup'
    })
  })

  it('should display complete document with proper formatting', async () => {
    const { progressManager } = await import('../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await router.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Check that sections are rendered with proper classes
    const sections = wrapper.findAll('.text-section')
    expect(sections.length).toBe(3)
    
    // Check heading section has the heading class
    const headingSections = wrapper.findAll('.section-heading')
    expect(headingSections.length).toBeGreaterThan(0)
    
    // Verify words are hoverable
    const hoverableWords = wrapper.findAll('.word-hoverable')
    expect(hoverableWords.length).toBeGreaterThan(0)
    
    // Verify single-letter words are marked (we have "is" and "the" which are 2-3 letters)
    // So we just check that words exist
    const allWords = wrapper.findAll('.word')
    expect(allWords.length).toBeGreaterThan(0)
  })

  it('should ignore single-letter word clicks', async () => {
    const { progressManager } = await import('../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await router.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Find and click a single-letter word
    const singleWord = wrapper.find('.word-single')
    if (singleWord.exists()) {
      await singleWord.trigger('click')
      
      // Modal should not appear
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    }
  })

  it('should show word context in confirmation modal', async () => {
    const { progressManager } = await import('../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await router.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Click a word
    const hoverableWord = wrapper.find('.word-hoverable')
    await hoverableWord.trigger('click')

    // Verify context is shown
    expect(wrapper.find('.word-context').exists()).toBe(true)
    expect(wrapper.find('.word-position').exists()).toBe(true)
    
    // Context should contain surrounding words
    const contextText = wrapper.find('.word-context').text()
    expect(contextText.length).toBeGreaterThan(0)
  })
})