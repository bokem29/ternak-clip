import admin, { db, auth } from '../lib/firebase-admin.js';

// Combined admin API handler using catch-all route
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

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

        const userId = decodedToken.uid;

        // Get the path from the catch-all route
        const { path } = req.query;
        const routePath = Array.isArray(path) ? path.join('/') : path || '';

        // Route handling
        if (routePath === 'users' || routePath === '') {
            return handleUsers(req, res);
        } else if (routePath === 'influencers') {
            return handleInfluencers(req, res);
        } else if (routePath === 'withdrawals') {
            return handleWithdrawals(req, res);
        } else if (routePath === 'audit-logs') {
            return handleAuditLogs(req, res);
        } else if (routePath === 'stats') {
            return handleStats(req, res);
        } else if (routePath === 'profile') {
            return handleProfile(req, res, userId);
        } else if (routePath === 'profile/sessions') {
            return handleSessions(req, res, userId);
        } else if (routePath === 'profile/activity') {
            return handleActivity(req, res, userId);
        } else {
            return res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('Admin API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Handler: Users
async function handleUsers(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
}

// Handler: Influencers
async function handleInfluencers(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const profilesSnapshot = await db.collection('influencerProfiles').get();
    const applications = [];

    profilesSnapshot.forEach(doc => {
        const data = doc.data();
        applications.push({
            id: doc.id,
            userId: data.userId,
            brandName: data.brandName || '',
            socialMedia: data.socialMedia || {},
            status: data.status || 'PENDING_REVIEW',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null
        });
    });

    res.status(200).json({ applications });
}

// Handler: Withdrawals
async function handleWithdrawals(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null
        });
    });

    res.status(200).json({ withdrawals });
}

// Handler: Audit Logs
async function handleAuditLogs(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const logsSnapshot = await db.collection('auditLogs')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const logs = [];

        logsSnapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                adminId: data.adminId,
                action: data.action,
                details: data.details || {},
                timestamp: data.timestamp?.toDate?.()?.toISOString() || null
            });
        });

        res.status(200).json({ logs });
    } catch (error) {
        // Return empty if collection doesn't exist
        res.status(200).json({ logs: [] });
    }
}

// Handler: Stats
async function handleStats(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return basic stats
    const usersSnapshot = await db.collection('users').get();
    const campaignsSnapshot = await db.collection('campaigns').get();

    res.status(200).json({
        totalUsers: usersSnapshot.size,
        totalCampaigns: campaignsSnapshot.size,
        activeUsers: usersSnapshot.size,
        pendingWithdrawals: 0
    });
}

// Handler: Profile
async function handleProfile(req, res, userId) {
    if (req.method === 'GET') {
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
                createdAt: userData.createdAt?.toDate?.()?.toISOString() || null
            }
        });
    } else if (req.method === 'PATCH') {
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
}

// Handler: Sessions
async function handleSessions(req, res, userId) {
    if (req.method === 'GET') {
        const sessions = [
            {
                id: 'current-session',
                device: req.headers['user-agent'] || 'Unknown Device',
                ip: req.headers['x-forwarded-for'] || 'Unknown',
                lastActive: new Date().toISOString(),
                isCurrent: true
            }
        ];
        res.status(200).json({ sessions });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// Handler: Activity
async function handleActivity(req, res, userId) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
        res.status(200).json({ activities: [] });
    }
}
