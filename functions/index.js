// Firebase Cloud Functions - Complete API
import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { calculateWalletBalance, getUser, logAudit, toISOString } from './helpers.js';
import { setupRoutes } from './routes.js';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: Verify Firebase Auth Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper: Require role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await getUser(req.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Helper: Require verified influencer
const requireVerifiedInfluencer = () => {
  return async (req, res, next) => {
    try {
      const user = await getUser(req.userId);
      if (!user) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (user.role === 'influencer' && !user.verified) {
        return res.status(403).json({ error: 'Only verified influencers can create campaigns' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Helper: Require role or owner
const requireRoleOrOwner = (roles, ownerCheck) => {
  return async (req, res, next) => {
    try {
      const user = await getUser(req.userId);
      if (!user) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      if (roles.includes(user.role)) {
        req.user = user;
        return next();
      }
      
      if (ownerCheck && await ownerCheck(req, user)) {
        req.user = user;
        return next();
      }
      
      return res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== AUTHENTICATION ====================
// Note: Registration/login handled by Firebase Auth on client
// These endpoints sync user data to Firestore

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    let user = await getUser(req.userId);
    
    // If user doesn't exist in Firestore, create it from Firebase Auth
    if (!user) {
      const firebaseUser = await admin.auth().getUser(req.userId);
      const userData = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: null,
        status: 'active',
        verified: false,
        influencerStatus: 'NOT_APPLIED',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(req.userId).set(userData);
      user = { id: req.userId, ...userData };
    }

    const wallet = await calculateWalletBalance(req.userId);
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status || 'active',
      verified: user.verified || false,
      influencerStatus: user.influencerStatus || 'NOT_APPLIED',
      ...wallet
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/set-role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['clipper', 'influencer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'influencer') {
      const profileSnapshot = await db.collection('influencerProfiles')
        .where('userId', '==', req.userId)
        .limit(1)
        .get();
      
      if (profileSnapshot.empty) {
        return res.status(403).json({ error: 'You must apply to become an influencer first' });
      }
      
      const profile = profileSnapshot.docs[0].data();
      if (profile.status !== 'VERIFIED') {
        return res.status(403).json({ error: 'You must be a verified influencer to use this role' });
      }
    }

    await db.collection('users').doc(req.userId).update({
      role,
      verified: role === 'influencer',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const user = await getUser(req.userId);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CAMPAIGNS ====================

app.get('/api/campaigns', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const marketplace = req.query.marketplace === 'true';
    
    let query = db.collection('campaigns');
    
    if (marketplace) {
      query = query.where('status', '==', 'ACTIVE').where('isPublic', '==', true);
    } else if (activeOnly) {
      query = query.where('status', '==', 'ACTIVE');
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const campaigns = [];
    const now = new Date();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (marketplace) {
        if (data.endDate && data.endDate.toDate() <= now) return;
        if (data.remainingBudget <= 0 && data.autoCloseOnBudgetExhausted) return;
      }
      
      campaigns.push({
        id: doc.id,
        ...data,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
        startDate: toISOString(data.startDate),
        endDate: toISOString(data.endDate)
      });
    });

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const doc = await db.collection('campaigns').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const data = doc.data();
    res.json({
      campaign: {
        id: doc.id,
        ...data,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
        startDate: toISOString(data.startDate),
        endDate: toISOString(data.endDate)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns', verifyToken, requireRoleOrOwner(['admin', 'influencer'], null), requireVerifiedInfluencer(), async (req, res) => {
  try {
    const {
      title, influencerName, description, allowedPlatforms,
      ratePer1kViews, minEligibleViews, maxPayableViewsPerClip,
      totalBudget, contentGuidelines, captionRequirements,
      hashtagRequirements, prohibitedContent, startDate, endDate,
      autoCloseOnBudgetExhausted, isPublic, allowUnlimitedClippers,
      maxClippers, maxClipsPerUser
    } = req.body;

    if (!title || !influencerName || !ratePer1kViews || !minEligibleViews || !totalBudget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!allowedPlatforms || !Array.isArray(allowedPlatforms) || allowedPlatforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform must be selected' });
    }

    const wallet = await calculateWalletBalance(req.userId);
    if (req.user.role === 'influencer' && wallet.availableBalance < totalBudget) {
      return res.status(400).json({ error: 'Insufficient wallet balance. Please top up first.' });
    }

    const campaignData = {
      title,
      influencerName,
      description: description || '',
      allowedPlatforms: allowedPlatforms.map(p => p.toLowerCase()),
      ratePer1kViews: parseFloat(ratePer1kViews),
      minEligibleViews: parseInt(minEligibleViews),
      maxPayableViewsPerClip: maxPayableViewsPerClip ? parseInt(maxPayableViewsPerClip) : null,
      totalBudget: parseFloat(totalBudget),
      reservedBudget: parseFloat(totalBudget),
      paidBudget: 0,
      remainingBudget: parseFloat(totalBudget),
      contentGuidelines: contentGuidelines || '',
      captionRequirements: captionRequirements || '',
      hashtagRequirements: hashtagRequirements || '',
      prohibitedContent: prohibitedContent || '',
      startDate: startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : admin.firestore.FieldValue.serverTimestamp(),
      endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
      autoCloseOnBudgetExhausted: autoCloseOnBudgetExhausted !== false,
      isPublic: isPublic !== false,
      allowUnlimitedClippers: allowUnlimitedClippers !== false,
      maxClippers: allowUnlimitedClippers ? null : (maxClippers ? parseInt(maxClippers) : null),
      maxClipsPerUser: maxClipsPerUser ? parseInt(maxClipsPerUser) : null,
      status: 'DRAFT',
      clippers: 0,
      submissions: 0,
      totalViews: 0,
      participants: [],
      influencerId: req.userId,
      createdBy: req.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('campaigns').add(campaignData);
    
    // Create CAMPAIGN_FUNDING transaction
    await db.collection('transactions').add({
      userId: req.userId,
      type: 'CAMPAIGN_FUNDING',
      amount: -parseFloat(totalBudget),
      campaignId: docRef.id,
      description: `Campaign funding: ${title}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (req.user.role === 'admin') {
      await logAudit(req.userId, 'CREATE_CAMPAIGN', { campaignId: docRef.id, title });
    }

    const campaign = { id: docRef.id, ...campaignData };
    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup additional routes
setupRoutes(app, verifyToken, requireRole, requireRoleOrOwner, requireVerifiedInfluencer);

// Export the Express app as a Firebase Function
export const api = onRequest({ 
  cors: true,
  timeoutSeconds: 540,
  memory: '1GiB'
}, app);
