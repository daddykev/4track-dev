# 4track - Open Source Music Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-FFA000.svg)](https://firebase.google.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integration-00457C.svg)](https://developer.paypal.com/)

> A free, open source music platform that enables independent artists to monetize their music directly with listeners through customizable audio players and direct PayPal integration.

🎵 **[Live Demo](https://4track.io)** | 📚 **[Documentation](#documentation)** | 🚀 **[Getting Started](#getting-started)**

## ✨ Features

### 🎤 For Artists
- **Direct Monetization** - 100% of revenue goes directly to your PayPal
- **Medley Player** - Upload up to 4 tracks with custom artwork
- **Flexible Pricing** - Set prices from $0-10 per track or offer free downloads
- **Public Sharing** - Get your own shareable link at `4track.io/yourname`
- **Photo Gallery** - Upload high-resolution photos with artistic filters
- **Real-time Analytics** - Track plays, hearts, downloads, and revenue
- **Email Verification** - Secure artist onboarding with approval workflow

### 🎧 For Fans
- **Music Discovery** - Browse artists by genre and style
- **Direct Support** - Pay artists directly with no platform fees
- **Music Collection** - Save favorites and build your library
- **Instant Downloads** - Access purchased tracks immediately
- **Heart System** - Save tracks for later purchase

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
- PayPal SDK for direct payments
- Privacy-first analytics

**Key Features**
- Zero tracking cookies
- GDPR/CCPA compliant
- Email verification required
- Direct artist payouts
- Self-hostable

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project
- PayPal Developer account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fourtrack-os.git
cd fourtrack-os
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
