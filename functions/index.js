const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall } = require('firebase-functions/v2/https');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Import analytics functions
const { collectPageAnalytics } = require('./analyticsFunctions');

// Import PayPal functions
const {
  createMedleyPayPalOrder,
  captureMedleyPayment,
  processMedleyFreeDownload
} = require('./paypalFunctions');

// Export analytics function
exports.collectAnalytics = collectPageAnalytics;

// Export PayPal functions
exports.createMedleyPayPalOrder = createMedleyPayPalOrder;
exports.captureMedleyPayment = captureMedleyPayment;
exports.processMedleyFreeDownload = processMedleyFreeDownload;

// ==================== Analytics Functions ====================

// Get medley analytics for artist
exports.getMedleyAnalytics = onCall({
  cors: true
}, async (request) => {
  const { artistId, dateRange = '30d' } = request.data;
  
  if (!artistId) {
    throw new Error('Artist ID is required');
  }
  
  // Verify user has access to this artist
  if (!request.auth) {
    throw new Error('Authentication required');
  }
  
  try {
    // Check if user owns the artist
    const artistDoc = await db.collection('artistProfiles').doc(artistId).get();
    if (!artistDoc.exists || artistDoc.data().createdBy !== request.auth.uid) {
      throw new Error('Access denied');
    }
    
    // Get all royalties for this artist
    const royaltiesSnapshot = await db
      .collection('medleyRoyalties')
      .where('artistId', '==', artistId)
      .orderBy('timestamp', 'desc')
      .get();
    
    const royalties = [];
    let totalRevenue = 0;
    let totalDownloads = 0;
    let freeDownloads = 0;
    
    royaltiesSnapshot.forEach(doc => {
      const data = doc.data();
      royalties.push({ id: doc.id, ...data });
      
      if (data.type === 'purchase') {
        totalRevenue += data.amount;
        totalDownloads++;
      } else if (data.type === 'free_download') {
        freeDownloads++;
        totalDownloads++;
      }
    });
    
    // Get track-specific analytics
    const trackAnalytics = {};
    royalties.forEach(royalty => {
      if (!trackAnalytics[royalty.trackId]) {
        trackAnalytics[royalty.trackId] = {
          trackId: royalty.trackId,
          trackTitle: royalty.trackTitle,
          revenue: 0,
          downloads: 0,
          freeDownloads: 0
        };
      }
      
      if (royalty.type === 'purchase') {
        trackAnalytics[royalty.trackId].revenue += royalty.amount;
        trackAnalytics[royalty.trackId].downloads++;
      } else if (royalty.type === 'free_download') {
        trackAnalytics[royalty.trackId].freeDownloads++;
        trackAnalytics[royalty.trackId].downloads++;
      }
    });
    
    // Get play analytics
    const analyticsSnapshot = await db
      .collection('medleyAnalytics')
      .where('pageId', '==', artistId)
      .where('pageType', '==', 'medley')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    
    let totalPlays = 0;
    const playsByCountry = {};
    
    analyticsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.eventType === 'play') {
        totalPlays++;
        playsByCountry[data.country] = (playsByCountry[data.country] || 0) + 1;
      }
    });
    
    return {
      totalRevenue,
      totalDownloads,
      freeDownloads,
      paidDownloads: totalDownloads - freeDownloads,
      totalPlays,
      playsByCountry,
      recentTransactions: royalties.slice(0, 10),
      trackAnalytics: Object.values(trackAnalytics)
    };
    
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw new Error('Failed to retrieve analytics');
  }
});

// ==================== Collection Management ====================

// Add track to user collection
exports.addToCollection = onCall({
  cors: true
}, async (request) => {
  const { trackId, collectionType = 'hearted' } = request.data;
  
  if (!request.auth) {
    throw new Error('Authentication required');
  }
  
  if (!trackId) {
    throw new Error('Track ID is required');
  }
  
  try {
    // Get track details
    const trackDoc = await db.collection('medleyTracks').doc(trackId).get();
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }
    
    const track = trackDoc.data();
    
    // Check if already in collection
    const existingQuery = await db
      .collection('userCollections')
      .where('userId', '==', request.auth.uid)
      .where('trackId', '==', trackId)
      .get();
    
    if (!existingQuery.empty) {
      throw new Error('Track already in collection');
    }
    
    // Add to collection
    const collectionRef = await db.collection('userCollections').add({
      userId: request.auth.uid,
      userEmail: request.auth.token.email,
      trackId,
      artistId: track.artistId,
      timestamp: FieldValue.serverTimestamp(),
      type: collectionType,
      isPurchased: false
    });
    
    return {
      success: true,
      collectionId: collectionRef.id
    };
    
  } catch (error) {
    console.error('Error adding to collection:', error);
    throw new Error(error.message || 'Failed to add to collection');
  }
});

// Remove track from user collection
exports.removeFromCollection = onCall({
  cors: true
}, async (request) => {
  const { collectionId } = request.data;
  
  if (!request.auth) {
    throw new Error('Authentication required');
  }
  
  if (!collectionId) {
    throw new Error('Collection ID is required');
  }
  
  try {
    // Verify ownership
    const collectionDoc = await db.collection('userCollections').doc(collectionId).get();
    
    if (!collectionDoc.exists) {
      throw new Error('Collection item not found');
    }
    
    if (collectionDoc.data().userId !== request.auth.uid) {
      throw new Error('Access denied');
    }
    
    // Don't allow removing purchased items
    if (collectionDoc.data().isPurchased) {
      throw new Error('Cannot remove purchased tracks from collection');
    }
    
    // Delete the document
    await db.collection('userCollections').doc(collectionId).delete();
    
    return { success: true };
    
  } catch (error) {
    console.error('Error removing from collection:', error);
    throw new Error(error.message || 'Failed to remove from collection');
  }
});