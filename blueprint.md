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
- **Image Processing**: Pixels.js for photo filters and effects

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
│   │   ├── AudioMeters.vue     # RMS and peak volume meters
│   │   ├── AudioRTA.vue        # Frequency analyzer
│   │   ├── CustomIcon.vue      # Reusable component for rendering SVG icons
│   │   ├── NavBar.vue          # Main navigation
│   │   ├── PhotoLab.vue        # Photo editing modal with filters
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
│   │   ├── ArtistRoster.vue    # Multi-artist management for admin/label/manager users
│   │   ├── ArtistStudio.vue    # Combined artist dashboard with royalty split management
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
│   ├── index.js                # Main cloud functions including PayPal processing
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
2. **Artist Studio** - Combined dashboard for profile management and medley creation
3. **Medley Management** - Upload up to 4 tracks with custom artwork directly in the studio
4. **Direct Payments** - 100% of sales go directly to artist's PayPal
5. **Flexible Pricing** - Set prices from $0-10 per track
6. **Download Control** - Choose stream-only or allow downloads
7. **Public Link** - Share medley at `4track.io/artistname`
8. **Basic Analytics** - Track plays, hearts, and revenue
9. **Photo Gallery** - Upload artist photos with automatic thumbnail generation
10. **Photo Lab** - Apply artistic filters to photos using 10 different effects
11. **Collaborator Royalty Splits** - Automatically split payments between multiple artists

### For Fans
1. **Discover Music** - Browse artists by genre
2. **Music Collection** - Save and purchase tracks
3. **Direct Support** - Pay artists directly via PayPal
4. **Download Library** - Access purchased tracks anytime
5. **Heart Tracks** - Save favorites for later purchase
6. **See Collaborators** - View all artists featured on a track

### For Labels & Managers
1. **Artist Roster** - Centralized multi-artist management
2. **Create Artists** - Add new artist profiles with Spotify integration
3. **Hierarchical Access** - Manage multiple artists from one account
4. **Role-Based Permissions** - Admin sees all, others see their artists
5. **Quick Actions** - Navigate to artist studios or public pages

### For Admins
1. **User Management** - View all users and their roles
2. **Application Review** - Approve/deny artist applications
3. **Platform Stats** - Monitor user growth and activity
4. **Access Control** - Admin-only routes and features

### Photo Features
1. **Photo Upload** - High-resolution artist photos (up to 20MB)
2. **Automatic Thumbnails** - WebP format, 1000px, 85% quality
3. **Primary Photo** - Set main profile image
4. **Photo Lab** - Creative photo editing with filters:
   - Vintage
   - Perfume
   - Serenity
   - Pink Aura
   - Ocean
   - Mellow
   - Coral
   - Crimson
   - Greyscale
   - Phase

