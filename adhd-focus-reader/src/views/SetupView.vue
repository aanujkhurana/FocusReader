<template>
  <div class="setup-container">
    <!-- Header -->
    <div class="setup-header">
      <h1 class="setup-title">{{ documentTitle }}</h1>
      <p class="setup-subtitle">
        {{ totalWords }} words • Estimated {{ estimatedTime }} reading time
      </p>
    </div>

    <!-- Speed Selection -->
    <div class="setup-section">
      <h2 class="section-title">Reading Speed</h2>
      <div class="speed-options">
        <button
          v-for="speed in speedOptions"
          :key="speed.value"
          @click="selectedSpeed = speed.value"
          :class="['speed-button', { active: selectedSpeed === speed.value }]"
        >
          <div class="speed-label">{{ speed.label }}</div>
          <div class="speed-description">{{ speed.description }}</div>
        </button>
      </div>
    </div>

    <!-- Feature Toggles -->
    <div class="setup-section">
      <h2 class="section-title">Reading Features</h2>
      
      <div class="toggle-option">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="autoPacingEnabled"
            class="toggle-input"
          >
          <span class="toggle-slider"></span>
          <div class="toggle-content">
            <div class="toggle-title">Auto Pacing</div>
            <div class="toggle-description">
              Automatically adjusts speed for punctuation and long words
            </div>
          </div>
        </label>
      </div>

      <div class="toggle-option">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="summariesEnabled"
            class="toggle-input"
          >
          <span class="toggle-slider"></span>
          <div class="toggle-content">
            <div class="toggle-title">Section Summaries</div>
            <div class="toggle-description">
              Brief confirmations of what you've read after each section
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Font Color Selection -->
    <div class="setup-section">
      <h2 class="section-title">Focus Color (ORP)</h2>
      <div class="color-options">
        <button
          v-for="color in colorOptions"
          :key="color.value"
          @click="selectColor(color.value)"
          :class="['color-button', { active: selectedFontColor === color.value }]"
          :style="{ 
            backgroundColor: '#111',
            borderColor: selectedFontColor === color.value ? color.value : '#333'
          }"
        >
          <div 
            class="color-preview" 
            :style="{ backgroundColor: color.value }"
          ></div>
          <div class="color-label">{{ color.name }}</div>
          <div class="color-contrast">{{ color.contrastRatio.toFixed(1) }}:1</div>
        </button>
        
        <!-- Custom color button -->
        <button
          @click="toggleCustomColorPicker"
          :class="['color-button', 'custom-color-button', { active: showCustomColorPicker }]"
        >
          <div 
            class="color-preview" 
            :style="{ backgroundColor: selectedFontColor }"
          ></div>
          <div class="color-label">Custom</div>
        </button>
      </div>
      
      <!-- Custom color picker -->
      <div v-if="showCustomColorPicker" class="custom-color-picker">
        <label for="custom-color-input" class="custom-color-label">
          Enter hex color (e.g., #FF0000)
        </label>
        <div class="custom-color-input-group">
          <input
            id="custom-color-input"
            type="text"
            v-model="customColorInput"
            placeholder="#FFFFFF"
            class="custom-color-input"
            maxlength="7"
          />
          <button @click="applyCustomColor" class="apply-color-button">
            Apply
          </button>
        </div>
        <div v-if="colorValidationMessage" class="color-validation-message">
          {{ colorValidationMessage }}
        </div>
        <div class="color-help-text">
          Color must have a contrast ratio of at least 4.5:1 against black background for WCAG AA compliance.
        </div>
      </div>
      
      <!-- Preview -->
      <div class="color-preview-text">
        <div class="preview-label">Preview:</div>
        <div 
          class="preview-word"
          :style="{ color: selectedFontColor }"
        >
          Reading
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="setup-actions">
      <button @click="startReading" class="start-button">
        Start Reading
      </button>
      <button @click="previewDocument" class="preview-button">
        Preview Document
      </button>
      <button @click="skipSetup" class="skip-button">
        Skip Setup
      </button>
    </div>

    <!-- Quick Setup Indicator -->
    <div class="setup-timer">
      <div class="timer-text">Setup completes in under 5 seconds</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { progressManager } from '../services'
import type { DocumentSummary, SetupConfig, SpeedOption } from '../types'
import { getPredefinedColors, validateFontColor, getContrastRatio, type ColorOption } from '../utils/colorContrast'

const router = useRouter()
const route = useRoute()

// Props from route params
const documentId = route.params.documentId as string

// Reactive state
const selectedSpeed = ref(250) // Default to Normal (250 WPM)
const autoPacingEnabled = ref(true) // Default enabled
const summariesEnabled = ref(false) // Default disabled
const selectedFontColor = ref('#ff0000') // Default to red (ORP focus color)
const customColorInput = ref('#ff0000')
const showCustomColorPicker = ref(false)
const colorValidationMessage = ref('')
const documentTitle = ref('Document')
const totalWords = ref(0)

// Predefined color options
const colorOptions = getPredefinedColors()

// Speed options
const speedOptions: SpeedOption[] = [
  {
    label: 'Slow',
    value: 180,
    description: '180 words per minute'
  },
  {
    label: 'Normal',
    value: 250,
    description: '250 words per minute'
  },
  {
    label: 'Fast',
    value: 350,
    description: '350 words per minute'
  }
]

// Computed properties
const estimatedTime = computed(() => {
  if (totalWords.value === 0) return '0 min'
  
  const minutes = Math.ceil(totalWords.value / selectedSpeed.value)
  if (minutes < 1) return '< 1 min'
  if (minutes === 1) return '1 min'
  return `${minutes} min`
})

// Load document data
onMounted(() => {
  loadDocumentData()
  loadUserPreferences()
})

function loadDocumentData() {
  // Load document data from progress manager
  const document = progressManager.getDocumentById(documentId)
  const documentStructure = progressManager.getDocumentStructure(documentId)
  
  if (document && documentStructure) {
    documentTitle.value = document.title
    totalWords.value = document.totalWords
  } else if (document) {
    // Fallback to document summary if structure not available
    documentTitle.value = document.title
    totalWords.value = document.totalWords
  } else {
    // Fallback if document not found
    documentTitle.value = 'Document'
    totalWords.value = 0
    console.warn('Document not found:', documentId)
  }
}

function loadUserPreferences() {
  // Load user's previous settings
  const settings = progressManager.getSettings()
  selectedSpeed.value = settings.baseSpeed
  summariesEnabled.value = settings.summariesEnabled
  selectedFontColor.value = settings.fontColor || '#ff0000'
  customColorInput.value = settings.fontColor || '#ff0000'
  // Auto pacing remains enabled by default
}

function startReading() {
  // Create reading configuration
  const config: SetupConfig = {
    baseSpeed: selectedSpeed.value,
    autoPacingEnabled: autoPacingEnabled.value,
    summariesEnabled: summariesEnabled.value
  }
  
  // Save user preferences including font color
  progressManager.updateSettings({
    baseSpeed: config.baseSpeed,
    summariesEnabled: config.summariesEnabled,
    fontColor: selectedFontColor.value
  })
  
  // Navigate to reading interface with configuration
  router.push({
    name: 'reading',
    params: { documentId },
    query: {
      baseSpeed: config.baseSpeed.toString(),
      autoPacingEnabled: config.autoPacingEnabled.toString(),
      summariesEnabled: config.summariesEnabled.toString(),
      fontColor: selectedFontColor.value,
      ...(route.query.customStart === 'true' && route.query.startPosition ? {
        customStart: 'true',
        startPosition: route.query.startPosition
      } : {})
    }
  })
}

function skipSetup() {
  // Use default settings and start reading immediately
  const defaultConfig: SetupConfig = {
    baseSpeed: 250,
    autoPacingEnabled: true,
    summariesEnabled: false
  }
  
  // Save default preferences including font color
  progressManager.updateSettings({
    baseSpeed: defaultConfig.baseSpeed,
    summariesEnabled: defaultConfig.summariesEnabled,
    fontColor: selectedFontColor.value
  })
  
  // Navigate to reading interface with defaults
  router.push({
    name: 'reading',
    params: { documentId },
    query: {
      baseSpeed: defaultConfig.baseSpeed.toString(),
      autoPacingEnabled: defaultConfig.autoPacingEnabled.toString(),
      summariesEnabled: defaultConfig.summariesEnabled.toString(),
      fontColor: selectedFontColor.value,
      ...(route.query.customStart === 'true' && route.query.startPosition ? {
        customStart: 'true',
        startPosition: route.query.startPosition
      } : {})
    }
  })
}

function selectColor(color: string) {
  selectedFontColor.value = color
  showCustomColorPicker.value = false
  colorValidationMessage.value = ''
}

function toggleCustomColorPicker() {
  showCustomColorPicker.value = !showCustomColorPicker.value
  if (showCustomColorPicker.value) {
    customColorInput.value = selectedFontColor.value
  }
}

function applyCustomColor() {
  const color = customColorInput.value.trim()
  
  // Validate hex format
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    colorValidationMessage.value = 'Please enter a valid hex color (e.g., #FF0000)'
    return
  }
  
  // Validate contrast ratio
  if (!validateFontColor(color)) {
    const ratio = getContrastRatio(color, '#000000')
    colorValidationMessage.value = `Contrast ratio ${ratio.toFixed(2)}:1 is too low. Minimum 4.5:1 required for WCAG AA compliance.`
    return
  }
  
  // Apply the color
  selectedFontColor.value = color
  showCustomColorPicker.value = false
  colorValidationMessage.value = ''
}

