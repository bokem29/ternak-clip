import { db, auth } from '../../lib/firebase-admin.js';

export default async function handler(req, res) {
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

            // Get admin's audit log activity
            const logsSnapshot = await db.collection('auditLogs')
                .where('adminId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const activities = [];

            logsSnapshot.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    action: data.action,
                    details: data.details || {},
                    timestamp: data.timestamp?.toDate?.()?.toISOString() || null
                });
            });

            res.status(200).json({ activities });
        } catch (error) {
            console.error('Error in /api/admin/profile/activity:', error);
            // Return empty array if auditLogs collection doesn't exist
            res.status(200).json({ activities: [] });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
