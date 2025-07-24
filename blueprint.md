# 4track - Open Source Music Platform Blueprint

## Overview

4track is an open source music platform that enables independent artists to share their music directly with fans through customizable medley players and direct PayPal payments. It's the free tier component of the larger MusicDrop ecosystem, designed to be self-hostable and community-driven.

## Platform Philosophy

- **Artist-First**: 100% of payments go directly to artists via PayPal
- **Open Source**: Fully transparent, community-driven development
- **Privacy-Focused**: No cookies, minimal data collection, GDPR compliant
- **Free Forever**: Core features always free for artists and fans
- **Direct Support**: Fans support artists directly without intermediaries

## Technical Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Routing**: Vue Router
- **Styling**: CSS with utility-first architecture
- **Icons**: FontAwesome (free tier icons only)
- **Audio**: HTML5 Audio for playback, Web Audio API for visualizations

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password with verification, Google)
- **Storage**: Firebase Cloud Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Firebase Hosting
- **Payments**: PayPal SDK (direct integration)

### Infrastructure
- **Project ID**: fourtrack-os
- **Region**: us-central1 (configurable)
- **Domain**: 4track.io (community instances can use custom domains)

## Project Structure

```
fourtrack-os/
├── src/
│   ├── assets/                 # CSS and static assets
│   │   ├── base.css            # Base resets and typography
│   │   ├── main.css            # Global styles
│   │   ├── themes.css          # CSS custom properties
│   │   └── components.css      # Reusable utility classes
│   │
│   ├── components/             # Reusable Vue components
│   │   ├── FourTrackNav.vue    # Main navigation
│   │   ├── SessionMeters.vue   # Audio level meters
│   │   ├── SessionSpectroscope.vue # Frequency analyzer
│   │   └── EmailVerificationBanner.vue # Email verification reminder
│   │
│   ├── composables/            # Vue composables
│   │   └── useTheme.js         # Theme management
│   │
│   ├── router/                 # Routing configuration
│   │   └── index.js            # Route definitions
│   │
│   ├── services/               # API and business logic
│   │   ├── auth.js             # Authentication service with email verification
│   │   └── api.js              # API service wrapper
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatters.js       # Data formatting utilities
│   │   └── validators.js       # Input validation utilities
│   │
│   ├── views/                  # Page components
│   │   ├── HomePage.vue        # Landing page
│   │   ├── LoginPage.vue       # User login
│   │   ├── SignupPage.vue      # User registration with email verification
│   │   ├── DiscoverPage.vue    # Music discovery
│   │   ├── CreateArtist.vue    # Artist onboarding (requires verified email)
│   │   ├── ArtistMedley.vue    # Medley management
│   │   ├── UserProfile.vue     # User settings
│   │   ├── MusicCollection.vue # User's music library
│   │   ├── MedleyPage.vue      # Public medley player
│   │   └── MedleySuccess.vue   # PayPal success callback
│   │
│   ├── App.vue                 # Root component
│   ├── main.js                 # Application entry
│   └── firebase.js             # Firebase configuration
│
├── functions/                  # Cloud Functions
│   ├── index.js                # Function exports
│   ├── authFunctions.js        # User authentication
│   ├── medleyFunctions.js      # PayPal & medley logic
│   └── analyticsFunctions.js   # Privacy-focused analytics
│
├── public/                     # Static assets
│   ├── favicon.ico
│   └── index.html
│
├── .env.example                # Environment template
├── .gitignore
├── firebase.json               # Firebase configuration
├── firestore.rules             # Security rules
├── storage.rules               # Storage rules
├── package.json
├── README.md                   # Project documentation
├── LICENSE                     # MIT License
└── vite.config.js
```

## Core Features

### For Artists
1. **Artist Profile** - Basic profile with name, genre, bio, PayPal email (requires verified email)
2. **Medley Manager** - Upload up to 4 tracks with custom artwork
3. **Direct Payments** - 100% of sales go directly to artist's PayPal
4. **Flexible Pricing** - Set prices from $0-10 per track
5. **Download Control** - Choose stream-only or allow downloads
6. **Public Link** - Share medley at `4track.io/artistname`
7. **Basic Analytics** - Track plays, hearts, and revenue

