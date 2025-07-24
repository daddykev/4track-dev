const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');

/**
 * Collect analytics data from release pages
 */
const collectPageAnalytics = onRequest({
  cors: true,
  maxInstances: 100,
  region: 'us-central1'
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const analyticsData = req.body;
    
    // Add server-side timestamp
    analyticsData.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Validate required fields based on page type
    if (!analyticsData.sessionId) {
      res.status(400).json({ success: false, error: 'Missing sessionId' });
      return;
    }
    
    // Handle different page types
    const pageType = analyticsData.pageType || 'product'; // default to product for backward compatibility
    
    switch (pageType) {
      case 'artist':
        if (!analyticsData.artistId) {
          res.status(400).json({ success: false, error: 'Missing artistId for artist page' });
          return;
        }
        break;
        
      case 'label':
        if (!analyticsData.labelId) {
          res.status(400).json({ success: false, error: 'Missing labelId for label page' });
          return;
        }
        break;
        
      case 'medley':
        // Medley pages only require artistId
        if (!analyticsData.artistId) {
          res.status(400).json({ success: false, error: 'Missing artistId for medley page' });
          return;
        }
        break;
        
      case 'product':
      case 'release':
      default:
        if (!analyticsData.artistId || !analyticsData.productId) {
          res.status(400).json({ success: false, error: 'Missing required fields for product page' });
          return;
        }
        break;
    }

    // Store in Firestore
    const docRef = await admin.firestore()
      .collection('pageAnalytics')
      .add(analyticsData);
    
    // Log analytics data with appropriate fields
    const logData = {
      pageType: pageType,
      sessionId: analyticsData.sessionId,
      country: analyticsData.country,
      eventsCount: analyticsData.events?.length || 0
    };
    
    // Add relevant IDs based on page type
    if (pageType === 'label') {
      logData.labelId = analyticsData.labelId;
      logData.labelSlug = analyticsData.labelSlug || 'N/A';
    } else if (pageType === 'artist') {
      logData.artistId = analyticsData.artistId;
      logData.artistSlug = analyticsData.artistSlug || 'N/A';
    } else {
      logData.artistId = analyticsData.artistId;
      logData.productId = analyticsData.productId;
      logData.productSlug = analyticsData.productSlug || 'N/A';
    }
    
    console.log('Analytics data collected:', docRef.id, logData);
    
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error collecting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to collect analytics' });
  }
});

module.exports = {
  collectPageAnalytics
};