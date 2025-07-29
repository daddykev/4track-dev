<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Navigation state
const activeSection = ref('introduction')
const activeTopic = ref(null)
const mobileMenuOpen = ref(false)

// Documentation structure
const docSections = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: 'book',
    topics: [
      { id: 'what-is-4track', title: 'What is 4track?' },
      { id: 'key-features', title: 'Key Features' },
      { id: 'getting-started', title: 'Getting Started' }
    ]
  },
  {
    id: 'for-fans',
    title: 'For Music Fans',
    icon: 'headphones',
    topics: [
      { id: 'discovering-music', title: 'Discovering Music' },
      { id: 'building-collection', title: 'Building Your Collection' },
      { id: 'supporting-artists', title: 'Supporting Artists Directly' }
    ]
  },
  {
    id: 'for-artists',
    title: 'For Artists',
    icon: 'microphone-alt',
    topics: [
      { id: 'becoming-artist', title: 'Becoming an Artist' },
      { id: 'artist-studio', title: 'Using Artist Studio' },
      { id: 'managing-medley', title: 'Managing Your Medley' },
      { id: 'uploading-tracks', title: 'Uploading Tracks' },
      { id: 'royalty-splits', title: 'Collaborator Royalty Splits' },
      { id: 'artist-photos', title: 'Photos & Branding' },
      { id: 'getting-paid', title: 'Getting Paid' }
    ]
  },
  {
    id: 'for-labels',
    title: 'For Labels & Managers',
    icon: 'users',
    topics: [
      { id: 'roster-management', title: 'Artist Roster Management' },
      { id: 'creating-artists', title: 'Creating Artist Profiles' },
      { id: 'hierarchical-access', title: 'Access Control' }
    ]
  },
  {
    id: 'features',
    title: 'Features',
    icon: 'star',
    topics: [
      { id: 'medley-player', title: 'The Medley Player' },
      { id: 'paypal-integration', title: 'PayPal Integration' },
      { id: 'photo-lab', title: 'Photo Lab' },
      { id: 'themes', title: 'Themes & Customization' },
      { id: 'privacy-first', title: 'Privacy-First Design' }
    ]
  },
  {
    id: 'technical',
    title: 'Technical',
    icon: 'code',
    topics: [
      { id: 'open-source', title: 'Open Source' },
      { id: 'self-hosting', title: 'Self-Hosting' },
      { id: 'api-reference', title: 'API Reference' },
      { id: 'security', title: 'Security & Privacy' }
    ]
  }
]

