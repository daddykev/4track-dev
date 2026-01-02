# 4track - Open Source Music Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-FFA000.svg)](https://firebase.google.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integration-00457C.svg)](https://developer.paypal.com/)

> A free, open source music platform with a chronological feed where artists keep 100% of revenue and fans always see what they follow. No algorithms. No throttling. No pay-to-play.

## ✨ Features

### 🎤 For Artists
- **Artist Studio** - Combined dashboard for uploads, page settings, and royalties
- **Audio Player** - Upload up to 4 tracks with custom artwork
- **Studio Quality Audio** - Supports up to 32-bit, 192 kHz WAV with no transcoding
- **Direct Payments** - Revenue goes directly to your PayPal
- **Collaborator Royalty Splits** - Automatically split payments between multiple parties
- **Flexible Pricing** - Set prices from $1-10 per track
- **Download Control** - Choose stream-only or allow downloads
- **Public Link** - Share your page at `4track.io/yourname`
- **Audio Player Visibility** - Toggle public/hidden status
- **Basic Analytics** - Track plays, hearts, downloads, and revenue
- **Live Shows** - Promote upcoming performances with flyer artwork and ticket links
- **Post Once** - No algorithm to game; your followers see your content automatically
- **Photo Gallery** - Upload high-resolution photos with automatic thumbnails
- **Custom Color Themes** - Extract color palettes from photos/artwork

### 📻 The Chronological Feed

It's 2026, and a music-oriented chronological feed is somehow a novel idea.

Artists know the algorithmic pain intimately: you can have thousands of followers and still reach only a tiny fraction of them because opaque algorithms decided you're no longer "interesting" this week, or you're not paying for "boosts." On 4track, the feed is agnostic.

**How it works:**
- **Always Chronological** - Content appears in the order it was posted
- **No Shadow Throttling** - Every post reaches every follower
- **No Engagement Roulette** - Your reach isn't tied to likes or comments
- **No Artificial Scarcity** - Attention isn't rationed by an algorithm
- **Looping Feed** - Once you've scrolled through everything, it cycles back

**For Artists:**
- Add a live show date and the feed automatically displays it until the day of the event
- Release a track and everyone who follows you sees it
- Post once and get back to making music

The feed mixes tracks, artists, and upcoming shows in a 3:1:1 pattern, giving equal visibility to new releases and live performances while keeping the experience fresh and varied.

### 🎧 For Listeners
- **Chronological Feed** - See everything you follow, in order, every time
- **No Algorithm** - Content appears based on when it was posted, not engagement metrics
- **Mixed Content** - Tracks, artists, and live shows in a natural 3:1:1 pattern
- **Infinite Loop** - Feed cycles back to the beginning once you've seen everything
- **In-Feed Player** - Play tracks without leaving the feed
- **Track Queue** - Continuous playback through the feed
- **Music Collection** - Save and purchase tracks
- **Direct Support** - Pay artists directly via PayPal
- **Download Library** - Access purchased tracks anytime
- **Heart Tracks** - Save favorites for later purchase
- **See Collaborators** - View all artists featured on a track
- **Audio Quality Display** - See format details (bit depth, sample rate, etc.)
- **Discover Live Shows** - Find upcoming performances with date, venue, and ticket info
- **No Account Required** - Stream music without signing up

### 🏢 For Labels & Managers  
- **Artist Roster** - Centralized multi-artist management
- **Create Artist Pages** - Add new artist profiles
- **Hierarchical Access** - Manage multiple artists from one account
- **Role-Based Permissions** - Admin sees all, others see their artists
- **Quick Actions** - Navigate to artist studios or public pages
- **Aggregated Analytics** - View performance across all artists

### 👨‍💼 For Admins
- **User Management** - View all platform users and their roles
- **Application Review** - Approve/deny artist applications
- **Platform Stats** - Monitor user growth and activity
- **Access Control** - Admin-only routes and features
- **Invite Code Management** - Control platform access

### 📷 Photo Features
- **High-Resolution Upload** - Support for images up to 20MB
- **Automatic Thumbnails** - WebP format, 1000px, 85% quality
- **Primary Photo Selection** - Set main profile image
- **Circular Crop Editor** - Perfect framing for profile photos
- **Photo Lab Filters** - 10 artistic filters including Vintage, Ocean, Pink Aura
- **Original Preservation** - Keep originals for re-editing

