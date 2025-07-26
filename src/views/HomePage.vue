<script setup>
import { onMounted } from 'vue'
import CustomIcon from '@/components/CustomIcon.vue'

onMounted(() => {
  document.title = '4track - Open Source Music Platform | Artists Keep 100%'
})
</script>

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
        <p class="hero-tagline">
          Open source music industry software — developed for artists by artists
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
            View on GitHub
          </a>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-music" />
          Built for Artists
        </h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon :icon="['fab', 'paypal']" />
            </div>
            <h3>Direct Revenue</h3>
            <p>Every purchase goes straight to your PayPal. Set up royalty splits for collaborators. Get paid today.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon :icon="['fab', 'github']" />
            </div>
            <h3>Open Source Freedom</h3>
            <p>Self-host and keep 100% of revenue, or use our hosted solution at 2% fee (storage and support).</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon icon="fa-solid fa-volume-up" />
            </div>
            <h3>Studio Quality Audio</h3>
            <p>Share your music in HD up to 32-bit, 192 kHz. Listeners experience your art as intended.</p>
          </div>
        </div>
        <div class="artist-cta">
          <p class="text-center text-secondary mb-lg">
            Join the movement. Take control of your music.
          </p>
          <div class="flex flex-center">
            <router-link to="/artist/create" class="btn btn-outline">
              <font-awesome-icon icon="fa-solid fa-star" />
              Early Artist Access
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="how-it-works-section">
      <div class="container">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-heart" />
          Designed for Music Lovers
        </h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-icon">
              <font-awesome-icon icon="fa-solid fa-search" />
            </div>
            <h3>Discover</h3>
            <p>A music-only, infinite-scrolling feed</p>
          </div>
          <div class="step-card">
            <div class="step-icon">
              <font-awesome-icon icon="fa-solid fa-heart" />
            </div>
            <h3>Save</h3>
            <p>Heart tracks you love to build your personal collection</p>
          </div>
          <div class="step-card">
            <div class="step-icon">
              <font-awesome-icon icon="fa-solid fa-dollar-sign" />
            </div>
            <h3>Artist Support</h3>
            <p>Purchase tracks knowing where the money goes</p>
          </div>
        </div>
      </div>
    </section>

    <section class="industry-section">
      <div class="container">
        <h2 class="section-title">
          <font-awesome-icon icon="fa-solid fa-briefcase" />
          Optimized for Industry
        </h2>
        <div class="industry-grid">
          <div class="industry-card">
            <div class="industry-icon">
              <font-awesome-icon icon="fa-solid fa-percentage" />
            </div>
            <h3>Royalty Splits</h3>
            <p>Automatically split payments between collaborators. Define percentages for featured artists, producers, and contributors. PayPal handles multi-party payouts instantly.</p>
          </div>
          <div class="industry-card">
            <div class="industry-icon">
              <font-awesome-icon icon="fa-solid fa-users" />
            </div>
            <h3>Label & Manager Access</h3>
            <p>Hierarchical permissions for teams. Labels can manage entire rosters. Managers access assigned artists. Everyone sees only what they need.</p>
          </div>
          <div class="industry-card">
            <div class="industry-icon">
              <font-awesome-icon icon="fa-solid fa-folder-open" />
            </div>
            <h3>Artist Roster Management</h3>
            <p>Centralized dashboard for multi-artist operations. Create profiles, manage releases, track analytics. Built for modern music businesses.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="philosophy-section">
      <div class="container">
        <div class="philosophy-content card">
          <h2 class="text-center mb-lg">
            <font-awesome-icon icon="fa-solid fa-users" />
            Why We Built 4track
          </h2>
          <div class="philosophy-grid">
            <div class="philosophy-item">
              <h3 class="text-primary">Artist-First</h3>
              <p>No platform fees on sales. Artists set their own prices. Direct relationships with fans.</p>
            </div>
            <div class="philosophy-item">
              <h3 class="text-primary">Privacy-First</h3>
              <p>No cookies, no tracking, minimal data collection. GDPR and CCPA compliant by design.</p>
            </div>
            <div class="philosophy-item">
              <h3 class="text-primary">Community-Driven</h3>
              <p>Open source means transparency. Fork it, improve it, make it yours. Join our mission.</p>
            </div>
            <div class="philosophy-item">
              <h3 class="text-primary">Free Forever</h3>
              <p>Core features will always be free. No paywalls between artists and their audience.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>
            <font-awesome-icon icon="fa-solid fa-play" />
            The future of software is open source
          </h2>
          <p>Join the platform that puts artists and listeners first</p>
          <div class="cta-buttons">
            <router-link to="/signup" class="btn btn-primary btn-lg">
              <font-awesome-icon icon="fa-solid fa-plus" />
              Create Free Account
            </router-link>
            <a 
              href="https://github.com/daddykev/4track-dev" 
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline btn-lg"
            >
              <font-awesome-icon :icon="['fab', 'github']" />
              Explore Code
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero Section */
.hero-section {
  background: url('/hero-image.webp') center/cover no-repeat;
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
  font-size: 5.0rem; /* Increased by 30% from 3rem */
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
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
  font-size: 1.5rem; /* Increased by 20% from 1.4rem */
  margin-bottom: var(--spacing-sm);
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  color: var(--text-inverse);
}