// Content for each topic
const docContent = {
  'what-is-4track': {
    title: 'What is 4track?',
    content: `
      <p>4track is an open-source music platform that enables independent artists to monetize their music directly with listeners through a customizable media player and direct PayPal integration.</p>
      
      <h3>Our Mission</h3>
      <p>We believe artists should receive 100% of their music revenue. 4track eliminates intermediaries, connecting artists directly with their fans through transparent, fair transactions.</p>
      
      <h3>Core Principles</h3>
      <ul>
        <li><strong>Artist-First:</strong> 100% of revenue goes directly to artists via PayPal</li>
        <li><strong>Open Source:</strong> Fully transparent, community-driven development</li>
        <li><strong>Privacy-First:</strong> No cookies, minimal data collection, GDPR/CCPA compliant</li>
        <li><strong>Free Forever:</strong> Core features always free for artists and listeners</li>
      </ul>
    `
  },
  'key-features': {
    title: 'Key Features',
    content: `
      <h3>For Artists</h3>
      <ul>
        <li>Create a professional artist profile with custom URL</li>
        <li>Upload up to 4 tracks in your medley</li>
        <li>Set prices from $0-10 per track</li>
        <li>Configure royalty splits for collaborators</li>
        <li>Upload photos and apply creative filters</li>
        <li>View real-time analytics</li>
        <li>Receive payments directly to PayPal</li>
      </ul>
      
      <h3>For Fans</h3>
      <ul>
        <li>Discover new music through the curated feed</li>
        <li>Build a personal music collection</li>
        <li>Support artists directly with purchases</li>
        <li>Download purchased tracks (if enabled by artist)</li>
        <li>Stream music with visualizations</li>
      </ul>
      
      <h3>For Labels & Managers</h3>
      <ul>
        <li>Manage multiple artist profiles from one account</li>
        <li>Hierarchical access control</li>
        <li>Centralized roster management</li>
        <li>Create and configure artist profiles</li>
      </ul>
    `
  },
  'getting-started': {
    title: 'Getting Started',
    content: `
      <h3>1. Create Your Account</h3>
      <p>Sign up for free at <a href="/signup">4track.io/signup</a> using your email or Google account. Email verification is required for artist features.</p>
      
      <h3>2. Choose Your Path</h3>
      <div class="path-cards">
        <div class="path-card">
          <h4>Music Fan</h4>
          <p>Start discovering music immediately. Browse the feed, save tracks to your collection, and support artists directly.</p>
        </div>
        <div class="path-card">
          <h4>Artist</h4>
          <p>Apply to become an artist through the platform. Once approved, create your profile and start uploading tracks.</p>
        </div>
        <div class="path-card">
          <h4>Label/Manager</h4>
          <p>Use an invite code to access roster management features. Create and manage multiple artist profiles.</p>
        </div>
      </div>
      
      <h3>3. Explore the Platform</h3>
      <ul>
        <li>Visit <a href="/discover">Discover</a> to find new music</li>
        <li>Check your <a href="/collection">Collection</a> for saved tracks</li>
        <li>Customize your experience in <a href="/profile">Profile</a></li>
      </ul>
    `
  },
  'discovering-music': {
    title: 'Discovering Music',
    content: `
      <h3>The Discover Feed</h3>
      <p>The Discover page features a dynamic feed of tracks and artists, organized in a 2:1 pattern (2 tracks for every artist profile).</p>
      
      <h3>Browsing Content</h3>
      <ul>
        <li><strong>Track Cards:</strong> Show artwork, title, artist, duration, and price</li>
        <li><strong>Artist Cards:</strong> Display profile image, name, genre, and track count</li>
        <li><strong>Infinite Scroll:</strong> New content loads automatically as you scroll</li>
      </ul>
      
      <h3>Playing Tracks</h3>
      <p>Click any track to open the feed player, which includes:</p>
      <ul>
        <li>Playback controls</li>
        <li>Queue management</li>
        <li>Track information</li>
        <li>Heart/save functionality</li>
      </ul>
    `
  },
  'building-collection': {
    title: 'Building Your Collection',
    content: `
      <h3>Saving Tracks</h3>
      <p>Click the heart icon on any track to save it to your collection. Saved tracks appear in your <a href="/collection">Music Collection</a>.</p>
      
      <h3>Collection Views</h3>
      <ul>
        <li><strong>All:</strong> Every track you've interacted with</li>
        <li><strong>Purchased:</strong> Tracks you own and can download</li>
        <li><strong>Saved:</strong> Hearted tracks for later purchase</li>
      </ul>
      
      <h3>Organization</h3>
      <p>Your collection is automatically organized by artist, making it easy to find tracks from your favorite creators.</p>
    `
  },
  'supporting-artists': {
    title: 'Supporting Artists Directly',
    content: `
      <h3>Direct Purchases</h3>
      <p>When you buy a track, 100% of your payment goes directly to the artist(s) via PayPal. No platform fees, no middlemen.</p>
      
      <h3>Purchase Process</h3>
      <ol>
        <li>Click the purchase button on any track</li>
        <li>You'll be redirected to PayPal checkout</li>
        <li>Complete payment with PayPal or credit card</li>
        <li>Return to 4track to download your track</li>
      </ol>
      
      <h3>Free Downloads</h3>
      <p>Some artists offer free downloads. These still go through the checkout process to track downloads and build your collection.</p>
      
      <h3>Stream-Only Tracks</h3>
      <p>Artists can choose to make tracks stream-only. These tracks can be purchased to support the artist but won't be downloadable.</p>
    `
  },
  'becoming-artist': {
    title: 'Becoming an Artist',
    content: `
      <h3>Artist Application Process</h3>
      <ol>
        <li>Verify your email address (required)</li>
        <li>Navigate to <a href="/artist/create">Create Artist Profile</a></li>
        <li>Submit your application with:
          <ul>
            <li>Artist name</li>
            <li>Genre</li>
            <li>Reason for joining</li>
            <li>Bio (optional)</li>
          </ul>
        </li>
        <li>Wait for admin approval</li>
        <li>Once approved, access your Artist Studio</li>
      </ol>
      
      <h3>Requirements</h3>
      <ul>
        <li>Verified email address</li>
        <li>Original music content</li>
        <li>PayPal account (for receiving payments)</li>
      </ul>
    `
  },
  'artist-studio': {
    title: 'Using Artist Studio',
    content: `
      <h3>Studio Overview</h3>
      <p>The Artist Studio is your command center for managing your presence on 4track. Access it at <code>/studio</code> after approval.</p>
      
      <h3>Key Sections</h3>
      
      <h4>1. Statistics Dashboard</h4>
      <ul>
        <li>Total plays</li>
        <li>Hearts received</li>
        <li>Downloads</li>
        <li>Revenue earned</li>
      </ul>
      
      <h4>2. Medley Management</h4>
      <ul>
        <li>4 track slots for your medley</li>
        <li>Drag-and-drop interface</li>
        <li>Edit track details anytime</li>
        <li>Delete and reorder tracks</li>
      </ul>
      
      <h4>3. Photo Gallery</h4>
      <ul>
        <li>Upload artist photos</li>
        <li>Set primary profile image</li>
        <li>Apply creative filters</li>
        <li>Circular crop editor for perfect framing</li>
      </ul>
      
      <h4>4. Public Link</h4>
      <p>Share your medley at: <code>4track.io/your-artist-name</code></p>
    `
  },
  'managing-medley': {
    title: 'Managing Your Medley',
    content: `
      <h3>What is a Medley?</h3>
      <p>Your medley is a curated collection of up to 4 tracks that represents your best work. Think of it as your musical business card.</p>
      
      <h3>Medley Settings</h3>
      <ul>
        <li><strong>Visibility Toggle:</strong> Make your medley public or hidden</li>
        <li><strong>Track Order:</strong> Arrange tracks in your preferred sequence</li>
        <li><strong>Individual Pricing:</strong> Set different prices per track</li>
      </ul>
      
      <h3>Best Practices</h3>
      <ul>
        <li>Lead with your strongest track</li>
        <li>Show variety in your 4 slots</li>
        <li>Update regularly to keep content fresh</li>
        <li>Use high-quality audio files</li>
      </ul>
    `
  },
  'uploading-tracks': {
    title: 'Uploading Tracks',
    content: `
      <h3>Audio Requirements</h3>
      <ul>
        <li><strong>Formats:</strong> MP3 or WAV</li>
        <li><strong>Size:</strong> Up to 200MB per file</li>
        <li><strong>Quality:</strong> We recommend 320kbps MP3 or lossless WAV</li>
      </ul>
      
      <h3>Track Information</h3>
      <ul>
        <li><strong>Title:</strong> Required, up to 100 characters</li>
        <li><strong>Description:</strong> Optional context for listeners</li>
        <li><strong>Price:</strong> $0-10 (increments of $0.50)</li>
        <li><strong>Download Option:</strong> Allow downloads or stream-only</li>
      </ul>
      
      <h3>Cover Art</h3>
      <ul>
        <li><strong>Formats:</strong> JPEG, PNG, or WebP</li>
        <li><strong>Size:</strong> Up to 20MB</li>
        <li><strong>Dimensions:</strong> Automatically cropped to 1000×1000px square</li>
        <li>Each track can have unique artwork</li>
      </ul>
      
      <h3>Upload Process</h3>
      <ol>
        <li>Click "Add Track" in an empty slot</li>
        <li>Fill in track details</li>
        <li>Add collaborators if needed</li>
        <li>Upload audio and artwork files</li>
        <li>Save to publish immediately</li>
      </ol>
    `
  },
  'royalty-splits': {
    title: 'Collaborator Royalty Splits',
    content: `
      <h3>How Royalty Splits Work</h3>
      <p>4track's revolutionary royalty split system ensures all collaborators get paid directly and simultaneously through PayPal's multi-party payments.</p>
      
      <h3>Adding Collaborators</h3>
      <ol>
        <li>When creating/editing a track, find the "Royalty Splits" section</li>
        <li>The primary artist is automatically added at 100%</li>
        <li>Click "Add Collaborator" for each additional person</li>
        <li>Enter their:
          <ul>
            <li>Display name</li>
            <li>PayPal email (required)</li>
            <li>Percentage share</li>
          </ul>
        </li>
        <li>Ensure total equals 100%</li>
      </ol>
      
      <h3>Split Calculator</h3>
      <p>Use the "Split Equally" button to automatically divide royalties evenly among all collaborators.</p>
      
      <h3>How Payments Work</h3>
      <ul>
        <li>When a fan purchases, PayPal splits the payment automatically</li>
        <li>Each collaborator receives their share directly to their PayPal</li>
        <li>No waiting, no manual distributions</li>
        <li>All transactions are recorded for transparency</li>
      </ul>
      
      <h3>Example</h3>
      <div class="example-box">
        <p>Track Price: $5.00</p>
        <p>Main Artist (50%): $2.50</p>
        <p>Producer (30%): $1.50</p>
        <p>Featured Artist (20%): $1.00</p>
        <p><em>All paid instantly to their respective PayPal accounts</em></p>
      </div>
    `
  },
  'artist-photos': {
    title: 'Photos & Branding',
    content: `
      <h3>Photo Management</h3>
      <p>Build your visual brand with high-quality photos in your Artist Studio.</p>
      
      <h3>Upload Specifications</h3>
      <ul>
        <li><strong>Formats:</strong> JPEG, PNG, WebP</li>
        <li><strong>Size:</strong> Up to 20MB per photo</li>
        <li><strong>Quantity:</strong> Unlimited photos</li>
        <li><strong>Processing:</strong> Automatic thumbnail generation</li>
      </ul>
      
      <h3>Primary Photo</h3>
      <p>Your primary photo appears on:</p>
      <ul>
        <li>Artist profile</li>
        <li>Discovery feed</li>
        <li>Medley page header</li>
      </ul>
      
      <h3>Circular Crop Editor</h3>
      <p>The primary photo uses a circular crop for consistent branding:</p>
      <ol>
        <li>Click "Set as Primary" on any photo</li>
        <li>Drag to position the circular frame</li>
        <li>Save to create a perfect profile image</li>
      </ol>
      
      <h3>Photo Lab</h3>
      <p>Apply creative filters to your photos:</p>
      <ul>
        <li>10 artistic filters available</li>
        <li>Real-time preview</li>
        <li>Non-destructive editing</li>
        <li>Save as new photos</li>
      </ul>
      
      <p>Available filters: Vintage, Ocean, Islands, Marine, Lagoon, Crimson, Fase, Pink Aura, Haze, Fire Opal</p>
    `
  },
  'getting-paid': {
    title: 'Getting Paid',
    content: `
      <h3>Payment Setup</h3>
      <ol>
        <li>Add your PayPal email in Artist Studio</li>
        <li>Verify it's correct (payments can't be redirected)</li>
        <li>That's it! You're ready to receive payments</li>
      </ol>
      
      <h3>How Payments Work</h3>
      <ul>
        <li><strong>Direct Transfer:</strong> Fans pay you directly via PayPal</li>
        <li><strong>Instant Access:</strong> Funds available immediately in your PayPal</li>
        <li><strong>No Platform Fees:</strong> 4track takes 0% commission</li>
        <li><strong>PayPal Fees:</strong> Standard PayPal transaction fees apply</li>
      </ul>
      
      <h3>Payment Records</h3>
      <p>All transactions are recorded in the platform for your reference:</p>
      <ul>
        <li>Buyer information</li>
        <li>Purchase date and amount</li>
        <li>Track details</li>
        <li>Collaborator splits (if applicable)</li>
      </ul>
      
      <h3>Tax Considerations</h3>
      <p>As an independent artist receiving direct payments:</p>
      <ul>
        <li>You're responsible for tracking income</li>
        <li>PayPal provides transaction history</li>
        <li>Consult a tax professional for guidance</li>
      </ul>
    `
  },
  'roster-management': {
    title: 'Artist Roster Management',
    content: `
      <h3>Who Can Access Roster?</h3>
      <ul>
        <li><strong>Admins:</strong> See and manage all artists</li>
        <li><strong>Labels:</strong> Manage their signed artists</li>
        <li><strong>Managers:</strong> Access assigned artists</li>
      </ul>
      
      <h3>Roster Features</h3>
      <ul>
        <li>Centralized view of all your artists</li>
        <li>Quick access to each artist's studio</li>
        <li>Visibility toggle for medleys</li>
        <li>PayPal email management</li>
        <li>Performance overview</li>
      </ul>
      
      <h3>Managing Artists</h3>
      <p>From the roster, you can:</p>
      <ul>
        <li>Create new artist profiles</li>
        <li>Configure payment information</li>
        <li>Access any artist's studio</li>
        <li>Toggle medley visibility</li>
        <li>View public artist pages</li>
      </ul>
    `
  },
  'creating-artists': {
    title: 'Creating Artist Profiles',
    content: `
      <h3>Quick Artist Creation</h3>
      <p>Labels and managers can create artist profiles instantly:</p>
      <ol>
        <li>Click "Add Artist" in the roster</li>
        <li>Enter artist name</li>
        <li>Optionally add Spotify URL for metadata import</li>
        <li>Create profile</li>
        <li>Navigate to their studio to complete setup</li>
      </ol>
      
      <h3>Spotify Integration</h3>
      <p>Import artist data from Spotify:</p>
      <ul>
        <li>Paste Spotify artist URL during creation</li>
        <li>Automatically extracts artist ID</li>
        <li>Helps with discovery and metadata</li>
      </ul>
      
      <h3>Profile Customization</h3>
      <p>After creation, in the artist's studio:</p>
      <ul>
        <li>Upload profile photos</li>
        <li>Add genre and bio</li>
        <li>Configure PayPal email</li>
        <li>Upload medley tracks</li>
      </ul>
    `
  },
  'hierarchical-access': {
    title: 'Access Control',
    content: `
      <h3>Permission Levels</h3>
      
      <h4>Admin Access</h4>
      <ul>
        <li>Full platform access</li>
        <li>All artist profiles</li>
        <li>User management</li>
        <li>Application review</li>
      </ul>
      
      <h4>Label Access</h4>
      <ul>
        <li>Create unlimited artists</li>
        <li>Manage roster artists</li>
        <li>View aggregated analytics</li>
        <li>Configure artist settings</li>
      </ul>
      
      <h4>Manager Access</h4>
      <ul>
        <li>Access assigned artists only</li>
        <li>Cannot create new artists</li>
        <li>Help with content management</li>
        <li>View artist analytics</li>
      </ul>
      
      <h3>Access Tracking</h3>
      <p>All access is logged with:</p>
      <ul>
        <li>Who granted access</li>
        <li>When it was granted</li>
        <li>Specific permissions</li>
        <li>Access history</li>
      </ul>
    `
  },
  'medley-player': {
    title: 'The Medley Player',
    content: `
      <h3>Player Features</h3>
      <ul>
        <li><strong>Visual Design:</strong> Cover art, track info, and controls</li>
        <li><strong>Audio Visualizations:</strong>
          <ul>
            <li>Real-time frequency analyzer</li>
            <li>Stereo VU meters</li>
            <li>Animated tape reels</li>
          </ul>
        </li>
        <li><strong>Playback Controls:</strong> Play/pause, previous/next, seek</li>
        <li><strong>Track Queue:</strong> Auto-advance through medley</li>
      </ul>
      
      <h3>Track Information</h3>
      <p>Each track displays:</p>
      <ul>
        <li>Title and artist</li>
        <li>Collaborators (if any)</li>
        <li>Duration</li>
        <li>Price or "Free"</li>
        <li>Download availability</li>
      </ul>
      
      <h3>Audio Quality</h3>
      <p>The player shows technical details:</p>
      <ul>
        <li>Audio format (MP3/WAV)</li>
        <li>Bit rate</li>
        <li>Sample rate</li>
        <li>Bit depth</li>
      </ul>
    `
  },
  'paypal-integration': {
    title: 'PayPal Integration',
    content: `
      <h3>Why PayPal?</h3>
      <ul>
        <li>Trusted by millions worldwide</li>
        <li>Direct artist payments (no middleman)</li>
        <li>Buyer protection included</li>
        <li>No platform commission</li>
      </ul>
      
      <h3>For Artists</h3>
      <ul>
        <li>Just add your PayPal email</li>
        <li>Receive payments instantly</li>
        <li>Support for business accounts</li>
        <li>Multi-currency support</li>
      </ul>
      
      <h3>For Fans</h3>
      <ul>
        <li>Pay with PayPal balance</li>
        <li>Use any credit/debit card</li>
        <li>Secure checkout process</li>
        <li>Purchase receipts via email</li>
      </ul>
      
      <h3>Multi-Party Payments</h3>
      <p>Our advanced integration splits payments automatically:</p>
      <ul>
        <li>Each collaborator paid simultaneously</li>
        <li>No manual distribution needed</li>
        <li>Transparent transaction records</li>
        <li>Handles partial payments gracefully</li>
      </ul>
    `
  },
  'photo-lab': {
    title: 'Photo Lab',
    content: `
      <h3>Creative Photo Editing</h3>
      <p>Transform your photos with professional filters powered by Pixels.js.</p>
      
      <h3>Available Filters</h3>
      <div class="filter-grid">
        <div class="filter-item">
          <strong>Vintage</strong>
          <p>Classic aged photo effect</p>
        </div>
        <div class="filter-item">
          <strong>Ocean</strong>
          <p>Cool blue tones</p>
        </div>
        <div class="filter-item">
          <strong>Islands</strong>
          <p>Tropical warmth</p>
        </div>
        <div class="filter-item">
          <strong>Marine</strong>
          <p>Deep sea vibes</p>
        </div>
        <div class="filter-item">
          <strong>Lagoon</strong>
          <p>Serene water tones</p>
        </div>
        <div class="filter-item">
          <strong>Crimson</strong>
          <p>Bold red emphasis</p>
        </div>
        <div class="filter-item">
          <strong>Fase</strong>
          <p>Dreamy soft focus</p>
        </div>
        <div class="filter-item">
          <strong>Pink Aura</strong>
          <p>Ethereal pink glow</p>
        </div>
        <div class="filter-item">
          <strong>Haze</strong>
          <p>Misty atmosphere</p>
        </div>
        <div class="filter-item">
          <strong>Fire Opal</strong>
          <p>Warm sunset tones</p>
        </div>
      </div>
      
      <h3>How to Use</h3>
      <ol>
        <li>Upload a photo to your gallery</li>
        <li>Click the magic wand icon</li>
        <li>Preview all filters</li>
        <li>Click to apply</li>
        <li>Save as a new photo</li>
      </ol>
    `
  },
  'themes': {
    title: 'Themes & Customization',
    content: `
      <h3>Available Themes</h3>
      <ul>
        <li><strong>Light Mode:</strong> Clean, bright interface ideal for daytime</li>
        <li><strong>Dark Mode:</strong> Easy on the eyes in low light</li>
        <li><strong>Auto Mode:</strong> Follows your system preferences</li>
      </ul>
      
      <h3>Changing Themes</h3>
      <ol>
        <li>Go to your <a href="/profile">Profile</a></li>
        <li>Find the "Appearance" section</li>
        <li>Click your preferred theme</li>
        <li>Changes apply instantly</li>
      </ol>
      
      <h3>Theme Features</h3>
      <ul>
        <li>No page reload required</li>
        <li>Preference saved to account</li>
        <li>Consistent across devices</li>
        <li>Medley player always uses optimal contrast</li>
      </ul>
    `
  },
  'privacy-first': {
    title: 'Privacy-First Design',
    content: `
      <h3>Our Privacy Commitment</h3>
      <ul>
        <li><strong>No Tracking Cookies:</strong> Zero third-party trackers</li>
        <li><strong>Minimal Data:</strong> We only collect what's necessary</li>
        <li><strong>GDPR/CCPA Compliant:</strong> Full regulatory compliance</li>
        <li><strong>User Control:</strong> Export or delete your data anytime</li>
      </ul>
      
      <h3>What We Collect</h3>
      <ul>
        <li>Email address (for account)</li>
        <li>Display name (optional)</li>
        <li>Music preferences (your collection)</li>
        <li>Transaction records (for artists)</li>
      </ul>
      
      <h3>What We Don't Collect</h3>
      <ul>
        <li>Browsing history</li>
        <li>Personal identifiers</li>
        <li>Location data</li>
        <li>Device fingerprints</li>
      </ul>
      
      <h3>Analytics</h3>
      <p>Our privacy-focused analytics:</p>
      <ul>
        <li>Session-based (not user-based)</li>
        <li>No persistent identifiers</li>
        <li>Geographic data aggregated by country</li>
        <li>Used only for platform improvement</li>
      </ul>
      
      <p>Read our full <a href="/privacy">Privacy Policy</a></p>
    `
  },
  'open-source': {
    title: 'Open Source',
    content: `
      <h3>Community-Driven Development</h3>
      <p>4track is proudly open source under the MIT License. Our code is transparent, auditable, and community-driven.</p>
      
      <h3>Technology Stack</h3>
      <ul>
        <li><strong>Frontend:</strong> Vue 3 with Composition API</li>
        <li><strong>Backend:</strong> Firebase (Auth, Firestore, Storage, Functions)</li>
        <li><strong>Payments:</strong> PayPal SDK</li>
        <li><strong>Build:</strong> Vite</li>
        <li><strong>Styling:</strong> Utility-first CSS architecture</li>
      </ul>
      
      <h3>Contributing</h3>
      <p>We welcome contributions! Visit our GitHub repository to:</p>
      <ul>
        <li>Report bugs</li>
        <li>Suggest features</li>
        <li>Submit pull requests</li>
        <li>Improve documentation</li>
      </ul>
      
      <h3>Roadmap</h3>
      <p>Upcoming features in development:</p>
      <ul>
        <li>Advanced analytics dashboard</li>
        <li>Email campaign tools</li>
        <li>Custom artist pages</li>
        <li>API for third-party integrations</li>
      </ul>
    `
  },
  'self-hosting': {
    title: 'Self-Hosting',
    content: `
      <h3>Why Self-Host?</h3>
      <ul>
        <li>Complete control over your platform</li>
        <li>Custom branding and domain</li>
        <li>Regional compliance requirements</li>
        <li>Build a local music community</li>
      </ul>
      
      <h3>Requirements</h3>
      <ul>
        <li>Firebase project (free tier available)</li>
        <li>PayPal business account</li>
        <li>Domain name (optional)</li>
        <li>Basic technical knowledge</li>
      </ul>
      
      <h3>Quick Start</h3>
      <pre><code>
# Clone the repository
git clone https://github.com/4track/4track-os.git

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase config

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
npm run deploy
      </code></pre>
      
      <h3>Configuration</h3>
      <p>Key configuration files:</p>
      <ul>
        <li><code>firebase.json</code> - Firebase services</li>
        <li><code>firestore.rules</code> - Security rules</li>
        <li><code>.env</code> - Environment variables</li>
      </ul>
    `
  },
  'api-reference': {
    title: 'API Reference',
    content: `
      <h3>Cloud Functions</h3>
      
      <h4>Payment Functions</h4>
      <ul>
        <li><code>createMedleyPayPalOrder</code> - Initiate PayPal checkout</li>
        <li><code>captureMedleyPayment</code> - Complete payment</li>
        <li><code>processMedleyFreeDownload</code> - Handle free downloads</li>
      </ul>
      
      <h4>Analytics Functions</h4>
      <ul>
        <li><code>collectAnalytics</code> - Privacy-focused event tracking</li>
        <li><code>getMedleyAnalytics</code> - Retrieve artist statistics</li>
      </ul>
      
      <h4>Collection Functions</h4>
      <ul>
        <li><code>addToCollection</code> - Save track to user collection</li>
        <li><code>removeFromCollection</code> - Remove from collection</li>
        <li><code>getUserCollection</code> - Retrieve user's tracks</li>
      </ul>
      
      <h3>Database Schema</h3>
      <p>Main collections:</p>
      <ul>
        <li><code>users</code> - User accounts and preferences</li>
        <li><code>artistProfiles</code> - Artist information</li>
        <li><code>medleyTracks</code> - Track metadata and audio</li>
        <li><code>userCollections</code> - Saved/purchased tracks</li>
        <li><code>medleyRoyalties</code> - Transaction records</li>
        <li><code>artistPhotos</code> - Photo gallery metadata</li>
      </ul>
      
      <h3>Storage Structure</h3>
      <pre><code>
/{userId}/
  /medley/{artistId}/
    /audio/{fileName}      # Track audio files
    /artwork/{fileName}    # Track artwork
  /artist-photos/{artistId}/
    /original_{fileName}   # Original photos
    /thumbnails/{fileName} # Generated thumbnails
      </code></pre>
    `
  },
  'security': {
    title: 'Security & Privacy',
    content: `
      <h3>Security Measures</h3>
      <ul>
        <li><strong>Authentication:</strong> Firebase Auth with email verification</li>
        <li><strong>Authorization:</strong> Role-based access control</li>
        <li><strong>Data Encryption:</strong> TLS in transit, encrypted at rest</li>
        <li><strong>Input Validation:</strong> Client and server-side validation</li>
      </ul>
      
      <h3>Firestore Security Rules</h3>
      <p>Our security rules ensure:</p>
      <ul>
        <li>Users can only modify their own data</li>
        <li>Artists control their own content</li>
        <li>Public data is read-only</li>
        <li>Admin operations are restricted</li>
      </ul>
      
      <h3>Payment Security</h3>
      <ul>
        <li>All payments processed by PayPal</li>
        <li>No payment data stored on 4track</li>
        <li>PCI compliance handled by PayPal</li>
        <li>Secure checkout redirects</li>
      </ul>
      
      <h3>Privacy Features</h3>
      <ul>
        <li>No tracking cookies</li>
        <li>Session-based analytics only</li>
        <li>Right to deletion (GDPR Article 17)</li>
        <li>Data portability (GDPR Article 20)</li>
      </ul>
      
      <h3>Reporting Security Issues</h3>
      <p>Found a security vulnerability? Please email security@4track.io with:</p>
      <ul>
        <li>Description of the issue</li>
        <li>Steps to reproduce</li>
        <li>Potential impact</li>
        <li>Your contact information</li>
      </ul>
    `
  }
}

