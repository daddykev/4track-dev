# 4track - Open Source Music Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-FFA000.svg)](https://firebase.google.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integration-00457C.svg)](https://developer.paypal.com/)

> A free, open source music platform that enables independent artists to monetize their music directly with listeners through customizable audio players and direct PayPal integration.

## ✨ Features

### 🎤 For Artists
- **Direct Monetization** - 100% of revenue goes directly to your PayPal
- **Medley Player** - Upload up to 4 tracks with custom artwork
- **Flexible Pricing** - Set prices from $0-10 per track or offer free downloads
- **Public Sharing** - Get your own shareable link at `4track.io/yourname`
- **Photo Gallery** - Upload high-resolution photos with artistic filters
- **Real-time Analytics** - Track plays, hearts, downloads, and revenue
- **Email Verification** - Secure artist onboarding with approval workflow
- **Collaborator Royalty Splits** - Automatically split royalty payments between collaborators

### 🎧 For Listeners
- **Music Discovery** - Browse artists by genre and style
- **Direct Support** - Pay artists directly with no platform fees
- **Music Collection** - Save favorites and build your library
- **Instant Downloads** - Access purchased tracks immediately
- **Heart System** - Save tracks for later purchase

### 🤝 For Collaborators
- **Automatic Payment Splitting** - Define percentage splits for each track
- **Direct PayPal Payouts** - Each collaborator receives their share directly
- **Flexible Configurations** - Different splits per track
- **Primary Artist Protection** - Ensure main artist is always included
- **Equal Split Calculator** - One-click to divide royalties equally

### 📊 For Labels & Managers
- **Artist Roster** - Manage multiple artists from one dashboard
- **Hierarchical Access** - Role-based permissions system
- **Bulk Operations** - Streamlined catalog management
- **Aggregated Analytics** - Revenue and engagement across all artists

## 🛠 Tech Stack

**Frontend**
- Vue 3 (Composition API) + Vite
- CSS utility-first architecture
- FontAwesome 7 icons
- Pixels.js for photo editing

**Backend**
- Firebase (Firestore, Auth, Functions, Storage)
- PayPal SDK for direct payments with multi-party support
- Privacy-first analytics

**Key Features**
- Zero tracking cookies
- GDPR/CCPA compliant
- Email verification required
- Direct artist payouts with automatic splits
- Self-hostable

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project
- PayPal Developer account (Business account required for split payments)

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

5. **Start development server**
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
└── docs/               # Documentation
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

Looking at the collaborator split royalty management feature that was added, I'll update the README.md to include these important details:

```markdown
# 4track - Open Source Music Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-FFA000.svg)](https://firebase.google.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integration-00457C.svg)](https://developer.paypal.com/)

> A free, open source music platform that enables independent artists to monetize their music directly with listeners through customizable audio players and direct PayPal integration.

## ✨ Features

### 🎤 For Artists
- **Direct Monetization** - 100% of revenue goes directly to your PayPal
- **Medley Player** - Upload up to 4 tracks with custom artwork
- **Flexible Pricing** - Set prices from $0-10 per track or offer free downloads
- **Public Sharing** - Get your own shareable link at `4track.io/yourname`
- **Photo Gallery** - Upload high-resolution photos with artistic filters
- **Real-time Analytics** - Track plays, hearts, downloads, and revenue
- **Email Verification** - Secure artist onboarding with approval workflow
- **Collaborator Royalty Splits** - Automatically split payments between multiple artists

### 🎧 For Listeners
- **Music Discovery** - Browse artists by genre and style
- **Direct Support** - Pay artists directly with no platform fees
- **Music Collection** - Save favorites and build your library
- **Instant Downloads** - Access purchased tracks immediately
- **Heart System** - Save tracks for later purchase

### 👥 New: Collaborator Royalty Management
- **Automatic Payment Splitting** - Define percentage splits for each track
- **Direct PayPal Payouts** - Each collaborator receives their share directly
- **Flexible Configurations** - Different splits per track
- **Primary Artist Protection** - Ensure main artist is always included
- **Equal Split Calculator** - One-click to divide royalties equally

### 📊 For Labels & Managers
- **Artist Roster** - Manage multiple artists from one dashboard
- **Hierarchical Access** - Role-based permissions system
- **Bulk Operations** - Streamlined catalog management
- **Aggregated Analytics** - Revenue and engagement across all artists

## 🛠 Tech Stack

**Frontend**
- Vue 3 (Composition API) + Vite
- CSS utility-first architecture
- FontAwesome 7 icons
- Pixels.js for photo editing

**Backend**
- Firebase (Firestore, Auth, Functions, Storage)
- PayPal SDK for direct payments with multi-party support
- Privacy-first analytics

**Key Features**
- Zero tracking cookies
- GDPR/CCPA compliant
- Email verification required
- Direct artist payouts with automatic splits
- Self-hostable

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project
- PayPal Developer account (Business account required for split payments)

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

5. **Start development server**
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
└── docs/               # Documentation
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
5. **Upload Medley** - Add up to 4 tracks with artwork
6. **Configure Collaborators** - Set up royalty splits for featured artists
7. **Share & Earn** - Share your link and get paid directly

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

### Version 0.5 (Current)
- ✅ Artist audio players
- ✅ Direct PayPal integration
- ✅ Photo gallery with filters
- ✅ Basic analytics
- ✅ Email verification
- ✅ Collaborator royalty splits

### Version 1.0 (Public Launch)
- 🔄 iOS app (SwiftUI)
- 🔄 API for third-party integrations

### Version 2.0 (Future)
- 🔮 Advanced analytics dashboard
- 🔮 Multi-language support
- 🔮 Live streaming capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vue.js](https://vuejs.org/) and [Firebase](https://firebase.google.com/)
- Photo filters powered by [Pixels.js](https://github.com/silvia-odwyer/pixels.js)
- Icons by [FontAwesome](https://fontawesome.com/)
- Inspired by the independent music community

## 📞 Support

- 📧 **Email**: support@4track.io
- 💬 **Discord**: [Join our community](https://discord.gg/4track)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/fourtrack-os/issues)
- 📖 **Documentation**: [docs.4track.io](https://docs.4track.io)