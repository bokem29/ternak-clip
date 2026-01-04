import admin, { db, auth } from '../lib/firebase-admin.js';

// Combined auth API handler using catch-all route
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Get the path from the catch-all route
    const { path } = req.query;
    const routePath = Array.isArray(path) ? path.join('/') : path || '';

    try {
        if (routePath === 'me') {
            return handleMe(req, res);
        } else if (routePath === 'set-role') {
            return handleSetRole(req, res);
        } else if (routePath === 'login') {
            return res.status(200).json({ message: 'Use Firebase Auth for login' });
        } else if (routePath === 'register') {
            return res.status(200).json({ message: 'Use Firebase Auth for registration' });
        } else {
            return res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('Auth API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Handler: Get current user
async function handleMe(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);

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
}

// Handler: Set user role
async function handleSetRole(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
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

    // Validate role
    if (!['clipper', 'influencer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be clipper or influencer' });
    }

    // Update user role in Firestore
    await db.collection('users').doc(userId).update({
        role: role,
        updatedAt: new Date()
    });

    // Get updated user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.status(200).json({
        success: true,
        user: {
            id: userId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            status: userData.status || 'active',
            verified: userData.verified || false
        }
    });
}