// Search functionality
const searchQuery = ref('')
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  const results = []
  
  // Search through all content
  Object.entries(docContent).forEach(([id, topic]) => {
    const titleMatch = topic.title.toLowerCase().includes(query)
    const contentMatch = topic.content.toLowerCase().includes(query)
    
    if (titleMatch || contentMatch) {
      // Find the section this topic belongs to
      const section = docSections.find(s => 
        s.topics.some(t => t.id === id)
      )
      
      results.push({
        id,
        title: topic.title,
        section: section?.title || 'General',
        relevance: titleMatch ? 2 : 1
      })
    }
  })
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance)
})

// Navigation methods
const navigateToTopic = (sectionId, topicId) => {
  activeSection.value = sectionId
  activeTopic.value = topicId
  mobileMenuOpen.value = false
  
  // Update URL
  router.push({ 
    path: '/docs',
    query: { section: sectionId, topic: topicId }
  })
  
  // Scroll to top
  window.scrollTo(0, 0)
}

const navigateToSearchResult = (topicId) => {
  // Find which section contains this topic
  const section = docSections.find(s => 
    s.topics.some(t => t.id === topicId)
  )
  
  if (section) {
    navigateToTopic(section.id, topicId)
    searchQuery.value = ''
  }
}

// Get active content
const activeContent = computed(() => {
  if (!activeTopic.value) {
    // Show section overview
    const section = docSections.find(s => s.id === activeSection.value)
    return {
      title: section?.title || 'Documentation',
      content: `<p>Select a topic from the menu to get started.</p>`
    }
  }
  
  return docContent[activeTopic.value] || {
    title: 'Topic Not Found',
    content: '<p>This topic is not available yet.</p>'
  }
})