### Collaborator Royalty Management
1. **Add Collaborators** - Add featured artists, producers, and other contributors
2. **Percentage Splits** - Define exact percentage for each collaborator (must total 100%)
3. **Automatic Distribution** - PayPal sends payments directly to each collaborator
4. **Equal Split Calculator** - One-click to divide royalties equally
5. **Primary Artist Protection** - Main artist cannot be removed and is auto-populated
6. **Validation** - Real-time validation ensures splits always total 100%
7. **PayPal Email Collection** - Each collaborator must provide their PayPal email
8. **Multi-Party Payments** - Uses PayPal's purchase units for simultaneous payouts
9. **Partial Payment Handling** - System handles cases where some collaborators can't be paid
10. **Transaction Transparency** - All splits recorded in royalty records

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
3. **GDPR/CCPA Compliant** - Minimal data collection
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
  trackTitle: string,
  payerId: string,
  payerEmail: string,
  artistPayPalEmail: string,
  amount: number,
  currency: string,
  orderId: string, // PayPal Order ID
  status: string, // 'COMPLETED' or 'PARTIALLY_COMPLETED'
  type: 'purchase' | 'free_download',
  downloadUrl: string,
  downloadExpiry: timestamp,
  collaborators: [{ // Copy of collaborator splits for record keeping
    name: string,
    email: string,
    percentage: number,
    isPrimary: boolean
  }],
  collaboratorPayments: [{ // Actual payment records per collaborator
    name: string,
    percentage: number,
    amount: number,
    transactionId: string, // PayPal capture ID for this payment
    status: string, // Individual payment status
    isPrimary: boolean
  }],
  notes: string, // Optional notes about partial payments
  timestamp: timestamp
}
```

#### artistPhotos
```
{
  artistId: string,
  originalUrl: string,
  originalPath: string,
  thumbnailUrl: string,
  thumbnailPath: string,
  fileName: string,
  fileSize: number,
  width: number,
  height: number,
  isPrimary: boolean,
  metadata: object, // EXIF data
  uploadedBy: string,
  uploadedAt: timestamp
}
```

## Storage Paths

- **Medley Audio**: `/{userId}/medley/{artistId}/audio/{fileName}` (up to 200MB)
- **Medley Artwork**: `/{userId}/medley/{artistId}/artwork/{fileName}` (up to 20MB)
- **Artist Photos**: `/{userId}/artist-photos/{artistId}/original_{fileName}` (up to 20MB)
- **Photo Thumbnails**: `/{userId}/artist-photos/{artistId}/thumbnails/{fileName}.webp` (1000px, 85% quality)

## Third-Party Integrations

### Pixels.js
The platform uses Pixels.js (loaded via CDN) for photo filter effects in the PhotoLab component:
- **Library**: https://github.com/silvia-odwyer/pixels.js
- **Method**: Uses `filterImgData` for applying filters to ImageData
- **Filters**: 10 artistic filters available for artist photos
- **Implementation**: Works with canvas ImageData to avoid DOM manipulation issues

### PayPal Multi-Party Payments
The platform uses PayPal's advanced checkout features for royalty splits:
- **Single Payee Mode**: For tracks with one artist (backward compatible)
- **Multiple Purchase Units**: For tracks with collaborators (automatic splits)
- **Reference ID Metadata**: Stores collaborator info in base64-encoded JSON
- **Partial Payment Handling**: Continues if some collaborators fail
- **Direct Payouts**: Each collaborator receives payment directly to their PayPal

## Utility Functions

### permissions.js
Centralized permission checking for role-based access control:
- `canViewArtistRoster()` - Check roster access
- `canCreateArtist()` - Check artist creation permission
- `hasArtistAccess()` - Verify access to specific artist
- `getAccessibleArtists()` - Retrieve all artists user can manage
- `getRoleLabel()` - Format role for display
- `extractSpotifyArtistId()` - Parse Spotify URLs

### Collaborator Management Functions (in ArtistStudio.vue)
- `addCollaborator()` - Add new collaborator to track
- `removeCollaborator(index)` - Remove collaborator (except primary)
- `updateCollaboratorSplit(index, value)` - Update percentage with validation
- `autoBalanceSplits()` - Equally divide 100% among all collaborators
- `totalSplitPercentage` - Computed sum of all percentages
- `isSplitValid` - Computed validation that total equals 100%

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

### ArtistStudio
Enhanced artist dashboard combining profile and medley management:
- View real-time statistics (plays, hearts, downloads, revenue)
- Manage up to 4 medley tracks with drag-and-drop interface
- Upload audio files (up to 200MB) and artwork (up to 20MB)
- Set track pricing ($0-10) and download permissions
- **Configure royalty splits for each track with collaborators**
- **Add unlimited collaborators per track**
- **Automatic validation ensures splits total 100%**
- **Equal split calculator for fair distribution**
- Share public medley link
- Upload artist photos with automatic thumbnail generation
- Set primary photo for artist profile image
- **Photo Lab integration for creative photo editing**
- All-in-one interface at `/studio` route

### Collaborator Royalty Split Workflow
1. **Add Track** - Click "Add Track" in an empty slot
2. **Primary Artist Auto-Added** - System automatically adds the artist as primary collaborator with 100%
3. **Add Collaborators** - Click "Add Collaborator" to add featured artists/producers
4. **Enter Details** - For each collaborator, provide:
   - Display name (required)
   - PayPal email (required, must be valid)
   - Percentage split (must be > 0)
5. **Balance Splits** - Use "Split Equally" button or manually adjust percentages
6. **Validation** - System ensures total equals 100% before allowing save
7. **Save Track** - Collaborator data stored with track in Firestore
8. **Payment Processing** - When purchased, PayPal automatically splits payment

### PhotoLab
Photo editing modal component with artistic filters:
- **Powered by Pixels.js** for professional-quality filters
- **10 artistic filters** including Vintage, Ocean, Pink Aura, and more
- **Non-destructive editing** - original photos are preserved
- **Preview grid** showing all filter options
- **One-click application** and save
- **Processed photos** saved as new artist photos
- **Responsive design** works on all devices

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
- Artist photos metadata public read, authenticated write
- Collaborator data included in public track reads

### Storage Rules
- Public read for medley audio and artwork
- Public read for artist photos and thumbnails
- Authenticated upload with file size limits
- Path-based access control
- Supports nested folder structure for thumbnails

## Cloud Functions

### Core Functions

#### createMedleyPayPalOrder
Enhanced with multi-party payment support:
- Creates PayPal checkout for track purchase
- Validates pricing and availability
- **Single purchase unit for tracks with one artist**
- **Multiple purchase units for tracks with collaborators**
- **Each collaborator receives their percentage directly**
- **Stores metadata in reference_id for tracking**
- **Validates all collaborators have PayPal emails**
- **Adjusts for rounding errors on primary artist**
- Returns checkout URL for redirect

#### captureMedleyPayment
Enhanced to handle split payments:
- Captures PayPal payment after approval
- **Handles both COMPLETED and PARTIALLY_COMPLETED status**
- **Processes successful captures even if some fail**
- **Extracts metadata from reference_id or custom_id**
- **Records individual collaborator payment details**
- Records transaction in medleyRoyalties with full split details
- Generates time-limited download URL
- Handles free downloads
- **Logs warnings for partial payments**

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
   - **Configure royalty splits with collaborators**
   - View basic analytics including split details
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
| Configure Splits | ✗        | ✓       | ✓          | ✓          | ✓      |
| Bulk Operations  | ✗        | ✗       | ✓          | ✗          | ✓      |
| Platform Admin   | ✗        | ✗       | ✗          | ✗          | ✓      |
```

### Implementation Notes

- User type is stored in the `userType` field in the users collection
- Email verification required for artist features
- Application approval workflow prevents spam/abuse
- PayPal email collected only when needed (paid tracks or collaborator splits)
- Admin routes protected by router navigation guards
- **Artist Studio provides integrated medley management and analytics**
- **Single destination at `/studio` for all artist needs**
- **Photo management integrated into Artist Studio with automatic profile image update**
- **PhotoLab component provides creative photo editing with Pixels.js filters**
- **Pixels.js loaded via CDN in index.html**
- **Filter processing uses ImageData to avoid DOM manipulation issues**
- **Hierarchical permissions allow labels/managers to access artist studios**
- **Spotify integration available during artist creation for metadata import**
- **Collaborator royalty splits integrated directly into track upload workflow**
- **PayPal multi-party payments handle automatic distribution**
- **Split validation prevents saving tracks with invalid percentages**
- **Primary artist protection ensures main artist is always included**