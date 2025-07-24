# 4track - Open Source Music Platform - Dev Blueprint

## Overview

4track is an open source music platform that enables independent artists to monetize their music directly with listeners through a customizable media player and direct PayPal gateway. It's the free tier component of the larger MusicDrop ecosystem, designed to be self-hostable and community-driven.

## Platform Philosophy

- **Artist-First**: 100% of revenue directly to artists via PayPal
- **Open Source**: Fully transparent, community-driven development
- **Privacy-First Design**: No cookies, minimal data collection, GDPR/CCPA compliant
- **Free Forever**: Core features always free for artists and listeners
- **Direct Support**: Listeners support artists directly without intermediaries

## Technical Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Routing**: Vue Router
- **Styling**: CSS with utility-first architecture
- **Icons**: FontAwesome 7
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
│   │   ├── components.css      # Reusable utility classes
│   │   ├── main.css            # Global styles
│   │   └── themes.css          # CSS custom properties
│   │
│   ├── components/             # Reusable Vue components
│   │   ├── CustomIcon.vue      # Reusable component for rendering SVG icons
│   │   ├── NavBar.vue          # Main navigation
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
│   │   ├── api.js              # API service wrapper
│   │   └── auth.js             # Authentication service with email verification
│   │
│   ├── utils/                  # Utility functions
│   │   ├── customIcons.js      # Custom SVG icon definitions
│   │   ├── fontawesome.js      # FontAwesome configuration
│   │   ├── formatters.js       # Data formatting utilities
│   │   └── validators.js       # Input validation utilities
│   │
│   ├── views/                  # Page components
│   │   ├── AdminArtists.vue    # Admin: Review artist applications
│   │   ├── AdminUsers.vue      # Admin: User management dashboard
│   │   ├── ArtistMedley.vue    # Medley management
│   │   ├── ArtistRoster.vue    # Multi-artist management for admin/label/manager users
│   │   ├── CreateArtist.vue    # Artist onboarding (requires verified email)
│   │   ├── DiscoverPage.vue    # Music discover
│   │   ├── HomePage.vue        # Landing page
│   │   ├── LoginPage.vue       # User login
│   │   ├── MedleyPage.vue      # Public medley player
│   │   ├── MedleySuccess.vue   # PayPal success callback
│   │   ├── MusicCollection.vue # User's music library
│   │   ├── SignupPage.vue      # User registration with email verificationy
│   │   └── UserProfile.vue     # User settings
│   │
│   ├── App.vue                 # Root component
│   ├── main.js                 # Application entry
│   └── firebase.js             # Firebase configuration
│
├── functions/                  # Cloud Functions
│   ├── index.js                # Function exports
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
1. **Artist Application** - Apply to become an artist with approval workflow
2. **Artist Profile** - Basic profile with name, genre, bio, PayPal email (after approval)
3. **Medley Manager** - Upload up to 4 tracks with custom artwork
4. **Direct Payments** - 100% of sales go directly to artist's PayPal
5. **Flexible Pricing** - Set prices from $0-10 per track
6. **Download Control** - Choose stream-only or allow downloads
7. **Public Link** - Share medley at `4track.io/artistname`
8. **Basic Analytics** - Track plays, hearts, and revenue

### For Fans
1. **Discover Music** - Browse artists by genre
2. **Music Collection** - Save and purchase tracks
3. **Direct Support** - Pay artists directly via PayPal
4. **Download Library** - Access purchased tracks anytime
5. **Heart Tracks** - Save favorites for later purchase

### For Labels & Managers
1. **Artist Roster** - Centralized multi-artist management
2. **Create Artists** - Add new artist profiles with Spotify integration
3. **Hierarchical Access** - Manage multiple artists from one account
4. **Role-Based Permissions** - Admin sees all, others see their artists
5. **Quick Actions** - Navigate to medley management or public pages

### For Admins
1. **User Management** - View all users and their roles
2. **Application Review** - Approve/deny artist applications
3. **Platform Stats** - Monitor user growth and activity
4. **Access Control** - Admin-only routes and features

### Authentication & Security
1. **Email Verification** - Required for all email/password signups
2. **Google Sign-In** - Pre-verified authentication option
3. **Invite Codes** - Special access for early artists (FIRSTWAVE)
4. **Secure Sessions** - JWT-based authentication
5. **Privacy First** - Minimal data collection
6. **Role-Based Access** - Consumer, Artist, and Admin roles

### Privacy & Security
1. **No Cookies** - Zero tracking cookies
2. **Session-Based** - Analytics use temporary session IDs
3. **GDPR and CCPA Compliant** - Minimal data collection
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

