<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useTheme } from '@/composables/useTheme';

const props = defineProps({
  analyserNode: Object,
  isPlaying: Boolean
});

// Get theme values
const { canvasBgColor, canvasGridColor, isDarkTheme } = useTheme();

const spectroscopeCanvas = ref(null);
const animationFrame = ref(null);
let lastFrameTime = 0;

// Constants
const NUM_BANDS = 31;
const PEAK_HOLD_TIME = 1000;
const PEAK_RELEASE_RATE = 20;
const MIN_DB = -90;
const MAX_DB = 0;
const SMOOTHING_FACTOR = 0.8;
const BAR_WIDTH = 4;
const BAR_SPACING = 1;

// Frequency bands for 1/3 octave analysis
const FREQUENCY_BANDS = [
  20, 25, 31, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 
  400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 
  4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
];

// State for smoothing and peaks
const currentLevels = ref(new Float32Array(NUM_BANDS).fill(MIN_DB));
const peakLevels = ref(new Float32Array(NUM_BANDS).fill(MIN_DB));
const peakHoldTimes = ref(new Float32Array(NUM_BANDS).fill(0));

const formatFrequency = (freq) => {
  return freq >= 1000 ? 
    `${(freq/1000).toFixed(1)} kHz` : 
    `${freq} Hz`;
};

const drawSpectroscope = () => {
  const currentTime = performance.now();
  const deltaTime = lastFrameTime ? currentTime - lastFrameTime : 16.667;

  const ctx = spectroscopeCanvas.value?.getContext('2d');
  if (!ctx || !props.analyserNode || !props.isPlaying) {
    drawEmptyBands(ctx);
    animationFrame.value = requestAnimationFrame(drawSpectroscope);
    lastFrameTime = currentTime;
    return;
  }

  // Clear canvas with theme-aware background
  ctx.fillStyle = canvasBgColor.value;
  ctx.fillRect(0, 0, 159, 60);

  const bufferLength = props.analyserNode.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  props.analyserNode.getFloatFrequencyData(dataArray);

  // Calculate band values using defined frequency bands
  const bandLevels = new Float32Array(NUM_BANDS);
  const sampleRate = props.analyserNode.context.sampleRate;

  for (let i = 0; i < NUM_BANDS; i++) {
    const centerFreq = FREQUENCY_BANDS[i];
    // Calculate bandwidth for 1/3 octave
    const bandwidth = centerFreq * (Math.pow(2, 1/6) - Math.pow(2, -1/6));
    const startFreq = centerFreq - bandwidth/2;
    const endFreq = centerFreq + bandwidth/2;
    
    // Convert frequencies to FFT bins
    const startBin = Math.max(1, Math.floor(startFreq * bufferLength / sampleRate));
    const endBin = Math.min(
      bufferLength - 1, 
      Math.ceil(endFreq * bufferLength / sampleRate)
    );
    
    let energySum = 0;
    let binCount = 0;
    
    // Sum energy in the frequency band
    for (let j = startBin; j <= endBin; j++) {
      const magnitude = Math.pow(10, dataArray[j] / 20);
      energySum += magnitude * magnitude; // Use power sum for better accuracy
      binCount++;
    }

    if (binCount > 0) {
      // Convert back to dB
      const averagePower = energySum / binCount;
      bandLevels[i] = Math.max(MIN_DB, 10 * Math.log10(averagePower));
    } else {
      bandLevels[i] = MIN_DB;
    }
  }

  // Apply smoothing
  for (let i = 0; i < NUM_BANDS; i++) {
    currentLevels.value[i] = currentLevels.value[i] * SMOOTHING_FACTOR + 
                            bandLevels[i] * (1 - SMOOTHING_FACTOR);
    bandLevels[i] = currentLevels.value[i];
  }

  // Draw bands
  for (let i = 0; i < NUM_BANDS; i++) {
    const x = i * (BAR_WIDTH + BAR_SPACING) + 2;
    const level = Math.max(MIN_DB, Math.min(MAX_DB, bandLevels[i]));
    const normalizedLevel = (level - MIN_DB) / (MAX_DB - MIN_DB);
    const barHeight = Math.max(1, normalizedLevel * 55);

    ctx.fillStyle = getBarColor(i);
    ctx.fillRect(x, 58 - barHeight, BAR_WIDTH, barHeight);

    // Draw peak indicator
    if (peakLevels.value[i] !== undefined) {
      const peakNormalized = (peakLevels.value[i] - MIN_DB) / (MAX_DB - MIN_DB);
      const peakY = 58 - (peakNormalized * 55);
      ctx.fillStyle = isDarkTheme.value ? 'rgba(255, 255, 255, 0.8)' : 'rgba(44, 62, 80, 0.8)'; // Using --accent-color with opacity
      ctx.fillRect(x, peakY, BAR_WIDTH, 1);
    }
  }

  // Update peak levels
  for (let i = 0; i < NUM_BANDS; i++) {
    if (bandLevels[i] >= (peakLevels.value[i] || MIN_DB)) {
      peakLevels.value[i] = bandLevels[i];
      peakHoldTimes.value[i] = currentTime;
    } else if (currentTime - peakHoldTimes.value[i] > PEAK_HOLD_TIME) {
      peakLevels.value[i] = Math.max(
        bandLevels[i],
        peakLevels.value[i] - (PEAK_RELEASE_RATE * deltaTime / 1000)
      );
    }
  }

  lastFrameTime = currentTime;
  animationFrame.value = requestAnimationFrame(drawSpectroscope);
};

