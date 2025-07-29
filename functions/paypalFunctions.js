// functions/paypalFunctions.js
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const axios = require('axios');

// Get Firestore and Storage instances
const db = getFirestore();
const storage = getStorage();

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
const createMedleyPayPalOrder = onCall({
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

// Capture PayPal payment
const captureMedleyPayment = onCall({
  secrets: [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET],
  cors: true
}, async (request) => {
  const { orderId, artistSlug } = request.data;
  
  if (!orderId) {
    throw new Error('Order ID is required');
  }
  
  console.log('Running as service account:', process.env.FUNCTION_IDENTITY || 'default');
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
    
    // Log the full structure to understand what we're getting
    console.log('Full capture response structure:', JSON.stringify(captureData, null, 2));
    
    // Check if payment was at least partially successful
    if (captureData.status !== 'COMPLETED' && captureData.status !== 'PARTIALLY_COMPLETED') {
      throw new Error(`Payment failed with status: ${captureData.status}`);
    }
    
    // Find the first purchase unit with a successful capture
    let trackId, artistId;
    let successfulCapture = null;
    let purchaseUnitWithCapture = null;
    
    for (const purchaseUnit of captureData.purchase_units) {
      console.log('Examining purchase unit:', {
        hasPayments: !!purchaseUnit.payments,
        hasCaptures: !!(purchaseUnit.payments?.captures),
        capturesLength: purchaseUnit.payments?.captures?.length || 0,
        hasCustomId: !!purchaseUnit.custom_id,
        hasReferenceId: !!purchaseUnit.reference_id,
        customIdValue: purchaseUnit.custom_id,
        referenceIdValue: purchaseUnit.reference_id
      });
      
      if (purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures.length > 0) {
        const capture = purchaseUnit.payments.captures[0];
        if (capture.status === 'COMPLETED') {
          successfulCapture = capture;
          purchaseUnitWithCapture = purchaseUnit;
          
          // Also check if custom_id is on the capture itself
          console.log('Successful capture details:', {
            captureId: capture.id,
            hasCustomId: !!capture.custom_id,
            customIdValue: capture.custom_id
          });
          
          break;
        }
      }
    }
    
    if (!successfulCapture) {
      console.error('No successful captures found in response');
      throw new Error('Payment could not be processed. Please try again.');
    }
    
    console.log('Found successful capture:', successfulCapture.id);
    
    // Extract metadata - check multiple possible locations
    // PayPal might put custom_id at different levels
    const customId = purchaseUnitWithCapture.custom_id || 
                     successfulCapture.custom_id || 
                     captureData.purchase_units[0]?.custom_id;
                     
    const referenceId = purchaseUnitWithCapture.reference_id || 
                        captureData.purchase_units[0]?.reference_id;
    
    console.log('Metadata extraction:', {
      customId,
      referenceId,
      hasCustomId: !!customId,
      hasReferenceId: !!referenceId
    });
    
    // Try to extract trackId and artistId
    if (customId) {
      // Single payee - parse custom_id
      try {
        const customData = JSON.parse(customId);
        trackId = customData.trackId;
        artistId = customData.artistId;
        console.log('Successfully parsed custom_id:', { trackId, artistId });
      } catch (e) {
        console.error('Error parsing custom_id:', e, 'Value was:', customId);
        throw new Error('Invalid transaction metadata in custom_id');
      }
    } else if (referenceId) {
      // Multiple payees - decode reference_id
      try {
        console.log('Attempting to decode reference_id:', referenceId);
        console.log('Reference ID length:', referenceId.length);
        console.log('Reference ID type:', typeof referenceId);
        
        // Try to decode - might fail if not valid base64
        const decodedRef = Buffer.from(referenceId, 'base64').toString('utf8');
        console.log('Decoded reference_id:', decodedRef);
        
        const metadata = JSON.parse(decodedRef);
        trackId = metadata.trackId;
        artistId = metadata.artistId;
        console.log('Successfully parsed reference_id:', { trackId, artistId });
      } catch (e) {
        console.error('Error parsing reference_id:', e);
        console.error('Reference ID was:', referenceId);
        console.error('Hex dump:', Buffer.from(referenceId).toString('hex'));
        
        // If reference_id fails, look for a fallback in purchase units
        // This might happen if PayPal modifies our metadata
        throw new Error('Invalid transaction metadata in reference_id');
      }
    } else {
      console.error('No custom_id or reference_id found anywhere in response');
      console.error('Purchase unit keys:', Object.keys(purchaseUnitWithCapture));
      console.error('Capture keys:', Object.keys(successfulCapture));
      throw new Error('Missing transaction metadata');
    }
    
    console.log('Final extracted IDs - Track ID:', trackId, 'Artist ID:', artistId);
    
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
            // Only try to decode reference_id if it exists and is valid
            if (unit.reference_id && unit.reference_id.length > 0) {
              try {
                // Validate base64 before attempting decode
                if (/^[A-Za-z0-9+/]+=*$/.test(unit.reference_id)) {
                  const decodedRef = Buffer.from(unit.reference_id, 'base64').toString('utf8');
                  metadata = JSON.parse(decodedRef);
                } else {
                  console.warn('Reference ID is not valid base64:', unit.reference_id);
                }
              } catch (e) {
                console.warn('Could not decode reference_id for unit, skipping metadata');
              }
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
          // Check if we're in sandbox mode
          if (PAYPAL_MODE === 'sandbox') {
            // For sandbox, use the public audioUrl directly
            downloadUrl = track.audioUrl;
            console.log('Using public audio URL for download (sandbox mode)');
          } else {
            // Production: try signed URL with graceful fallback
            try {
              const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
              });
              downloadUrl = url;
              console.log('Download URL generated');
            } catch (signError) {
              console.error('Error generating signed URL:', signError);
              // Fallback to public URL
              downloadUrl = track.audioUrl;
              console.log('Falling back to public audio URL');
            }
          }
        }
      } catch (urlError) {
        console.error('Error generating download URL:', urlError);
        // Fallback to audio URL
        downloadUrl = track.audioUrl;
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
const processMedleyFreeDownload = onCall({
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

module.exports = {
  createMedleyPayPalOrder,
  captureMedleyPayment,
  processMedleyFreeDownload
};