<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useTheme } from '@/composables/useTheme';

const props = defineProps({
  leftAnalyserNode: Object,
  rightAnalyserNode: Object,
  isPlaying: Boolean
});

const levelMeterCanvas = ref(null);
const animationFrame = ref(null);
const lastFrameTime = ref(0);

// Get theme values from our composable
const { canvasBgColor, meterColors, isDarkTheme } = useTheme();

const channelData = ref({
  left: {
    peak: {
      current: -Infinity,
      held: -Infinity,
      holdTime: 0,
      displayed: -Infinity,
      clipCount: 0
    },
    rms: {
      current: -Infinity,
      averaged: -Infinity,
      recentMin: -Infinity,
      recentMax: -Infinity
    }
  },
  right: {
    peak: {
      current: -Infinity,
      held: -Infinity,
      holdTime: 0,
      displayed: -Infinity,
      clipCount: 0
    },
    rms: {
      current: -Infinity,
      averaged: -Infinity,
      recentMin: -Infinity,
      recentMax: -Infinity
    }
  }
});

const PEAK_RELEASE_RATE = 20;
const PEAK_HOLD_TIME = 1000;
const RANGE_INERTIA = 1000;

// Add this constant at the top with other constants
const PEAK_SMOOTHING_FACTOR = 0.7; // Higher value = more smoothing (0-1)
const FRAME_INTERVAL = 30; // Increase from 16ms to 30ms (33 FPS instead of 60+ FPS)

const updatePeakMeter = (peak, newValue, currentTime, deltaTime) => {
  // Apply smoothing to the new peak value
  const smoothedValue = peak.current === -Infinity ? 
    newValue : 
    peak.current * PEAK_SMOOTHING_FACTOR + newValue * (1 - PEAK_SMOOTHING_FACTOR);
  
  peak.current = smoothedValue;
  
  if (smoothedValue >= peak.held) {
    peak.held = smoothedValue;
    peak.holdTime = currentTime;
  } else if (currentTime - peak.holdTime > PEAK_HOLD_TIME) {
    peak.held = Math.max(smoothedValue, peak.held - (PEAK_RELEASE_RATE * deltaTime / 1000));
  }
  
  peak.displayed = applyPeakRelease(smoothedValue, peak.displayed, deltaTime);
  
  if (newValue >= 0) {
    peak.clipCount++;
  }
};

const updateRMSMeter = (rms, newValue, currentTime, deltaTime) => {
  rms.current = newValue;
  rms.averaged = calculateAveragedRMS(newValue, rms.averaged, deltaTime);
  
  if (deltaTime > 0) {
    const inertiaFactor = Math.exp(-deltaTime / RANGE_INERTIA);
    
    if (rms.recentMin === -Infinity || rms.averaged < rms.recentMin) {
      rms.recentMin = rms.averaged;
    } else {
      rms.recentMin += (rms.averaged - rms.recentMin) * (1 - inertiaFactor);
    }
    
    if (rms.recentMax === -Infinity || rms.averaged > rms.recentMax) {
      rms.recentMax = rms.averaged;
    } else {
      rms.recentMax += (rms.averaged - rms.recentMax) * (1 - inertiaFactor);
    }
  }
};

const calculateAveragedRMS = (newValue, currentAverage, deltaTime) => {
  const averagingTime = 300;
  const alpha = 1 - Math.exp(-deltaTime / averagingTime);
  return currentAverage === -Infinity ? newValue : currentAverage + alpha * (newValue - currentAverage);
};

const applyPeakRelease = (currentPeak, previousPeak, deltaTime) => {
  const releaseAmount = PEAK_RELEASE_RATE * (deltaTime / 1000);
  return Math.max(currentPeak, previousPeak - releaseAmount);
};

const drawMeter = () => {
  const currentTime = performance.now();
  const deltaTime = lastFrameTime.value ? currentTime - lastFrameTime.value : 16.667;

  // Frame rate limiting - use the new constant here
  if (currentTime - lastFrameTime.value < FRAME_INTERVAL) {
    animationFrame.value = requestAnimationFrame(drawMeter);
    return;
  }

  // If no canvas or no analyzer nodes or we aren't playing, draw empty
  if (!levelMeterCanvas.value || !props.leftAnalyserNode || !props.rightAnalyserNode || !props.isPlaying) {
    const ctx = levelMeterCanvas.value?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 120, 40);
      drawEmptyMeters(ctx);
    }
    lastFrameTime.value = currentTime;
    animationFrame.value = requestAnimationFrame(drawMeter);
    return;
  }

  const leftBufferLength = props.leftAnalyserNode.frequencyBinCount;
  const leftData = new Float32Array(leftBufferLength);
  props.leftAnalyserNode.getFloatTimeDomainData(leftData);

  const rightBufferLength = props.rightAnalyserNode.frequencyBinCount;
  const rightData = new Float32Array(rightBufferLength);
  props.rightAnalyserNode.getFloatTimeDomainData(rightData);

  // Process left channel
  let leftPeak = 0, leftRMS = 0;
  for (let i = 0; i < leftData.length; i++) {
    const val = Math.abs(leftData[i]);
    leftPeak = Math.max(leftPeak, val);
    leftRMS += val * val;
  }
  leftRMS = Math.sqrt(leftRMS / leftData.length);

  // Process right channel
  let rightPeak = 0, rightRMS = 0;
  for (let i = 0; i < rightData.length; i++) {
    const val = Math.abs(rightData[i]);
    rightPeak = Math.max(rightPeak, val);
    rightRMS += val * val;
  }
  rightRMS = Math.sqrt(rightRMS / rightData.length);

  // Convert to dB
  const toDB = (value) => (value <= 0 ? -Infinity : 20 * Math.log10(value));
  const leftPeakDB = toDB(leftPeak);
  const leftRMSDB = toDB(leftRMS);
  const rightPeakDB = toDB(rightPeak);
  const rightRMSDB = toDB(rightRMS);

  // Update meters
  updatePeakMeter(channelData.value.left.peak, leftPeakDB, currentTime, deltaTime);
  updatePeakMeter(channelData.value.right.peak, rightPeakDB, currentTime, deltaTime);
  updateRMSMeter(channelData.value.left.rms, leftRMSDB, currentTime, deltaTime);
  updateRMSMeter(channelData.value.right.rms, rightRMSDB, currentTime, deltaTime);

  // Draw the meter bars
  const ctx = levelMeterCanvas.value.getContext('2d');
  ctx.clearRect(0, 0, 150, 60);

  ctx.save();

  // Draw all meter bars in a single path
  ctx.beginPath();
  [
    { value: channelData.value.left.peak.displayed, y: 2.5, type: 'peak' },
    { value: channelData.value.left.rms.averaged, y: 17.5, type: 'rms' },
    { value: channelData.value.right.rms.averaged, y: 32.5, type: 'rms' },
    { value: channelData.value.right.peak.displayed, y: 47.5, type: 'peak' }
  ].forEach(meter => {
    drawMeterBar(ctx, meter.y, meter.value, meter.type, {
      recent: meter.type === 'peak' ? 
        (meter.y === 2.5 ? channelData.value.left.peak.held : channelData.value.right.peak.held) : 
        undefined,
      recentMin: meter.type === 'rms' ? 
        (meter.y === 17.5 ? channelData.value.left.rms.recentMin : channelData.value.right.rms.recentMin) : 
        undefined,
      recentMax: meter.type === 'rms' ? 
        (meter.y === 17.5 ? channelData.value.left.rms.recentMax : channelData.value.right.rms.recentMax) : 
        undefined
    });
  });

  ctx.restore();

  lastFrameTime.value = currentTime;
  animationFrame.value = requestAnimationFrame(drawMeter);
};

