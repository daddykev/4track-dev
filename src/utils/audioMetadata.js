// src/utils/audioMetadata.js
export async function extractAudioMetadata(file) {
  const metadata = {
    format: '',
    sampleRate: null,
    bitDepth: null,
    bitrate: null,
    duration: null,
    channels: null
  }
  
  // Get format from file extension or MIME type
  const extension = file.name.split('.').pop().toLowerCase()
  const mimeType = file.type.toLowerCase()
  
  if (mimeType.includes('wav') || extension === 'wav') {
    metadata.format = 'WAV'
    // WAV files can have bit depth info in header
    metadata.bitDepth = await getWavBitDepth(file)
  } else if (mimeType.includes('mp3') || extension === 'mp3') {
    metadata.format = 'MP3'
    // MP3 doesn't have bit depth in the traditional sense
    metadata.bitDepth = null
  } else if (mimeType.includes('flac') || extension === 'flac') {
    metadata.format = 'FLAC'
    metadata.bitDepth = 24 // Common for FLAC, but would need proper parsing
  } else if (mimeType.includes('aac') || extension === 'aac' || extension === 'm4a') {
    metadata.format = 'AAC'
    metadata.bitDepth = null
  } else if (mimeType.includes('ogg') || extension === 'ogg') {
    metadata.format = 'OGG'
    metadata.bitDepth = null
  } else {
    metadata.format = extension.toUpperCase()
  }
  
  // Use Web Audio API to get sample rate and duration
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    metadata.sampleRate = audioBuffer.sampleRate
    metadata.duration = audioBuffer.duration
    metadata.channels = audioBuffer.numberOfChannels
    
    // Calculate bitrate for compressed formats (MP3, AAC, OGG)
    if (metadata.format === 'MP3' || metadata.format === 'AAC' || metadata.format === 'OGG') {
      // Bitrate = (file size in bits) / (duration in seconds)
      // Convert to kbps
      const fileSizeInBits = file.size * 8
      const bitrateInBps = fileSizeInBits / metadata.duration
      const bitrateInKbps = Math.round(bitrateInBps / 1000)
      
      // Round to common bitrates for MP3
      if (metadata.format === 'MP3') {
        metadata.bitrate = getNearestCommonBitrate(bitrateInKbps)
      } else {
        metadata.bitrate = bitrateInKbps
      }
    }
    
    audioContext.close()
  } catch (error) {
    console.error('Error decoding audio:', error)
  }
  
  return metadata
}

// Helper to round to nearest common MP3 bitrate
function getNearestCommonBitrate(bitrate) {
  const commonBitrates = [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
  
  let nearest = commonBitrates[0]
  let minDiff = Math.abs(bitrate - nearest)
  
  for (const rate of commonBitrates) {
    const diff = Math.abs(bitrate - rate)
    if (diff < minDiff) {
      minDiff = diff
      nearest = rate
    }
  }
  
  return nearest
}

// Helper to extract bit depth from WAV file header
async function getWavBitDepth(file) {
  try {
    const buffer = await file.slice(0, 44).arrayBuffer() // WAV header is typically 44 bytes
    const view = new DataView(buffer)
    
    // Check if it's a valid WAV file
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    if (riff !== 'RIFF') return null
    
    // Bit depth is at byte 34-35 in standard WAV files
    const bitDepth = view.getUint16(34, true) // true for little-endian
    return bitDepth
  } catch (error) {
    console.error('Error reading WAV header:', error)
    return null
  }
}

// Format the metadata for display
export function formatAudioMetadata(metadata) {
  if (!metadata) return ''
  
  const parts = []
  
  // For MP3 and other compressed formats, show bitrate instead of bit depth
  if (metadata.format === 'MP3' || metadata.format === 'AAC' || metadata.format === 'OGG') {
    if (metadata.bitrate) {
      parts.push(`${metadata.bitrate} kbps`)
    }
  } else if (metadata.bitDepth) {
    // For uncompressed formats (WAV, FLAC), show bit depth
    parts.push(`${metadata.bitDepth}-bit`)
  }
  
  // Sample rate
  if (metadata.sampleRate) {
    const sampleRateKHz = (metadata.sampleRate / 1000).toFixed(1)
    parts.push(`${sampleRateKHz} kHz`)
  }
  
  // Format
  if (metadata.format) {
    parts.push(metadata.format)
  }
  
  return parts.join(' ')
}