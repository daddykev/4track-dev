<template>
  <div id="app">
    <FourTrackNav />
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import FourTrackNav from './components/FourTrackNav.vue'
</script>

<style>
/* App wrapper */
#app {
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>