function previewDocument() {
  // Navigate to preview screen
  router.push({
    name: 'preview',
    params: { documentId }
  })
}
</script>

<style scoped>
.setup-container {
  min-height: 100vh;
  background: #000;
  color: #fff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
}

/* Header */
.setup-header {
  text-align: center;
  margin-bottom: 3rem;
  width: 100%;
}

.setup-title {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  color: #fff;
}

.setup-subtitle {
  font-size: 1rem;
  color: #aaa;
  margin: 0;
  font-weight: 300;
}

/* Sections */
.setup-section {
  width: 100%;
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  color: #ccc;
}

/* Speed Options */
.speed-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.speed-button {
  background: #111;
  border: 2px solid #333;
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.speed-button:hover {
  border-color: #555;
  background: #1a1a1a;
}

.speed-button.active {
  border-color: #fff;
  background: #222;
}

.speed-label {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.speed-description {
  font-size: 0.85rem;
  color: #aaa;
}

/* Toggle Options */
.toggle-option {
  margin-bottom: 1.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 1rem;
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.toggle-label:hover {
  background: #1a1a1a;
  border-color: #444;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #333;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #666;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-input:checked + .toggle-slider {
  background: #fff;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: #000;
}

.toggle-content {
  flex: 1;
}

.toggle-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.toggle-description {
  font-size: 0.85rem;
  color: #aaa;
  line-height: 1.3;
}

/* Color Options */
.color-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.color-button {
  background: #111;
  border: 2px solid #333;
  color: #fff;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.color-button:hover {
  border-color: #555;
  background: #1a1a1a;
}

.color-button.active {
  background: #222;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #333;
}

.color-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.color-contrast {
  font-size: 0.75rem;
  color: #888;
}

.custom-color-button {
  border-style: dashed;
}

.custom-color-picker {
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.custom-color-label {
  display: block;
  font-size: 0.9rem;
  color: #ccc;
  margin-bottom: 0.5rem;
}

.custom-color-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.custom-color-input {
  flex: 1;
  background: #000;
  border: 1px solid #444;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1rem;
}

.custom-color-input:focus {
  outline: none;
  border-color: #fff;
}

.apply-color-button {
  background: #fff;
  border: none;
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.apply-color-button:hover {
  background: #f0f0f0;
}

.color-validation-message {
  font-size: 0.85rem;
  color: #ff6b6b;
  margin-bottom: 0.5rem;
}

.color-help-text {
  font-size: 0.8rem;
  color: #888;
  line-height: 1.4;
}

.color-preview-text {
  background: #000;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.preview-label {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
}

.preview-word {
  font-size: 2.5rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Action Buttons */
.setup-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.start-button {
  background: #fff;
  border: none;
  color: #000;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-button:hover {
  background: #f0f0f0;
}

.preview-button {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.skip-button {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-button:hover {
  border-color: #777;
  color: #fff;
}

/* Timer Indicator */
.setup-timer {
  text-align: center;
  margin-top: auto;
}

.timer-text {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .setup-container {
    padding: 1rem;
  }
  
  .speed-options {
    grid-template-columns: 1fr;
  }
  
  .setup-actions {
    position: sticky;
    bottom: 1rem;
    background: #000;
    padding: 1rem 0;
  }
}
</style>