### For Fans
1. **Discover Music** - Browse artists by genre
2. **Music Collection** - Save and purchase tracks
3. **Direct Support** - Pay artists directly via PayPal
4. **Download Library** - Access purchased tracks anytime
5. **Heart Tracks** - Save favorites for later purchase

### Authentication & Security
1. **Email Verification** - Required for all email/password signups
2. **Google Sign-In** - Pre-verified authentication option
3. **Invite Codes** - Special access for early artists (FIRSTWAVE)
4. **Secure Sessions** - JWT-based authentication
5. **Privacy First** - Minimal data collection

### Privacy & Security
1. **No Cookies** - Zero tracking cookies
2. **Session-Based** - Analytics use temporary session IDs
3. **GDPR Compliant** - Minimal data collection
4. **Secure Payments** - PayPal handles all payment data
5. **User Control** - Full data export and deletion

## Database Schema

### Collections

#### users
```
{
  uid: string,
  email: string,
  displayName: string,
  userType: 'consumer' | 'artist',
  platform: '4track',
  subscription: {
    tier: 'free',
    status: 'active'
  },
  features: {
    maxArtistProfiles: 1,
    maxMedleyTracks: 4,
    customPages: false,
    emailCampaigns: false,
    advancedAnalytics: false,
    teamCollaboration: false
  },
  emailVerified: boolean,
  inviteCode: string | null,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### artistProfiles
```
{
  name: string,
  customSlug: string,
  genre: string,
  bio: string,
  paypalEmail: string,
  profileImageUrl: string,
  hasPublicMedley: boolean,
  createdBy: string (userId),
  createdAt: timestamp,
  platform: '4track'
}
```

#### medleyTracks
```
{
  title: string,
  description: string,
  artistId: string,
  artistName: string,
  price: number (0-10),
  allowDownload: boolean,
  audioUrl: string,
  audioPath: string,
  audioFilename: string,
  audioSize: number,
  artworkUrl: string,
  artworkPath: string,
  order: number,
  duration: number,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### userCollections
```
{
  userId: string,
  userEmail: string,
  trackId: string,
  artistId: string,
  type: 'hearted' | 'purchased',
  isPurchased: boolean,
  timestamp: timestamp
}
```

#### medleyRoyalties (PayPal transactions)

```
{
  trackId: string,
  artistId: string,
  payerId: string,
  payerEmail: string,
  artistPayPalEmail: string,
  amount: number,
  currency: string,
  paypalOrderId: string,
  paypalCaptureId: string,
  type: 'purchase' | 'free_download',
  downloadUrl: string,
  downloadExpiry: timestamp,
  timestamp: timestamp
}
```

## Authentication Flow

### Email/Password Signup
1. User enters display name, email, and password
2. Optional: Enter invite code (FIRSTWAVE for artist access)
3. Account created with `emailVerified: false`
4. Verification email sent automatically
5. User sees confirmation page with resend option
6. User clicks verification link in email
7. Email verified status updated in Firebase Auth and Firestore
8. Full access granted to platform features

### Google Sign-In
1. User clicks "Continue with Google"
2. Google OAuth popup appears
3. Account created/signed in with `emailVerified: true`
4. Immediate access to all features

### Email Verification Requirements
- **Creating Artist Profile**: Requires verified email
- **Uploading Tracks**: Requires verified email
- **Purchasing Tracks**: No verification required
- **Saving Tracks**: No verification required

## Components

### EmailVerificationBanner
Reusable component that displays when user's email is not verified:
- Shows warning message with icon
- Resend verification email button
- 60-second cooldown between resends
- Auto-hides when email is verified
- Responsive design for mobile

## Security Rules

### Firestore Rules
- Public read access for artist profiles and medley tracks
- Authenticated write access for own content only
- Transaction records are write-only from backend

### Storage Rules
- Public read for medley audio and artwork
- Authenticated upload with file size limits
- Path-based access control

## Cloud Functions

### Core Functions

#### createMedleyPayPalOrder
- Creates PayPal checkout for track purchase
- Validates pricing and availability
- Returns checkout URL for redirect

#### captureMedleyPayment
- Captures PayPal payment after approval
- Records transaction in medleyRoyalties
- Generates time-limited download URL
- Handles free downloads

#### collectAnalytics
- Privacy-focused event tracking
- No personal data storage
- Geographic aggregation only