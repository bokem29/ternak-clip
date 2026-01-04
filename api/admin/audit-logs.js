import { db, auth } from '../lib/firebase-admin.js';

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
            try {
                await auth.verifyIdToken(token);
            } catch (error) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Get audit logs
            try {
                const logsSnapshot = await db.collection('auditLogs')
                    .orderBy('timestamp', 'desc')
                    .limit(500)
                    .get();

                const logs = [];

                logsSnapshot.forEach(doc => {
                    const data = doc.data();
                    logs.push({
                        id: doc.id,
                        adminId: data.adminId || '',
                        adminName: data.adminName || 'System',
                        action: data.action || '',
                        targetType: data.targetType || '',
                        targetId: data.targetId || '',
                        details: data.details || {},
                        ipAddress: data.ipAddress || '',
                        userAgent: data.userAgent || '',
                        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
                    });
                });

                res.status(200).json({ logs });
            } catch (error) {
                // Collection might not exist, return empty array
                res.status(200).json({ logs: [] });
            }
        } catch (error) {
            console.error('Error in /api/admin/audit-logs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
