import admin, { db, auth } from '../lib/firebase-admin.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
      }

      const token = authHeader.substring(7);

      // Verify Firebase token
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const userId = decodedToken.uid;
      const userEmail = decodedToken.email;

      // Get user from Firestore
      const userDoc = await db.collection('users').doc(userId).get();

      let userData;
      if (!userDoc.exists) {
        // Create new user in Firestore if doesn't exist
        userData = {
          email: userEmail,
          name: decodedToken.name || userEmail?.split('@')[0] || 'User',
          role: null,
          status: 'active',
          verified: false,
          influencerStatus: 'NOT_APPLIED',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(userId).set(userData);
      } else {
        userData = userDoc.data();
      }

      // Return user data
      res.status(200).json({
        id: userId,
        email: userData.email || userEmail,
        name: userData.name || 'User',
        role: userData.role || null,
        status: userData.status || 'active',
        verified: userData.verified || false,
        influencerStatus: userData.influencerStatus || 'NOT_APPLIED',
        balance: userData.balance || 0,
        pendingBalance: userData.pendingBalance || 0
      });
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