#### artistApplications
```
{
  userId: string,
  userEmail: string,
  displayName: string,
  artistName: string,
  genre: string | null,
  applicationReason: string,
  bio: string | null,
  status: 'pending' | 'approved' | 'denied',
  createdAt: timestamp,
  reviewedAt: timestamp | null,
  reviewedBy: string | null, // Admin user ID
  reviewNotes: string | null, // Optional denial reason
  artistProfileId: string | null // Set when approved
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
  platform: '4track',
  spotifyArtistId: string // Optional Spotify ID
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

## Utility Functions

### permissions.js
Centralized permission checking for role-based access control:
- `canViewArtistRoster()` - Check roster access
- `canCreateArtist()` - Check artist creation permission
- `hasArtistAccess()` - Verify access to specific artist
- `getAccessibleArtists()` - Retrieve all artists user can manage
- `getRoleLabel()` - Format role for display
- `extractSpotifyArtistId()` - Parse Spotify URLs

## Authentication Flow

### Email/Password Signup
1. User enters display name, email, and password
2. Optional: Enter invite code (FIRSTWAVE for artist access)
3. Account created with `emailVerified: false`, `userType: 'consumer'`
4. Verification email sent automatically
5. User sees confirmation page with resend option
6. User clicks verification link in email
7. Email verified status updated in Firebase Auth and Firestore
8. Full access granted to platform features

### Artist Application Flow
1. Consumer users apply to become artists via CreateArtist.vue
2. Application submitted with artist name, genre, reason, and bio
3. Application stored in `artistApplications` collection with `status: 'pending'`
4. Admin users review applications in AdminArtists.vue
5. On approval:
   - User's `userType` updated to 'artist'
   - Artist profile created in `artistProfiles`
   - User can now access artist features
6. On denial:
   - Application marked as 'denied' with optional reason
   - User remains a consumer

### Google Sign-In
1. User clicks "Continue with Google"
2. Google OAuth popup appears
3. Account created/signed in with `emailVerified: true`
4. Immediate access to all features

### Email Verification Requirements
- **Creating Artist Profile**: Requires verified email (via application)
- **Uploading Tracks**: Requires verified email
- **Purchasing Tracks**: No verification required
- **Saving Tracks**: No verification required

### AdminUsers
Admin dashboard for user management:
- View all platform users
- Filter by name, email, or type
- See user statistics (total, consumers, artists, admins)
- Check email verification status
- Monitor user growth

### AdminArtists
Admin interface for artist application review:
- Tabbed view (Pending, Approved, Denied)
- Review application details and reasons
- One-click approve/deny actions
- Automatic artist profile creation on approval
- Optional denial notes

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

#### Artist Roster Management
- Multi-artist overview for label/manager accounts
- Create new artist profiles with optional Spotify import
- Hierarchical permission system
- Quick access to artist medleys and public pages

## User Types & Access Control

### User Types (userType field)

1. **consumer** (default)
   - Can discover and purchase music
   - Build personal music collection
   - Save tracks to favorites
   - No artist management capabilities

2. **artist**
   - All consumer features included
   - Create and manage one artist profile
   - Upload medley tracks (up to 4)
   - Set pricing and PayPal integration
   - View basic analytics
   - Requires email verification

3. **label**
   - All consumer features included
   - Hierarchical access to multiple artists
   - Manage artist roster
   - View aggregated analytics across artists
   - Bulk operations for catalog management
   - Requires admin approval or special invite code

4. **manager**
   - All consumer features included
   - Hierarchical access to assigned artists
   - Cannot create new artists (must be granted access)
   - View analytics for managed artists
   - Assist with medley and profile management
   - Requires artist invitation

5. **admin**
   - Full platform access
   - All features from other user types
   - User management capabilities
   - Platform configuration
   - Analytics across entire platform
   - Invite code generation

### Hierarchical Access System

Label and manager accounts can manage multiple artists through a permission-based system:

```
// Example artist access structure
artistAccess: {
  artistId: {
    role: 'owner' | 'manager' | 'label',
    permissions: ['edit', 'analytics', 'revenue'],
    grantedBy: 'userId',
    grantedAt: timestamp
  }
}
```

### Features by User Type
```
| Feature          | Consumer | Artist  | Label      | Manager    | Admin  |
|------------------|----------|---------|------------|------------|--------|
| Music Collection | ✓        | ✓       | ✓          | ✓          | ✓      |
| Purchase Tracks  | ✓        | ✓       | ✓          | ✓          | ✓      |
| Create Artist    | ✗        | ✓ (1)   | ✓ (∞)      | ✓ (∞)      | ✓      |
| Artist Roster    | ✗        | ✗       | ✓          | ✓          | ✓      |
| Manage Artists   | ✗        | ✓ (own) | ✓ (roster) | ✓ (shared) | ✓      |
| View Analytics   | ✗        | ✓ (own) | ✓ (all)    | ✓ (shared) | ✓      |
| Bulk Operations  | ✗        | ✗       | ✓          | ✗          | ✓      |
| Platform Admin   | ✗        | ✗       | ✗          | ✗          | ✓      |
```

### Implementation Notes

- User type is stored in the `userType` field in the users collection
- Email verification required for artist features
- Application approval workflow prevents spam/abuse
- PayPal email collected only when needed (paid tracks)
- Admin routes protected by router navigation guards
- **Artist roster access limited to admin, label, and manager users**
- **Hierarchical permissions allow labels/managers to create and manage multiple artists**
- **Spotify integration available during artist creation for metadata import**