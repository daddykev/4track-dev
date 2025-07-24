<template>
  <div id="app">
    <NavBar />
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<style>
/* App wrapper */
#app {
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>