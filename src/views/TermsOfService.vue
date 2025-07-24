<template>
  <div class="page-container">
    <div class="section">
      <div class="section-header">
        <h1 class="section-title">
          <font-awesome-icon :icon="['fas', 'file-alt']" class="section-icon" />
          Terms of Service
        </h1>
        <p class="text-secondary">Last updated: July 1, 2025</p>
      </div>
      
      <div class="legal-content">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using MusicDrop ("Service"), you agree to be bound by these Terms of Service. These Terms are designed to comply with applicable laws including GDPR (for EU users), CCPA (for California users), and other relevant regulations.</p>

        <h2>2. Data Protection and Privacy Responsibilities</h2>
        <h3>2.1 GDPR Compliance (EU/UK Users)</h3>
        <p>When collecting fan data through our platform, you must:</p>
        <ul>
          <li><strong>Obtain explicit consent</strong> for data collection and marketing communications</li>
          <li><strong>Provide clear privacy information</strong> about how you'll use fan data</li>
          <li><strong>Implement data subject rights</strong> (access, deletion, portability, etc.)</li>
          <li><strong>Report any data breaches</strong> to relevant authorities within 72 hours</li>
        </ul>

        <h3>2.2 MusicDrop's Role</h3>
        <ul>
          <li>We act as a <strong>data processor</strong> when you collect fan information</li>
          <li>You remain the <strong>data controller</strong> responsible for GDPR compliance</li>
          <li>Ultimate responsibility for fan data compliance lies with you</li>
        </ul>

        <h2>3. Acceptable Use</h2>
        <h3>3.1 Prohibited Activities</h3>
        <ul>
          <li>Send unsolicited communications (violates GDPR, CAN-SPAM, etc.)</li>
          <li>Collect personal data without proper consent</li>
          <li>Violate any applicable privacy laws (GDPR, CCPA, etc.)</li>
          <li>Upload content without proper intellectual property rights</li>
        </ul>

        <h2>4. Contact Information</h2>
        <p><strong>General:</strong> legal@musicdrop.io<br>
        <strong>Data Protection:</strong> privacy@musicdrop.io</p>

        <p><em>These Terms incorporate GDPR, CCPA, and other applicable privacy law requirements.</em></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Same styling as Privacy Policy */
.legal-content {
  max-width: 800px;
  line-height: 1.7;
  color: var(--text-primary);
}

.legal-content h2 {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.legal-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.legal-content p {
  margin-bottom: 1rem;
}

.legal-content ul {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.legal-content li {
  margin-bottom: 0.5rem;
}

.legal-content strong {
  color: var(--text-primary);
  font-weight: 600;
}
</style>