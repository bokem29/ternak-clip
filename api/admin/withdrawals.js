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

            // Get withdrawal requests
            const withdrawalsSnapshot = await db.collection('withdrawals')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();

            const withdrawals = [];

            withdrawalsSnapshot.forEach(doc => {
                const data = doc.data();
                withdrawals.push({
                    id: doc.id,
                    userId: data.userId,
                    amount: data.amount || 0,
                    status: data.status || 'PENDING',
                    paymentMethod: data.paymentMethod || {},
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                    processedAt: data.processedAt?.toDate?.()?.toISOString() || null,
                    processedBy: data.processedBy || null,
                    rejectionReason: data.rejectionReason || null
                });
            });

            res.status(200).json({ withdrawals });
        } catch (error) {
            console.error('Error in /api/admin/withdrawals:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
