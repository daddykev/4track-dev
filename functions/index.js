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
        userId: request.auth?.uid || 'anonymous',
        collaborators: track.collaborators || [{
          name: artist.name,
          email: artist.paypalEmail,
          percentage: 100,
          isPrimary: true
        }]
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
    
    // Get collaborators from track or default to primary artist
    const collaborators = track.collaborators || [{
      name: artist.name,
      email: artist.paypalEmail,
      percentage: 100,
      isPrimary: true
    }];
    
    // Validate all collaborators have PayPal emails
    for (const collab of collaborators) {
      if (!collab.email) {
        throw new Error(`Collaborator ${collab.name} does not have a PayPal email configured`);
      }
    }
    
    // Create PayPal order
    const accessToken = await getPayPalAccessToken();
    
    // For single collaborator (backward compatibility), use single purchase unit
    if (collaborators.length === 1) {
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2)
          },
          payee: {
            email_address: collaborators[0].email
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
    }
    
    // For multiple collaborators, use reference_id to store metadata
    const purchaseUnits = collaborators.map((collab, index) => {
      const collabAmount = (price * (collab.percentage / 100)).toFixed(2);
      
      // Store metadata in reference_id as base64 encoded JSON
      const metadata = {
        trackId,
        artistId,
        collaboratorIndex: index,
        collaboratorName: collab.name,
        percentage: collab.percentage,
        isPrimary: collab.isPrimary || false
      };
      const referenceId = Buffer.from(JSON.stringify(metadata)).toString('base64');
      
      return {
        reference_id: referenceId, // This will be preserved in capture response
        amount: {
          currency_code: 'USD',
          value: collabAmount
        },
        payee: {
          email_address: collab.email
        },
        description: `${track.title} by ${track.artistName || artist.name} - ${collab.name} (${collab.percentage}%)`
      };
    });
    
    // Verify the sum equals the original price (accounting for rounding)
    const totalAmount = purchaseUnits.reduce((sum, unit) => sum + parseFloat(unit.amount.value), 0);
    if (Math.abs(totalAmount - price) > 0.01) {
      console.error('Split calculation error:', { price, totalAmount, difference: totalAmount - price });
      // Adjust the primary artist's amount to account for rounding
      const primaryIndex = collaborators.findIndex(c => c.isPrimary);
      if (primaryIndex !== -1) {
        const adjustment = (price - totalAmount).toFixed(2);
        const currentAmount = parseFloat(purchaseUnits[primaryIndex].amount.value);
        purchaseUnits[primaryIndex].amount.value = (currentAmount + parseFloat(adjustment)).toFixed(2);
      }
    }
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: purchaseUnits,
      application_context: {
        brand_name: '4track',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${request.rawRequest.headers.origin}/${artist.customSlug}/success`,
        cancel_url: `${request.rawRequest.headers.origin}/${artist.customSlug}`
      }
    };
    
    console.log('Creating PayPal order with splits:', {
      trackId,
      totalAmount: price,
      splits: collaborators.map(c => ({ name: c.name, percentage: c.percentage }))
    });
    
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

// Update the captureMedleyPayment function to handle reference_id
// Update the captureMedleyPayment function to handle partial captures
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
    console.log('PayPal capture response status:', captureData.status);
    
    // Check if payment was at least partially successful
    if (captureData.status !== 'COMPLETED' && captureData.status !== 'PARTIALLY_COMPLETED') {
      throw new Error(`Payment failed with status: ${captureData.status}`);
    }
    
    // Find the first purchase unit with a successful capture
    let trackId, artistId;
    let successfulCapture = null;
    let purchaseUnitWithCapture = null;
    
    for (const purchaseUnit of captureData.purchase_units) {
      if (purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures.length > 0) {
        const capture = purchaseUnit.payments.captures[0];
        if (capture.status === 'COMPLETED') {
          successfulCapture = capture;
          purchaseUnitWithCapture = purchaseUnit;
          break;
        }
      }
    }
    
    if (!successfulCapture) {
      console.error('No successful captures found in response');
      throw new Error('Payment could not be processed. Please try again.');
    }
    
    console.log('Found successful capture:', successfulCapture.id);
    
    // Extract metadata from either custom_id or reference_id
    if (successfulCapture.custom_id) {
      // Single payee - parse custom_id
      const customData = JSON.parse(successfulCapture.custom_id);
      trackId = customData.trackId;
      artistId = customData.artistId;
    } else if (purchaseUnitWithCapture.reference_id) {
      // Multiple payees - decode reference_id
      const decodedRef = Buffer.from(purchaseUnitWithCapture.reference_id, 'base64').toString('utf8');
      const metadata = JSON.parse(decodedRef);
      trackId = metadata.trackId;
      artistId = metadata.artistId;
    } else {
      console.error('No custom_id or reference_id found in capture response');
      throw new Error('Missing transaction metadata');
    }
    
    console.log('Track ID:', trackId, 'Artist ID:', artistId);
    
    // Get track details
    const trackDoc = await db.collection('medleyTracks').doc(trackId).get();
    
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }
    
    const track = trackDoc.data();
    
    // Get artist details
    const artistDoc = await db.collection('artistProfiles').doc(artistId).get();
    const artist = artistDoc.exists ? artistDoc.data() : {};
    
    // Process payment details
    const buyerEmail = request.auth?.token?.email || captureData.payer?.email_address || null;
    const buyerId = request.auth?.uid || null;
    
    // Collect all successful captures
    const successfulCaptures = [];
    let totalCapturedAmount = 0;
    
    for (const unit of captureData.purchase_units) {
      if (unit.payments?.captures?.length > 0) {
        for (const capture of unit.payments.captures) {
          if (capture.status === 'COMPLETED') {
            let metadata = null;
            if (unit.reference_id) {
              const decodedRef = Buffer.from(unit.reference_id, 'base64').toString('utf8');
              metadata = JSON.parse(decodedRef);
            }
            
            successfulCaptures.push({
              capture,
              metadata,
              amount: parseFloat(capture.amount.value)
            });
            
            totalCapturedAmount += parseFloat(capture.amount.value);
          }
        }
      }
    }
    
    console.log(`Successfully captured ${successfulCaptures.length} payments, total: $${totalCapturedAmount}`);
    
    // Build royalty record
    const royaltyData = {
      trackId,
      artistId: artistId || track.artistId,
      trackTitle: track.title,
      orderId,
      amount: totalCapturedAmount,
      currency: 'USD',
      status: captureData.status,
      type: 'purchase',
      timestamp: FieldValue.serverTimestamp(),
      payerEmail: buyerEmail,
      payerId: captureData.payer?.payer_id || buyerId,
      userId: buyerId,
      artistPayPalEmail: artist.paypalEmail
    };
    
    // Add details based on number of captures
    if (successfulCaptures.length === 1) {
      // Single capture (backward compatible)
      royaltyData.paypalTransactionId = successfulCaptures[0].capture.id;
    } else {
      // Multiple captures
      royaltyData.collaboratorPayments = successfulCaptures.map(sc => ({
        name: sc.metadata?.collaboratorName || 'Unknown',
        percentage: sc.metadata?.percentage || 0,
        amount: sc.amount,
        transactionId: sc.capture.id,
        status: sc.capture.status,
        isPrimary: sc.metadata?.isPrimary || false
      }));
    }
    
    // Save collaborators from track data
    royaltyData.collaborators = track.collaborators || [{
      name: artist.name,
      email: artist.paypalEmail,
      percentage: 100,
      isPrimary: true
    }];
    
    // Note if payment was partial
    if (captureData.status === 'PARTIALLY_COMPLETED') {
      royaltyData.notes = 'Some collaborator payments may have failed. Check PayPal for details.';
      console.warn('Payment was partially completed. Some collaborators may not have received payment.');
    }
    
    console.log('Recording royalty...');
    const royaltyDoc = await db.collection('medleyRoyalties').add(royaltyData);
    console.log('Royalty recorded:', royaltyDoc.id);
    
    // Generate download URL if allowed
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
        }
      } catch (urlError) {
        console.error('Error generating download URL:', urlError);
      }
    }
    
    return {
      success: true,
      downloadUrl,
      streamUrl: track.audioUrl,
      allowDownload: track.allowDownload !== false
    };
    
  } catch (error) {
    console.error('Error capturing payment:', error);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('PayPal API error:', error.response.data);
    }
    
    if (error.response?.data?.name === 'RESOURCE_NOT_FOUND') {
      throw new Error('Payment order not found. It may have already been processed.');
    } else if (error.response?.data?.name === 'ORDER_ALREADY_CAPTURED') {
      throw new Error('This payment has already been processed.');
    } else {
      throw new Error(error.message || 'Failed to process payment');
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