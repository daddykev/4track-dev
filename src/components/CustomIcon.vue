<template>
  <svg 
    :class="['custom-icon', className]"
    :width="size"
    :height="size"
    :viewBox="icon.viewBox"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path :d="icon.path" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { customIcons } from '@/utils/customIcons'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '1em'
  },
  className: {
    type: String,
    default: ''
  }
})

const icon = computed(() => {
  return customIcons[props.name] || { viewBox: '0 0 24 24', path: '' }
})
</script>

<style scoped>
.custom-icon {
  display: inline-block;
  vertical-align: -0.125em;
  overflow: visible;
}
</style>