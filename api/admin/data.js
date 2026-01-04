import admin, { db, auth } from '../lib/firebase-admin.js';

// Combined admin data endpoint - handles profile, audit-logs, and sessions
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
        const { type } = req.query; // type can be: 'profile', 'logs', 'sessions', 'activity'

        if (req.method === 'GET') {
            // Handle different types
            if (type === 'logs') {
                return handleAuditLogs(req, res);
            } else if (type === 'sessions') {
                return handleSessions(req, res, userId);
            } else if (type === 'activity') {
                return handleActivity(req, res, userId);
            } else {
                // Default: profile
                return handleProfile(req, res, userId);
            }
        } else if (req.method === 'PATCH') {
            return handleProfileUpdate(req, res, userId);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in /api/admin/data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle profile get
async function handleProfile(req, res, userId) {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Get sessions
    const sessions = [
        {
            id: 'current-session',
            device: req.headers['user-agent'] || 'Unknown Device',
            ip: req.headers['x-forwarded-for'] || 'Unknown',
            lastActive: new Date().toISOString(),
            isCurrent: true
        }
    ];

    // Get activity
    let activities = [];
    try {
        const logsSnapshot = await db.collection('auditLogs')
            .where('adminId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        logsSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                action: data.action,
                details: data.details || {},
                timestamp: data.timestamp?.toDate?.()?.toISOString() || null
            });
        });
    } catch (error) {
        activities = [];
    }

    res.status(200).json({
        admin: {
            id: userId,
            email: userData.email,
            name: userData.name || 'Admin',
            role: userData.role,
            status: userData.status || 'ACTIVE',
            createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
            lastActive: userData.lastActive?.toDate?.()?.toISOString() || null,
            twoFactorEnabled: userData.twoFactorEnabled || false
        },
        sessions,
        activities
    });
}

// Handle profile update
async function handleProfileUpdate(req, res, userId) {
    const { name, email } = req.body;
    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    await db.collection('users').doc(userId).update(updateData);
    res.status(200).json({ success: true });
}

// Handle audit logs
async function handleAuditLogs(req, res) {
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
        res.status(200).json({ logs: [] });
    }
}

// Handle sessions
async function handleSessions(req, res, userId) {
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
}

// Handle activity
async function handleActivity(req, res, userId) {
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
