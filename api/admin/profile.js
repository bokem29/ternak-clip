import admin, { db, auth } from '../lib/firebase-admin.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
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
            // Get admin profile
            const userDoc = await db.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userData = userDoc.data();

            res.status(200).json({
                admin: {
                    id: userId,
                    email: userData.email,
                    name: userData.name || 'Admin',
                    role: userData.role,
                    status: userData.status || 'ACTIVE',
                    createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
                    lastActive: userData.lastActive?.toDate?.()?.toISOString() || null,
                    twoFactorEnabled: userData.twoFactorEnabled || false,
                    passwordLastChanged: userData.passwordLastChanged?.toDate?.()?.toISOString() || null
                }
            });
        } else if (req.method === 'PATCH') {
            // Update admin profile
            const { name, email } = req.body;
            const updateData = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (name) updateData.name = name;
            if (email) updateData.email = email;

            await db.collection('users').doc(userId).update(updateData);

            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in /api/admin/profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