const getBarColor = (bandIndex) => {
  // Use a wider hue range (0-330 degrees) to better differentiate 31 bands
  const hue = (bandIndex / (NUM_BANDS - 1)) * 330;
  return `hsl(${hue}, 80%, 50%)`;
};

const drawEmptyBands = (ctx) => {
  if (!ctx) return;
  
  // Use theme-aware background color
  ctx.fillStyle = canvasBgColor.value;
  ctx.fillRect(0, 0, 159, 60);

  for (let i = 0; i < NUM_BANDS; i++) {
    const x = i * (BAR_WIDTH + BAR_SPACING) + 2;
    // Use theme-aware grid color
    ctx.fillStyle = canvasGridColor.value;
    ctx.fillRect(x, 55, BAR_WIDTH, 3);
  }
};

defineExpose({
  drawSpectroscope
});

onMounted(() => {
  const ctx = spectroscopeCanvas.value?.getContext('2d');
  drawEmptyBands(ctx);
  drawSpectroscope();
});

onBeforeUnmount(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<template>
  <div class="spectroscope-container">
    <canvas
      ref="spectroscopeCanvas"
      class="spectroscope"
      width="159"
      height="60"
    />
    <div class="frequency-tooltips">
      <div
        v-for="(freq, index) in FREQUENCY_BANDS"
        :key="index"
        class="tooltip-trigger"
        :data-frequency="formatFrequency(freq)"
        :style="{
          left: `${index * (BAR_WIDTH + BAR_SPACING) + 2}px`,
          width: `${BAR_WIDTH}px`
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.spectroscope-container {
  height: 60px;
  margin: 0 0.5rem;
  padding-top: 1px;
  background: var(--bg-secondary);
  position: relative;
}

.spectroscope {
  position: relative;
  z-index: 1; 
}

.frequency-tooltips {
  position: absolute;
  top: 1px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.tooltip-trigger {
  position: absolute;
  top: 0;
  height: 100%;
  pointer-events: auto;
  cursor: help;
}

.tooltip-trigger:hover {
  background: v-bind('isDarkTheme ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
}

.tooltip-trigger::after {
  content: attr(data-frequency);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.5rem;
  background: var(--bg-primary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 3;
}

.tooltip-trigger:hover::after {
  opacity: 1;
}
</style>