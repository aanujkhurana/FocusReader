import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import DocumentPreviewView from '../DocumentPreviewView.vue'
import type { DocumentStructure } from '../../types'

// Mock the services
vi.mock('../../services', () => ({
  progressManager: {
    getDocumentStructure: vi.fn(),
    savePosition: vi.fn()
  }
}))

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/preview/:documentId', name: 'preview', component: DocumentPreviewView },
    { path: '/setup/:documentId', name: 'setup', component: { template: '<div>Setup</div>' } }
  ]
})

const mockDocumentStructure: DocumentStructure = {
  id: 'test-doc-1',
  title: 'Test Document',
  totalWords: 15,
  sections: [
    {
      title: 'Introduction',
      startWordIndex: 0,
      endWordIndex: 4,
      type: 'heading'
    },
    {
      title: 'Main Content',
      startWordIndex: 5,
      endWordIndex: 9,
      type: 'paragraph'
    },
    {
      title: 'Bullet Points',
      startWordIndex: 10,
      endWordIndex: 14,
      type: 'bullet'
    }
  ],
  words: [
    { text: 'This', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'is', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'a', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'test', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'document', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'with', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'some', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'content', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'to', orp: 0, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'read', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'and', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'bullet', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'points', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'for', orp: 1, baseDelay: 250, punctuationPause: 0, isLongWord: false },
    { text: 'testing', orp: 2, baseDelay: 250, punctuationPause: 0, isLongWord: false }
  ],
  createdAt: new Date(),
  lastPosition: 0
}

describe('DocumentPreviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders document preview with complete text', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.preview-title').text()).toBe('Test Document')
    expect(wrapper.find('.preview-subtitle').text()).toContain('15 words')
    expect(wrapper.find('.document-text').exists()).toBe(true)
  })

  it('displays words with hover functionality', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const words = wrapper.findAll('.word')
    expect(words.length).toBeGreaterThan(0)
    
    // Check that multi-letter words are hoverable
    const hoverableWords = wrapper.findAll('.word-hoverable')
    expect(hoverableWords.length).toBeGreaterThan(0)
    
    // Check that single-letter words are not hoverable
    const singleWords = wrapper.findAll('.word-single')
    expect(singleWords.length).toBeGreaterThan(0)
  })

  it('ignores single-letter word clicks', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
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

  it('handles word selection and confirmation', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Click on a multi-letter word
    const hoverableWord = wrapper.find('.word-hoverable')
    await hoverableWord.trigger('click')

    // Check that confirmation modal appears
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-header h2').text()).toBe('Start Reading From Here?')
  })

  it('saves position and navigates on word confirmation', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    const mockPush = vi.fn()
    mockRouter.push = mockPush

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Select a word (e.g., word at index 5)
    const words = wrapper.findAll('.word-hoverable')
    await words[0]?.trigger('click')

    // Confirm selection
    const confirmButton = wrapper.find('.confirm-button')
    await confirmButton.trigger('click')

    // Check that position was saved (exact index depends on which word was clicked)
    expect(progressManager.savePosition).toHaveBeenCalled()

    // Check navigation
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'setup',
        params: { documentId: 'test-doc-1' },
        query: expect.objectContaining({
          customStart: 'true'
        })
      })
    )
  })

  it('displays word context in confirmation modal', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Click on a word
    const hoverableWord = wrapper.find('.word-hoverable')
    await hoverableWord.trigger('click')

    // Check that context is displayed
    expect(wrapper.find('.word-context').exists()).toBe(true)
    expect(wrapper.find('.word-position').exists()).toBe(true)
  })

  it('handles document not found error', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(null)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.error-state').exists()).toBe(true)
    expect(wrapper.find('.error-state h3').text()).toBe('Unable to load document')
  })

  it('navigates to setup when start from beginning is clicked', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    const mockPush = vi.fn()
    mockRouter.push = mockPush

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const startButton = wrapper.find('.start-button')
    await startButton.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'setup',
      params: { documentId: 'test-doc-1' }
    })
  })

  it('marks line-start words appropriately', async () => {
    const { progressManager } = await import('../../services')
    vi.mocked(progressManager.getDocumentStructure).mockReturnValue(mockDocumentStructure)

    await mockRouter.push('/preview/test-doc-1')

    const wrapper = mount(DocumentPreviewView, {
      global: {
        plugins: [mockRouter]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Check that line-start words exist (first word of each section)
    const lineStartWords = wrapper.findAll('.word-line-start')
    expect(lineStartWords.length).toBeGreaterThan(0)
  })
})