.hero-tagline {
  font-size: 1.1rem; /* Increased by 10% from 1rem */
  margin-bottom: var(--spacing-2xl);
  opacity: 0.85;
  line-height: 1.6;
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
  margin-bottom: var(--spacing-2xl);
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

.artist-cta {
  margin-top: var(--spacing-xl);
}

/* How It Works Section - Updated */
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
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.step-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.step-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4rem;
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

/* Industry Section - New */
.industry-section {
  padding: 4rem 0;
  background-color: var(--bg-secondary);
}

.industry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.industry-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.industry-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.industry-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4rem;
}

.industry-card h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.25rem;
}

.industry-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Philosophy Section */
.philosophy-section {
  padding: 4rem 0;
  background-color: var(--bg-primary);
}

.philosophy-content {
  max-width: 1000px;
  margin: 0 auto;
}

.philosophy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-xl);
}

.philosophy-item h3 {
  margin-bottom: var(--spacing-sm);
  font-size: 1.1rem;
}

.philosophy-item p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.95rem;
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

/* Fixed outline button for light mode visibility */
.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

/* CTA section needs special handling for outline buttons */
.cta-section .btn-outline {
  background-color: transparent;
  color: var(--text-inverse);
  border: 2px solid var(--text-inverse);
}

.cta-section .btn-outline:hover {
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
    font-size: 2.6rem; /* Increased by 30% from 2rem */
    flex-direction: column;
    gap: var(--spacing-sm);
    white-space: normal;
  }
  
  .hero-subtitle {
    font-size: 1.32rem; /* Increased by 20% from 1.1rem */
    margin-bottom: var(--spacing-sm);
  }

  .hero-tagline {
    font-size: 0.99rem; /* Increased by 10% from 0.9rem */
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
  .how-it-works-section,
  .industry-section,
  .philosophy-section {
    padding: var(--spacing-2xl) 0;
  }
  
  .container {
    padding: 0 var(--spacing-md);
  }
  
  .section-title {
    font-size: 2rem;
    margin-bottom: var(--spacing-xl);
  }
  
  .feature-card,
  .step-card,
  .industry-card {
    padding: var(--spacing-lg);
  }
  
  .feature-icon,
  .step-icon,
  .industry-icon {
    font-size: 2.5rem;
    height: 3rem;
  }

  .steps-grid,
  .industry-grid,
  .philosophy-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.275rem; /* Increased by 30% from 1.75rem */
  }
  
  .hero-subtitle {
    font-size: 1.2rem; /* Increased by 20% from 1rem */
  }
  
  .section-title {
    font-size: 1.75rem;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .feature-card h3,
  .step-card h3,
  .industry-card h3 {
    font-size: 1.1rem;
  }
  
  .feature-card p,
  .step-card p,
  .industry-card p {
    font-size: 0.9rem;
  }

  .cta-section h2 {
    font-size: 1.5rem;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>