// Initialize from route
onMounted(() => {
  const { section, topic } = route.query
  if (section) {
    activeSection.value = section
    if (topic) {
      activeTopic.value = topic
    }
  } else {
    // Default to first topic
    activeSection.value = docSections[0].id
    activeTopic.value = docSections[0].topics[0].id
  }
})
</script>

<template>
  <div class="docs-page">
    <!-- Mobile Menu Toggle -->
    <button 
      @click="mobileMenuOpen = !mobileMenuOpen"
      class="mobile-menu-toggle"
    >
      <font-awesome-icon :icon="['fas', 'bars']" />
    </button>

    <!-- Sidebar Navigation -->
    <aside class="docs-sidebar" :class="{ 'mobile-open': mobileMenuOpen }">
      <div class="sidebar-header">
        <h2>Documentation</h2>
        <button 
          @click="mobileMenuOpen = false"
          class="mobile-close"
        >
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
      </div>

      <!-- Search -->
      <div class="search-box">
        <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search docs..."
          class="search-input"
        />
      </div>

      <!-- Search Results -->
      <div v-if="searchQuery && searchResults.length > 0" class="search-results">
        <div class="search-results-header">
          Search Results ({{ searchResults.length }})
        </div>
        <div
          v-for="result in searchResults"
          :key="result.id"
          @click="navigateToSearchResult(result.id)"
          class="search-result-item"
        >
          <div class="result-title">{{ result.title }}</div>
          <div class="result-section">{{ result.section }}</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav v-if="!searchQuery" class="docs-nav">
        <div
          v-for="section in docSections"
          :key="section.id"
          class="nav-section"
        >
          <div 
            class="nav-section-header"
            :class="{ 'active': activeSection === section.id }"
            @click="activeSection = section.id"
          >
            <font-awesome-icon :icon="['fas', section.icon]" />
            {{ section.title }}
          </div>
          
          <div 
            v-if="activeSection === section.id"
            class="nav-topics"
          >
            <div
              v-for="topic in section.topics"
              :key="topic.id"
              @click="navigateToTopic(section.id, topic.id)"
              class="nav-topic"
              :class="{ 'active': activeTopic === topic.id }"
            >
              {{ topic.title }}
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="docs-content">
      <article class="doc-article">
        <h1>{{ activeContent.title }}</h1>
        <div class="doc-body" v-html="activeContent.content"></div>
      </article>

      <!-- Footer Navigation -->
      <div class="doc-footer">
        <div class="footer-links">
          <router-link to="/" class="footer-link">
            <font-awesome-icon :icon="['fas', 'home']" />
            Back to 4track
          </router-link>
          <a 
            href="https://github.com/4track/4track-os" 
            target="_blank"
            class="footer-link"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.docs-page {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  z-index: 1001;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

/* Sidebar */
.docs-sidebar {
  width: 300px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-primary);
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.mobile-close {
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
}

/* Search */
.search-box {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
  position: relative;
}

.search-icon {
  position: absolute;
  left: calc(var(--spacing-lg) + var(--spacing-md));
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-xl) + var(--spacing-sm));
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Search Results */
.search-results {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.search-results-header {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.search-result-item {
  padding: var(--spacing-sm);
  margin: 0 calc(-1 * var(--spacing-sm));
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.search-result-item:hover {
  background: var(--bg-hover);
}

.result-title {
  color: var(--text-primary);
  font-weight: 500;
}

.result-section {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Navigation */
.docs-nav {
  padding: var(--spacing-lg);
}

.nav-section {
  margin-bottom: var(--spacing-lg);
}

.nav-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: 0 calc(-1 * var(--spacing-md));
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.nav-section-header:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-section-header.active {
  color: var(--color-primary);
}

.nav-topics {
  margin-top: var(--spacing-xs);
  margin-left: calc(var(--spacing-lg) + var(--spacing-xs));
}

.nav-topic {
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: var(--spacing-xs) 0;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.nav-topic:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-topic.active {
  background: var(--bg-hover);
  color: var(--color-primary);
  font-weight: 500;
}

/* Main Content */
.docs-content {
  flex: 1;
  padding: var(--spacing-2xl);
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.doc-article h1 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
  font-size: 2.5rem;
  line-height: 1.2;
}

/* Doc Body Styles */
.doc-body {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1.05rem;
}

.doc-body :deep(h3) {
  color: var(--text-primary);
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
  font-size: 1.5rem;
  font-weight: 600;
}

.doc-body :deep(h4) {
  color: var(--text-primary);
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
  font-size: 1.2rem;
  font-weight: 600;
}

.doc-body :deep(p) {
  margin-bottom: var(--spacing-md);
}

.doc-body :deep(ul),
.doc-body :deep(ol) {
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-xl);
}

.doc-body :deep(li) {
  margin-bottom: var(--spacing-xs);
}

.doc-body :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.doc-body :deep(code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  color: var(--color-primary);
}

.doc-body :deep(pre) {
  background: var(--bg-tertiary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--border-primary);
}

.doc-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--text-primary);
}

.doc-body :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.doc-body :deep(a:hover) {
  text-decoration: underline;
}

/* Custom Elements */
.doc-body :deep(.path-cards) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin: var(--spacing-lg) 0;
}

.doc-body :deep(.path-card) {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.doc-body :deep(.path-card h4) {
  color: var(--color-primary);
  margin-top: 0;
}

.doc-body :deep(.example-box) {
  background: var(--bg-tertiary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin: var(--spacing-md) 0;
  border-left: 4px solid var(--color-primary);
}

.doc-body :deep(.filter-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin: var(--spacing-lg) 0;
}

.doc-body :deep(.filter-item) {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

/* Footer */
.doc-footer {
  margin-top: var(--spacing-3xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-primary);
}

.footer-links {
  display: flex;
  gap: var(--spacing-xl);
  justify-content: center;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--color-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .docs-sidebar {
    position: fixed;
    left: -300px;
    z-index: 1000;
    transition: left var(--transition-normal);
    box-shadow: var(--shadow-lg);
  }

  .docs-sidebar.mobile-open {
    left: 0;
  }

  .mobile-close {
    display: block;
  }

  .docs-content {
    padding: var(--spacing-lg);
    padding-top: calc(60px + var(--spacing-lg));
  }
}

@media (max-width: 768px) {
  .docs-content {
    padding: var(--spacing-md);
    padding-top: calc(60px + var(--spacing-md));
  }

  .doc-article h1 {
    font-size: 2rem;
  }

  .doc-body {
    font-size: 1rem;
  }

  .doc-body :deep(h3) {
    font-size: 1.3rem;
  }

  .doc-body :deep(h4) {
    font-size: 1.1rem;
  }
}
</style>