### 🎨 Color Customization Features
- **Intelligent Color Extraction** - Extract dominant colors from photos or artwork using ColorThief
- **Smart Gradient Selection** - Automatically selects optimal gradient colors based on contrast and hue
- **Manual Override Controls** - Fine-tune gradient colors and text color (light/dark)
- **Live Preview** - See color changes in real-time before saving
- **Multiple Image Sources** - Extract colors from artist photos or track artwork
- **Persistent Theming** - Custom colors applied across the artist's public page

### 🤝 Collaborator Features
- **Flexible Splits** - Define exact percentage for each collaborator
- **Automatic Distribution** - PayPal sends payments directly to each person
- **Equal Split Calculator** - One-click to divide royalties equally
- **Primary Artist Protection** - Main artist cannot be removed
- **Real-time Validation** - Ensures splits always total 100%
- **Multi-Party Payments** - Uses PayPal's purchase units for simultaneous payouts
- **Partial Payment Handling** - System continues if some payments fail
- **Transaction Transparency** - All splits recorded in royalty records

### 🎫 Live Show Features
- **Show Management** - Add, edit, and delete upcoming performances from Artist Studio
- **Flyer Upload** - Upload event posters up to 10MB
- **Venue Details** - Include venue name and location (city, state)
- **Ticket Links** - Link to external ticketing platforms (Eventbrite, etc.)
- **Feed Integration** - Shows appear in Discover feed alongside tracks and artists
- **Artist Page Display** - Upcoming shows prominently displayed on public medley pages
- **Automatic Filtering** - Past shows automatically hidden from public view
- **Date Badges** - Clear visual date display with month and day

### 🔐 Authentication & Security
- **Email Verification** - Required for artist features
- **Google Sign-In** - Pre-verified authentication option
- **Invite Codes** - Control platform access during beta
- **Secure Sessions** - JWT-based authentication
- **Role-Based Access** - Consumer, Artist, Label, Manager, Admin roles
- **No Tracking Cookies** - Zero persistent tracking
- **Session-Based Analytics** - Privacy-first approach
- **GDPR/CCPA Compliant** - Minimal data collection
- **User Control** - Full data export and deletion rights

## 🛠 Tech Stack

**Frontend**
- Vue 3 (Composition API) + Vite
- CSS utility-first architecture

**Backend**
- Firebase (Firestore, Auth, Functions, Storage)
- PayPal SDK for direct payments with multi-party support
- Privacy-first analytics

**Key Features**
- Direct artist payouts with automatic splits
- Self-hostable
- Zero tracking cookies
- GDPR/CCPA compliant

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project
- PayPal account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fourtrack-os.git
cd fourtrack-os
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
```bash
# Copy environment template
cp .env.example .env

# Add your Firebase config to .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

4. **Set up Firebase services**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use your_project_id

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Deploy functions
cd functions && npm install && cd ..
firebase deploy --only functions
```

5. **Configure PayPal**
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see your instance running!

## 📁 Project Structure

```
fourtrack-os/
├── src/
│   ├── assets/          # CSS utilities and themes
│   ├── components/      # Reusable Vue components
│   ├── services/        # API and authentication
│   ├── utils/           # Validators and helpers
│   ├── views/           # Page components
│   └── router/          # Route configuration
├── functions/           # Firebase Cloud Functions
├── public/              # Static assets
└── docs/                # Documentation
```

## 🎨 CSS Architecture

4track uses a utility-first CSS architecture:

- **themes.css** - CSS custom properties for colors, spacing, transitions
- **components.css** - Reusable component classes (`.btn`, `.card`, `.section`)
- **Semantic utilities** - Layout (`.flex`, `.grid`), spacing (`.mb-md`), typography (`.text-primary`)

Example usage:
```vue
<div class="card p-lg mb-xl">
  <h2 class="section-title text-primary mb-md">Artist Studio</h2>
  <button class="btn btn-primary">Upload Track</button>
</div>
```

## 🔐 Security & Privacy

### Privacy-First Design
- **No tracking cookies** - Zero persistent tracking
- **Session-based analytics** - No personal identifiers stored
- **GDPR/CCPA compliant** - Minimal data collection
- **User control** - Full data export and deletion

