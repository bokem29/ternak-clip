import { db, auth } from '../lib/firebase-admin.js';

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
            // Verify token
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

            // Get all users from Firestore
            const usersSnapshot = await db.collection('users').get();
            const users = [];

            usersSnapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    email: data.email || '',
                    name: data.name || 'Unknown',
                    role: data.role || null,
                    status: data.status || 'active',
                    verified: data.verified || false,
                    influencerStatus: data.influencerStatus || 'NOT_APPLIED',
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                    lastActive: data.lastActive?.toDate?.()?.toISOString() || null
                });
            });

            res.status(200).json({ users });
        } catch (error) {
            console.error('Error in /api/admin/users:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
