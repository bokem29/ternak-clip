import { db, auth } from '../lib/firebase-admin.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
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
            const { role } = req.body;

            if (!['clipper', 'influencer'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            await db.collection('users').doc(userId).update({
                role: role,
                updatedAt: new Date()
            });

            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();

            res.status(200).json({
                success: true,
                user: {
                    id: userId,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role,
                    status: userData.status || 'active'
                }
            });
        } catch (error) {
            console.error('Error in /api/auth/set-role:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