### Authentication
- Email verification required for artists
- Google Sign-In with pre-verification
- Role-based access control (Consumer, Artist, Admin)
- Secure session management

### Payment Security
- PayPal handles all payment processing
- No credit card data stored
- Direct artist-to-fan transactions
- Transaction audit trail with split details

## 🎵 Artist Workflow

1. **Sign Up** - Create account with email verification
2. **Apply to Become Artist** - Submit application with artist details
3. **Get Approved** - Admin reviews and approves application
4. **Set Up Profile** - Add bio, photos, and PayPal email
5. **Upload Audio and Artwork** - Add up to 4 tracks with artwork
6. **Configure Collaborators** - Set up royalty splits for featured artists
7. **Share & Earn** - Share your link and get paid directly
8. **Add Live Shows** - Promote upcoming performances with dates, venues, and ticket links

## 💰 Revenue Model

4track is **free forever** with no platform fees:

- Artists keep 100% of sales revenue
- PayPal processing fees apply (standard PayPal rates)
- No subscription fees or hidden costs
- Open source = community owned

### 👥 Collaborator Royalty Splits

The platform supports automatic royalty splitting for tracks with multiple collaborators:

#### How It Works
1. **Add Collaborators** - When uploading a track, add collaborator names and PayPal emails
2. **Set Percentages** - Define what percentage each artist receives (must total 100%)
3. **Automatic Payments** - PayPal automatically sends each collaborator their share
4. **Track Transparency** - All splits are recorded and visible in analytics

#### Example Split
For a $5 track with 3 collaborators:
- Primary Artist: 50% = $2.50
- Producer: 30% = $1.50
- Featured Artist: 20% = $1.00

Each collaborator receives their payment directly to their PayPal account instantly.

#### Requirements
- All collaborators must have verified PayPal accounts
- Business PayPal account recommended for primary artist
- Splits must total exactly 100%
- Minimum split is 1%

### 🎨 Color Customization

The platform uses **ColorThief** to provide intelligent color theming:

#### How It Works
1. **Upload Images** - Add artist photos or track artwork
2. **Extract Colors** - ColorThief analyzes images to extract dominant colors
3. **Smart Selection** - Algorithm selects optimal gradient based on contrast and hue
4. **Live Preview** - See your medley page with custom colors before saving
5. **Manual Control** - Override automatic selections if desired

#### Color Algorithm
- Extracts 8 dominant colors from any image
- Calculates contrast scores between color pairs
- Considers hue distance for visual appeal
- Automatically selects readable text colors
- Falls back to generated colors if extraction fails

#### Implementation
Colors are applied as CSS custom properties on the medley page, ensuring fast performance and smooth transitions without JavaScript overhead.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Areas for Contribution

- 🎨 UI/UX improvements
- 🔊 Audio processing features
- 📱 Mobile app development
- 🌍 Internationalization
- 📊 Analytics enhancements
- 🧪 Testing infrastructure

## 📚 Documentation

- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Rules](docs/security.md)
- [Database Schema](docs/schema.md)
- [Development Guide](docs/development.md)

## 🎯 Roadmap

### Version 0.1 (Current)
- ✅ Artist audio players
- ✅ Direct PayPal integration
- ✅ Chronological discovery feed
- ✅ Photo gallery with filters
- ✅ Basic analytics
- ✅ Email verification
- ✅ Collaborator royalty splits
- ✅ Live show integration

### Version 0.2 (Public Launch - January 2026)
- 🔄 API for third-party integrations

### Version 0.3 (Future - June 2026/beyond)
- 🔮 iOS app (SwiftUI)
- 🔮 Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vue.js](https://vuejs.org/) and [Firebase](https://firebase.google.com/)
- Photo filters powered by [Pixels.js](https://github.com/silvia-odwyer/pixels.js)
- Color extraction powered by [ColorThief](https://github.com/lokesh/color-thief)
- Icons by [FontAwesome](https://fontawesome.com/)
- Inspired by the independent music community

## 📞 Support

- 📧 **Email**: support@4track.io
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/fourtrack-os/issues)
- 📖 **Documentation**: [docs.4track.io](https://4track.io/docs)