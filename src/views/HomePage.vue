<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          4track
          <CustomIcon name="cassetteTape" class="title-icon" />
        </h1>
        <p class="hero-subtitle">
          Next-gen indie music platform
        </p>
        <div class="hero-actions">
          <router-link to="/signup" class="btn btn-primary btn-lg hero-cta">
            <font-awesome-icon icon="fa-solid fa-play" />
            Start Free
          </router-link>
          <router-link to="/discover" class="btn btn-secondary btn-lg hero-cta-secondary">
            <font-awesome-icon icon="fa-solid fa-search" />
            Explore Music
          </router-link>
        </div>
        <div class="hero-github">
          <a 
            href="https://github.com/daddykev/4track-dev" 
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-github"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
            GitHub
          </a>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-star" />
          Why 4track?
        </h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="fa-solid fa-dollar-sign" />
            </div>
            <h3>Direct Support</h3>
            <p>100% of your purchases go directly to artists via PayPal</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="fa-solid fa-download" />
            </div>
            <h3>Own Your Music</h3>
            <p>Download tracks to keep forever, DRM-free</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="fa-solid fa-users" />
            </div>
            <h3>Discover Artists</h3>
            <p>Find new music from independent creators worldwide</p>
          </div>
        </div>
      </div>
    </section>

    <section class="how-it-works-section">
      <div class="container">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-gear" />
          How It Works
        </h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">
              <font-awesome-icon icon="fa-solid fa-play" />
            </div>
            <h3>Discover</h3>
            <p>Browse artist medleys and find your new favorite songs</p>
          </div>
          <div class="step-card">
            <div class="step-number">
              <font-awesome-icon icon="fa-solid fa-heart" />
            </div>
            <h3>Save</h3>
            <p>Heart tracks you love to build your collection</p>
          </div>
          <div class="step-card">
            <div class="step-number">
              <font-awesome-icon icon="fa-solid fa-credit-card" />
            </div>
            <h3>Support</h3>
            <p>Purchase tracks directly to support artists</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>
            <font-awesome-icon icon="fa-solid fa-users" />
            Ready to start your collection?
          </h2>
          <p>Join thousands of music lovers supporting independent artists</p>
          <div class="cta-buttons">
            <router-link to="/signup" class="btn btn-primary btn-lg">
              <font-awesome-icon icon="fa-solid fa-plus" />
              Create Free Account
            </router-link>
            <router-link to="/discover" class="btn btn-outline btn-lg">
              <font-awesome-icon icon="fa-solid fa-search" />
              Discover Music
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import CustomIcon from '@/components/CustomIcon.vue'

onMounted(() => {
  document.title = '4track - Next-gen indie music platform'
})
</script>

<style scoped>
/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: var(--text-inverse);
  padding: 4rem 0;
  text-align: center;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm); /* Changed from var(--spacing-md) to var(--spacing-sm) */
  white-space: nowrap;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  color: var(--text-inverse);
}

.title-icon {
  color: var(--text-inverse);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  font-size: 1.1em;
}

/* Make sure custom icon scales properly */
.hero-title .custom-icon {
  width: 1.1em;
  height: 1.1em;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-2xl);
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  color: var(--text-inverse);
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.hero-cta {
  background-color: var(--text-inverse);
  color: var(--color-primary);
  border: none;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  background-color: var(--bg-card);
}

.hero-cta-secondary {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-inverse);
  border: 2px solid var(--text-inverse);
  font-weight: 600;
  text-decoration: none;
  backdrop-filter: blur(10px);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.hero-cta-secondary:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

/* Features Section */
.features-section {
  padding: 4rem 0;
  background-color: var(--bg-secondary);
  width: 100%;
  margin: 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: var(--spacing-2xl);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.section-title .svg-inline--fa {
  color: var(--color-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.feature-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4rem;
}

.feature-card h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.25rem;
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* How It Works Section */
.how-it-works-section {
  padding: 4rem 0;
  background-color: var(--bg-primary);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.step-card {
  text-align: center;
  padding: var(--spacing-lg);
}

.step-number {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary), #764ba2);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.step-card h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 1.25rem;
}

.step-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* GitHub row */
.hero-github {
  margin-top: var(--spacing-xl);
  display: flex;
  justify-content: center;
}

/* GitHub Button - smaller size */
.btn-github {
  background-color: #24292e;
  color: var(--text-inverse);
  border: none;
  font-weight: 600;
  font-size: var(--font-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  text-decoration: none;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.btn-github:hover {
  background-color: #2ea043;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* CTA Section */
.cta-section {
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--text-inverse);
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-section h2 {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.cta-section p {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xl);
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn-outline {
  background-color: transparent;
  color: var(--text-inverse);
  border: 2px solid var(--text-inverse);
}

.btn-outline:hover {
  background-color: var(--text-inverse);
  color: var(--color-primary);
}

/* Button base styles */
.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  border: none;
  cursor: pointer;
}

.btn .svg-inline--fa {
  font-size: 0.9em;
}

/* Responsive styles */
@media (max-width: 768px) {
  .hero-section {
    padding: var(--spacing-2xl) 0;
    min-height: 60vh;
  }
  
  .hero-content {
    padding: 0 var(--spacing-md);
  }
  
  .hero-title {
    font-size: 2rem;
    flex-direction: column;
    gap: var(--spacing-sm);
    white-space: normal;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-xl);
  }
  
  .hero-actions,
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-cta,
  .hero-cta-secondary,
  .btn-github {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
  
  .hero-github {
    margin-top: var(--spacing-lg);
  }
  
  .btn-github {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-xs);
  }

  .features-section,
  .how-it-works-section {
    padding: var(--spacing-2xl) 0;
  }
  
  .container {
    padding: 0 var(--spacing-md);
  }
  
  .section-title {
    font-size: 2rem;
    margin-bottom: var(--spacing-xl);
  }
  
  .feature-card {
    padding: var(--spacing-lg);
  }
  
  .feature-icon {
    font-size: 2.5rem;
    height: 3rem;
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }

  .step-number {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .section-title {
    font-size: 1.75rem;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .feature-card h3 {
    font-size: 1.1rem;
  }
  
  .feature-card p {
    font-size: 0.9rem;
  }

  .cta-section h2 {
    font-size: 1.5rem;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>