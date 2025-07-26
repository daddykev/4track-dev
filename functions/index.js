const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { onRequest, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const axios = require('axios');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

// Import analytics functions
const { collectPageAnalytics } = require('./analyticsFunctions');

// Export analytics function
exports.collectAnalytics = collectPageAnalytics;

// PayPal configuration
const PAYPAL_CLIENT_ID = defineSecret('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = defineSecret('PAYPAL_CLIENT_SECRET');
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// ==================== PayPal Helper Functions ====================

async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID.value()}:${PAYPAL_CLIENT_SECRET.value()}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }
}

// ==================== Medley/PayPal Functions ====================

// Create PayPal order for medley track purchase
exports.createMedleyPayPalOrder = onCall({
  secrets: [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET],
  cors: true
}, async (request) => {
  const { artistId, trackId } = request.data;
  
  if (!trackId || !artistId) {
    throw new Error('Track ID and Artist ID are required');
  }
  
  try {
    // Get track details
    const trackDoc = await db.collection('medleyTracks').doc(trackId).get();
    
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }
    
    const track = trackDoc.data();
    const price = track.price || 0;
    
    // Get artist details for PayPal email
    const artistDoc = await db.collection('artistProfiles').doc(artistId).get();
    
    if (!artistDoc.exists) {
      throw new Error('Artist not found');
    }
    
    const artist = artistDoc.data();
    
    // Check if artist has PayPal configured
    if (!artist.paypalEmail) {
      throw new Error('Artist has not configured PayPal payment settings');
    }
    
    // For free tracks, skip PayPal and record as free download
    if (price === 0) {
      // Record free download
      const royaltyRef = await db.collection('medleyRoyalties').add({
        trackId,
        artistId,
        trackTitle: track.title,
        amount: 0,
        currency: 'USD',
        type: 'free_download',
        timestamp: FieldValue.serverTimestamp(),
        userEmail: request.auth?.token?.email || 'anonymous',
        userId: request.auth?.uid || 'anonymous'
      });
      
      // Generate time-limited download URL if track allows download
      let downloadUrl = null;
      if (track.allowDownload !== false && track.audioPath) {
        try {
          const file = storage.bucket().file(track.audioPath);
          const [exists] = await file.exists();
          
          if (exists) {
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            });
            downloadUrl = url;
          }
        } catch (urlError) {
          console.error('Error generating download URL:', urlError);
        }
      }
      
      return {
        success: true,
        isFree: true,
        downloadUrl
      };
    }
    
    // Create PayPal order with artist as payee
    const accessToken = await getPayPalAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: price.toFixed(2)
        },
        payee: {
          email_address: artist.paypalEmail // Direct payment to artist
        },
        description: `${track.title} by ${track.artistName || artist.name}`,
        custom_id: JSON.stringify({
          trackId: trackId,
          artistId: artistId
        })
      }],
      application_context: {
        brand_name: '4track',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${request.rawRequest.headers.origin}/${artist.customSlug}/success`,
        cancel_url: `${request.rawRequest.headers.origin}/${artist.customSlug}`
      }
    };
    
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      orderId: response.data.id,
      approveUrl: response.data.links.find(link => link.rel === 'approve').href
    };
    
  } catch (error) {
    console.error('Error creating PayPal order:', error.response?.data || error);
    throw new Error(error.message || 'Failed to create payment order');
  }
});

// Capture PayPal payment and record royalties
exports.captureMedleyPayment = onCall({
  secrets: [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET],
  cors: true
}, async (request) => {
  const { orderId, artistSlug } = request.data;
  
  if (!orderId) {
    throw new Error('Order ID is required');
  }
  
  console.log('Attempting to capture PayPal order:', orderId);
  
  try {
    const accessToken = await getPayPalAccessToken();
    
    // Capture the payment
    const captureResponse = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const captureData = captureResponse.data;
    const purchaseUnit = captureData.purchase_units[0];
    const capture = purchaseUnit.payments.captures[0];
    const customId = capture.custom_id;
    
    // Parse the custom_id which contains our track and artist IDs
    let trackId, artistId;
    try {
      const customData = JSON.parse(customId);
      trackId = customData.trackId;
      artistId = customData.artistId;
    } catch (parseError) {
      console.error('Error parsing custom_id:', parseError);
      throw new Error('Invalid order data');
    }
    
    // Get track details
    const trackDoc = await db.collection('medleyTracks').doc(trackId).get();
    
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }
    
    const track = trackDoc.data();
    
    // Get artist details to record their PayPal email
    const artistDoc = await db.collection('artistProfiles').doc(artistId).get();
    const artist = artistDoc.exists ? artistDoc.data() : {};
    
    // IMPORTANT: Use the authenticated user's email as the payer
    // This is what MusicCollection.vue queries for
    const buyerEmail = request.auth?.token?.email || captureData.payer?.email_address || null;
    const buyerId = request.auth?.uid || null;
    
    // Record the transaction
    const royaltyDoc = await db.collection('medleyRoyalties').add({
      trackId,
      artistId: artistId || track.artistId,
      trackTitle: track.title,
      orderId,
      paypalTransactionId: capture.id,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      status: capture.status,
      type: 'purchase',
      timestamp: FieldValue.serverTimestamp(),
      // Buyer information (this is what MusicCollection queries)
      payerEmail: buyerEmail, // The authenticated user who bought the track
      payerId: captureData.payer?.payer_id || buyerId,
      userId: buyerId, // Firebase user ID of the buyer
      // Artist payment information
      artistPayPalEmail: artist.paypalEmail || purchaseUnit.payee?.email_address,
      // Store fee information
      grossAmount: parseFloat(capture.seller_receivable_breakdown.gross_amount.value),
      paypalFee: parseFloat(capture.seller_receivable_breakdown.paypal_fee.value),
      netAmount: parseFloat(capture.seller_receivable_breakdown.net_amount.value)
    });
    
    console.log('Royalty recorded:', {
      royaltyId: royaltyDoc.id,
      buyerEmail: buyerEmail,
      artistPayPalEmail: artist.paypalEmail
    });
    
    // Generate secure download URL if download is allowed
    let downloadUrl = null;
    if (track.allowDownload !== false && track.audioPath) {
      try {
        const file = storage.bucket().file(track.audioPath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          });
          downloadUrl = url;
          console.log('Download URL generated');
        } else {
          console.warn('Audio file not found in storage:', track.audioPath);
        }
      } catch (urlError) {
        console.error('Error generating download URL:', urlError);
        // Continue without download URL rather than failing the whole transaction
      }
    }
    
    return {
      success: true,
      downloadUrl,
      streamUrl: track.audioUrl,
      allowDownload: track.allowDownload !== false
    };
    
  } catch (error) {
    console.error('Error capturing payment:', error.response?.data || error);
    
    if (error.response?.data?.name === 'RESOURCE_NOT_FOUND') {
      throw new Error('Payment order not found. It may have already been processed.');
    } else if (error.response?.data?.name === 'ORDER_ALREADY_CAPTURED') {
      throw new Error('This payment has already been processed.');
    } else {
      throw new Error(error.response?.data?.message || error.message || 'Failed to process payment');
    }
  }
});

// Process free download
exports.processMedleyFreeDownload = onCall({
  cors: true
}, async (request) => {
  const { medleyId, trackId } = request.data;
  
  if (!trackId || !medleyId) {
    throw new Error('Track ID and Medley ID are required');
  }
  
  // Require authentication for downloads
  if (!request.auth) {
    throw new Error('Authentication required');
  }
  
  try {
    // Get track details
    const trackDoc = await db.collection('medleyTracks').doc(trackId).get();
    
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }
    
    const track = trackDoc.data();
    
    // Verify it's a free track
    if (track.price > 0) {
      throw new Error('This track is not free');
    }
    
    // Record the free download
    await db.collection('medleyRoyalties').add({
      trackId,
      artistId: track.artistId,
      trackTitle: track.title,
      amount: 0,
      currency: 'USD',
      type: 'free_download',
      timestamp: FieldValue.serverTimestamp(),
      userId: request.auth.uid,
      userEmail: request.auth.token.email
    });
    
    // Generate download URL
    let downloadUrl = null;
    if (track.allowDownload !== false && track.audioPath) {
      const file = storage.bucket().file(track.audioPath);
      const [exists] = await file.exists();
      
      if (exists) {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        downloadUrl = url;
      }
    }
    
    return {
      success: true,
      downloadUrl
    };
    
  } catch (error) {
    console.error('Error processing free download:', error);
    throw new Error(error.message || 'Failed to process download');
  }
});

// ==================== Analytics Functions ====================

// Collect analytics data (privacy-focused)
exports.collectAnalytics = onRequest({
  cors: true
}, async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  
  try {
    const { pageType, pageId, eventType, metadata = {} } = req.body;
    
    // Validate required fields
    if (!pageType || !pageId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get IP for geolocation (but don't store it)
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Basic geo data (you would integrate with a geo service here)
    // For now, just use the Accept-Language header as a proxy
    const language = req.headers['accept-language']?.split(',')[0] || 'en-US';
    const country = language.split('-')[1] || 'US';
    
    // Create analytics record
    const analyticsData = {
      pageType,
      pageId,
      eventType,
      metadata,
      timestamp: FieldValue.serverTimestamp(),
      // Privacy-focused data only
      country,
      language,
      userAgent: req.headers['user-agent'],
      // Session ID from client (not stored permanently)
      sessionId: metadata.sessionId || null
    };
    
    await db.collection('medleyAnalytics').add(analyticsData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error collecting analytics:', error);
    res.status(500).json({ error: 'Failed to record analytics' });
  }
});

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