const drawMeterBar = (ctx, y, value, type, config = {}) => {
  const width = 150;
  const height = 10;
  const zones = meterColors.value[type];
  const MIN_DB = -45;
  const MAX_DB = 6;

  // Use theme-aware background color
  ctx.fillStyle = canvasBgColor.value;
  ctx.fillRect(0, y, width, height);

  const normalized = Math.max(MIN_DB, Math.min(MAX_DB, value));
  if (normalized > MIN_DB) {
    const meterWidth = (width * (normalized - MIN_DB)) / (MAX_DB - MIN_DB);

    if (normalized <= zones.middle.threshold) {
      ctx.fillStyle = zones.low.color;
      ctx.fillRect(0, y, meterWidth, height);
    } else if (normalized <= zones.top.threshold) {
      const middleWidth = (width * (zones.middle.threshold - MIN_DB)) / (MAX_DB - MIN_DB);
      ctx.fillStyle = zones.low.color;
      ctx.fillRect(0, y, middleWidth, height);
      ctx.fillStyle = zones.middle.color;
      ctx.fillRect(middleWidth, y, meterWidth - middleWidth, height);
    } else {
      const middleWidth = (width * (zones.middle.threshold - MIN_DB)) / (MAX_DB - MIN_DB);
      const topWidth = (width * (zones.top.threshold - MIN_DB)) / (MAX_DB - MIN_DB);
      ctx.fillStyle = zones.low.color;
      ctx.fillRect(0, y, middleWidth, height);
      ctx.fillStyle = zones.middle.color;
      ctx.fillRect(middleWidth, y, topWidth - middleWidth, height);
      ctx.fillStyle = zones.top.color;
      ctx.fillRect(topWidth, y, meterWidth - topWidth, height);
    }

    if (type === 'peak' && config.recent > MIN_DB) {
      const holdX = (width * (config.recent - MIN_DB)) / (MAX_DB - MIN_DB);
      // Use theme-aware color for peak hold
      ctx.fillStyle = isDarkTheme.value ? '#ffffff' : '#2c3e50';
      ctx.fillRect(holdX - 1, y, 2, height);
    }

    if (type === 'rms') {
      if (config.recentMin > MIN_DB) {
        const minX = (width * (config.recentMin - MIN_DB)) / (MAX_DB - MIN_DB);
        // Use theme-aware color for min/max indicators
        ctx.fillStyle = isDarkTheme.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(44, 62, 80, 0.4)';  // Using --accent-color with opacity
        ctx.fillRect(minX - 1, y, 2, height);
      }
      if (config.recentMax > MIN_DB) {
        const maxX = (width * (config.recentMax - MIN_DB)) / (MAX_DB - MIN_DB);
        // Use theme-aware color for min/max indicators
        ctx.fillStyle = isDarkTheme.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(44, 62, 80, 0.4)';  // Using --accent-color with opacity
        ctx.fillRect(maxX - 1, y, 2, height);
      }
    }
  }
};

const drawEmptyMeters = (ctx) => {
  for (let i = 0; i < 4; i++) {
    // Use theme-aware background color
    ctx.fillStyle = canvasBgColor.value;
    ctx.fillRect(0, 2.5 + (i * 15), 150, 10);
  }
};

defineExpose({
  drawMeter
});

onMounted(() => {
  const ctx = levelMeterCanvas.value?.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 150, 60);
    drawEmptyMeters(ctx);
  }
  drawMeter();
});

onBeforeUnmount(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<template>
  <canvas 
    ref="levelMeterCanvas"
    class="level-meter"
    width="150" 
    height="60"
  />
</template>

<style scoped>
.level-meter {
  height: 60px;
  background: var(--bg-secondary);
  margin: 0 0.5rem;
}
</style>