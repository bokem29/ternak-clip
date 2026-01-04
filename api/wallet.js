import { db, auth } from './lib/firebase-admin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;

    if (req.method === 'GET') {
      const { all } = req.query;

      // If ?all=true, return all transactions (for admin)
      if (all === 'true') {
        let transactions = [];
        try {
          const txSnapshot = await db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

          txSnapshot.forEach(doc => {
            const data = doc.data();
            transactions.push({
              id: doc.id,
              userId: data.userId || '',
              type: data.type || 'unknown',
              amount: data.amount || 0,
              status: data.status || 'completed',
              description: data.description || '',
              createdAt: data.createdAt?.toDate?.()?.toISOString() || null
            });
          });
        } catch (error) {
          transactions = [];
        }
        return res.status(200).json({ transactions });
      }

      // Return wallet balance and transactions for current user
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // Get transactions for this user
      let transactions = [];
      try {
        const txSnapshot = await db.collection('transactions')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        txSnapshot.forEach(doc => {
          const data = doc.data();
          transactions.push({
            id: doc.id,
            type: data.type || 'unknown',
            amount: data.amount || 0,
            status: data.status || 'completed',
            description: data.description || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null
          });
        });
      } catch (error) {
        // Collection might not exist or need index
        transactions = [];
      }

      res.status(200).json({
        balance: userData.balance || 0,
        pendingBalance: userData.pendingBalance || 0,
        totalEarned: userData.totalEarned || 0,
        totalWithdrawn: userData.totalWithdrawn || 0,
        transactions
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in /api/wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
