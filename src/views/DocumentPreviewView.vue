<template>
  <div class="preview-container">
    <!-- Header -->
    <div class="preview-header">
      <h1 class="preview-title">{{ documentTitle }}</h1>
      <p class="preview-subtitle">
        {{ totalWords }} words • Hover and click any word to start reading from there
      </p>
      <div class="preview-actions">
        <button @click="startFromBeginning" class="start-button primary">
          Start from Beginning
        </button>
        <button @click="goBack" class="back-button secondary">
          Back
        </button>
      </div>
    </div>

    <!-- Document Content -->
    <div class="preview-content" v-if="documentStructure">
      <div class="document-text">
        <template v-for="(section, sectionIndex) in documentStructure.sections" :key="sectionIndex">
          <div 
            :class="{ 
              'text-section': true,
              'section-heading': section.type === 'heading',
              'section-bullet': section.type === 'bullet'
            }"
          >
            <span
              v-for="(word, wordIndex) in getSectionWords(section)"
              :key="`${sectionIndex}-${wordIndex}`"
              :class="{ 
                'word': true,
                'word-hoverable': word.text.length > 1,
                'word-single': word.text.length === 1,
                'word-line-start': word.isLineStart,
                'word-selected': selectedWordIndex === word.globalIndex
              }"
              :data-word-index="word.globalIndex"
              @click="selectWord(word.globalIndex, word.text)"
              @mouseenter="hoveredWordIndex = word.globalIndex"
              @mouseleave="hoveredWordIndex = null"
            >{{ word.text }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading document preview...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load document</h3>
      <p>{{ errorMessage }}</p>
      <button @click="goBack" class="back-button">Go Back</button>
    </div>

    <!-- Selection Confirmation Modal -->
    <div v-if="showConfirmation" class="modal-overlay" @click="cancelSelection">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Start Reading From Here?</h2>
        </div>
        <div class="modal-body">
          <div class="selected-word-preview">
            <div class="word-highlight">
              <div class="word-context">
                {{ getWordContext() }}
              </div>
              <div class="word-position">
                Starting at word {{ selectedWordIndex + 1 }} of {{ totalWords }}
              </div>
            </div>
          </div>
          <p class="confirmation-text">
            You'll start reading from "{{ selectedWord }}". Your progress will be saved automatically.
          </p>
        </div>
        <div class="modal-actions">
          <button @click="confirmSelection" class="confirm-button primary">
            Start Reading
          </button>
          <button @click="cancelSelection" class="cancel-button secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { progressManager } from '../services'
import type { DocumentStructure, Section } from '../types'

const router = useRouter()
const route = useRoute()

// Props from route params
const documentId = route.params.documentId as string

// Reactive state
const documentStructure = ref<DocumentStructure | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const selectedWordIndex = ref<number | null>(null)
const selectedWord = ref<string>('')
const hoveredWordIndex = ref<number | null>(null)
const showConfirmation = ref(false)

// Computed properties
const documentTitle = computed(() => documentStructure.value?.title || 'Document')
const totalWords = computed(() => documentStructure.value?.totalWords || 0)

// Load document data
onMounted(() => {
  loadDocumentData()
})

async function loadDocumentData() {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Get document structure from progress manager
    const structure = progressManager.getDocumentStructure(documentId)
    
    if (!structure) {
      throw new Error('Document not found. Please upload the document again.')
    }
    
    documentStructure.value = structure
  } catch (error) {
    console.error('Error loading document:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load document'
  } finally {
    isLoading.value = false
  }
}

interface WordWithContext {
  text: string
  globalIndex: number
  isLineStart: boolean
}

function getSectionWords(section: Section): WordWithContext[] {
  if (!documentStructure.value) return []
  
  const words = documentStructure.value.words
    .slice(section.startWordIndex, section.endWordIndex + 1)
    .map((word, localIndex) => {
      const globalIndex = section.startWordIndex + localIndex
      // Mark first word of section as line start
      const isLineStart = localIndex === 0
      
      return {
        text: word.text,
        globalIndex,
        isLineStart
      }
    })
  
  return words
}

function selectWord(wordIndex: number, word: string) {
  // Ignore single-letter words
  if (word.length === 1) {
    return
  }
  
  selectedWordIndex.value = wordIndex
  selectedWord.value = word
  showConfirmation.value = true
}

function getWordContext(): string {
  if (!documentStructure.value || selectedWordIndex.value === null) return ''
  
  // Get 5 words before and 5 words after for context
  const contextStart = Math.max(0, selectedWordIndex.value - 5)
  const contextEnd = Math.min(documentStructure.value.words.length - 1, selectedWordIndex.value + 5)
  
  const contextWords = documentStructure.value.words
    .slice(contextStart, contextEnd + 1)
    .map((word, index) => {
      const globalIndex = contextStart + index
      if (globalIndex === selectedWordIndex.value) {
        return `**${word.text}**`
      }
      return word.text
    })
    .join(' ')
  
  return contextWords
}

function confirmSelection() {
  if (selectedWordIndex.value === null) return
  
  // Save the custom starting position
  progressManager.savePosition(documentId, selectedWordIndex.value)
  
  // Navigate to setup screen with the custom position
  router.push({
    name: 'setup',
    params: { documentId },
    query: { 
      customStart: 'true',
      startPosition: selectedWordIndex.value.toString()
    }
  })
}

function cancelSelection() {
  selectedWordIndex.value = null
  selectedWord.value = ''
  showConfirmation.value = false
}

function startFromBeginning() {
  // Navigate to setup screen without custom position
  router.push({
    name: 'setup',
    params: { documentId }
  })
}

function goBack() {
  // Go back to the previous page (likely landing or setup)
  router.back()
}
</script>

<style scoped>
.preview-container {
  min-height: 100vh;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.preview-header {
  position: sticky;
  top: 0;
  background: #000;
  border-bottom: 1px solid #333;
  padding: 2rem;
  z-index: 100;
}

.preview-title {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  color: #fff;
}

.preview-subtitle {
  font-size: 1rem;
  color: #aaa;
  margin: 0 0 1.5rem 0;
}

.preview-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.start-button,
.back-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.primary {
  background: #fff;
  color: #000;
}

.primary:hover {
  background: #f0f0f0;
}

.secondary {
  background: transparent;
  color: #ccc;
  border: 1px solid #555;
}

.secondary:hover {
  border-color: #777;
  color: #fff;
}

/* Content */
.preview-content {
  padding: 0 2rem 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.document-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #ddd;
}

.text-section {
  margin-bottom: 1.5rem;
}

.section-heading {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

.section-bullet {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.word {
  display: inline;
  padding: 2px 1px;
  margin: 0 2px;
  transition: all 0.15s ease;
  border-radius: 3px;
}

.word-hoverable {
  cursor: pointer;
}

.word-hoverable:hover {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.word-single {
  cursor: default;
  opacity: 0.7;
}

.word-line-start {
  font-weight: 500;
  color: #fff;
}

.word-selected {
  background: rgba(74, 222, 128, 0.3) !important;
  color: #4ade80 !important;
  font-weight: 600;
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #111;
  border: 1px solid #333;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #333;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 500;
}

.modal-body {
  padding: 1.5rem;
}

.selected-word-preview {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.word-highlight {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-context {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccc;
}

.word-position {
  font-size: 0.8rem;
  color: #666;
}

.confirmation-text {
  font-size: 0.95rem;
  color: #aaa;
  margin: 0;
  line-height: 1.4;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid #333;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-button,
.cancel-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.confirm-button.primary {
  background: #4ade80;
  color: #000;
}

.confirm-button.primary:hover {
  background: #22c55e;
}

.cancel-button.secondary {
  background: transparent;
  color: #ccc;
  border: 1px solid #555;
}

.cancel-button.secondary:hover {
  border-color: #777;
  color: #fff;
}

/* Responsive */
@media (max-width: 768px) {
  .preview-header {
    padding: 1rem;
  }
  
  .preview-title {
    font-size: 1.5rem;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .preview-content {
    padding: 0 1rem 1rem;
  }
  
  .document-text {
    font-size: 1rem;
    line-height: 1.6;
  }
  
  .word {
    margin: 0 1px;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>