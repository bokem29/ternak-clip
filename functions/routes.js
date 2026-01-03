// Additional routes for Firebase Functions
// Import this in index.js to keep the main file manageable

import admin from 'firebase-admin';
import { calculateWalletBalance, getUser, logAudit, toISOString } from './helpers.js';

const db = admin.firestore();

// Export route handlers that can be added to the Express app
export const setupRoutes = (app, verifyToken, requireRole, requireRoleOrOwner, requireVerifiedInfluencer) => {
  
  // ==================== WALLET ====================
  
  app.get('/api/wallet', verifyToken, async (req, res) => {
    try {
      const balance = await calculateWalletBalance(req.userId);
      res.json({
        balance: balance.availableBalance,
        availableBalance: balance.availableBalance,
        pendingBalance: balance.pendingBalance,
        lockedBalance: balance.lockedBalance,
        totalEarned: balance.lifetimeEarned,
        lifetimeEarned: balance.lifetimeEarned,
        totalWithdrawn: balance.lifetimeWithdrawn,
        lifetimeWithdrawn: balance.lifetimeWithdrawn
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/wallet/transactions', verifyToken, async (req, res) => {
    try {
      let query = db.collection('transactions').where('userId', '==', req.userId);
      
      if (req.query.type) {
        query = query.where('type', '==', req.query.type);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const transactions = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: toISOString(data.createdAt),
          date: toISOString(data.createdAt)
        });
      });
      
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== SUBMISSIONS ====================
  
  app.get('/api/submissions', verifyToken, async (req, res) => {
    try {
      const user = await getUser(req.userId);
      let query = db.collection('submissions');
      
      if (user.role === 'clipper') {
        query = query.where('clipperId', '==', req.userId);
      } else if (user.role === 'influencer') {
        // Get influencer's campaigns first
        const campaignsSnapshot = await db.collection('campaigns')
          .where('influencerId', '==', req.userId)
          .get();
        const campaignIds = campaignsSnapshot.docs.map(doc => doc.id);
        
        if (campaignIds.length === 0) {
          return res.json({ submissions: [] });
        }
        
        query = query.where('campaignId', 'in', campaignIds);
      }
      
      const snapshot = await query.orderBy('submittedAt', 'desc').get();
      const submissions = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          ...data,
          submittedAt: toISOString(data.submittedAt),
          reviewedAt: toISOString(data.reviewedAt),
          lockUntil: toISOString(data.lockUntil)
        });
      });
      
      res.json({ submissions });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/submissions', verifyToken, async (req, res) => {
    try {
      const {
        platform, videoUrl, campaignId, title, thumbnail,
        views, likes, duration, channelName, channelId,
        uploadDate, isOriginal, note
      } = req.body;

      if (!videoUrl || !campaignId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const selectedPlatform = (platform || 'YOUTUBE').toUpperCase();
      const validPlatforms = ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK'];
      if (!validPlatforms.includes(selectedPlatform)) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      const user = await getUser(req.userId);
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is suspended or blacklisted' });
      }

      const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
      if (!campaignDoc.exists) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaign = campaignDoc.data();
      if (campaign.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Campaign is not active' });
      }

      // Check platform
      if (campaign.allowedPlatforms && !campaign.allowedPlatforms.includes(selectedPlatform.toLowerCase())) {
        return res.status(400).json({ error: `Platform ${selectedPlatform} is not allowed` });
      }

      // Check duplicate URL
      const existingSnapshot = await db.collection('submissions')
        .where('videoUrl', '==', videoUrl)
        .limit(1)
        .get();
      
      if (!existingSnapshot.empty) {
        return res.status(400).json({ error: 'This video URL has already been submitted' });
      }

      // Determine initial status
      let initialStatus = 'SUBMITTED';
      if (selectedPlatform === 'YOUTUBE') {
        initialStatus = 'WAITING_REVIEW';
      }

      const submissionData = {
        clipperId: req.userId,
        campaignId,
        platform: selectedPlatform,
        videoUrl,
        title: title || 'Untitled Clip',
        thumbnail: thumbnail || '',
        views: selectedPlatform === 'YOUTUBE' ? (parseInt(views) || 0) : 0,
        likes: selectedPlatform === 'YOUTUBE' ? (parseInt(likes) || 0) : 0,
        duration: duration || '0:00',
        channelName: channelName || '',
        channelId: channelId || '',
        uploadDate: selectedPlatform !== 'YOUTUBE' ? uploadDate : null,
        isOriginal: selectedPlatform !== 'YOUTUBE' ? isOriginal : true,
        note: note || null,
        status: initialStatus,
        flagged: false,
        flagReason: null,
        reward: 0,
        potentialReward: 0,
        eligibleViews: 0,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        lockUntil: selectedPlatform !== 'YOUTUBE' 
          ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000))
          : null,
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      };

      const docRef = await db.collection('submissions').add(submissionData);
      
      // Update campaign stats
      await db.collection('campaigns').doc(campaignId).update({
        submissions: admin.firestore.FieldValue.increment(1),
        totalViews: admin.firestore.FieldValue.increment(submissionData.views)
      });

      res.status(201).json({ submission: { id: docRef.id, ...submissionData } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== INFLUENCER ====================
  
  app.post('/api/influencer/apply', verifyToken, async (req, res) => {
    try {
      const {
        influencerName, influencerType, platforms, primaryPlatform,
        channelUrl, followerCount, reason, estimatedBudget,
        contactName, contactMethod, contactDetail,
        analyticsScreenshot, mediaKitUrl
      } = req.body;

      if (!influencerName || !platforms || !primaryPlatform || !channelUrl || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if profile already exists
      const existingSnapshot = await db.collection('influencerProfiles')
        .where('userId', '==', req.userId)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        const existing = existingSnapshot.docs[0].data();
        if (existing.status === 'PENDING_REVIEW') {
          return res.status(400).json({ error: 'Application is already pending review' });
        }
        if (existing.status === 'VERIFIED') {
          return res.status(400).json({ error: 'You are already a verified influencer' });
        }
      }

      const profileData = {
        userId: req.userId,
        influencerName,
        influencerType: influencerType || 'PERSONAL',
        platforms: platforms || [],
        primaryPlatform,
        channelUrl,
        followerCount: parseInt(followerCount) || 0,
        reason,
        estimatedBudget: estimatedBudget || 'UNDER_1M',
        contactName: contactName || '',
        contactMethod: contactMethod || 'EMAIL',
        contactDetail: contactDetail || '',
        analyticsScreenshot: analyticsScreenshot || null,
        mediaKitUrl: mediaKitUrl || null,
        status: 'PENDING_REVIEW',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('influencerProfiles').add(profileData);

      // Update user
      await db.collection('users').doc(req.userId).update({
        influencerStatus: 'PENDING_REVIEW',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(201).json({ profile: { id: docRef.id, ...profileData } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/influencer/status', verifyToken, async (req, res) => {
    try {
      const snapshot = await db.collection('influencerProfiles')
        .where('userId', '==', req.userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.json({ status: 'NOT_APPLIED' });
      }

      const profile = snapshot.docs[0].data();
      res.json({ status: profile.status });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================== ADMIN ====================
  
  app.get('/api/admin/influencers', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
      let query = db.collection('influencerProfiles');
      
      if (req.query.status) {
        query = query.where('status', '==', req.query.status);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const profiles = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        profiles.push({
          id: doc.id,
          ...data,
          createdAt: toISOString(data.createdAt),
          updatedAt: toISOString(data.updatedAt)
        });
      });
      
      res.json({ profiles });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/admin/influencers/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
      const doc = await db.collection('influencerProfiles').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const profile = doc.data();
      
      await db.collection('influencerProfiles').doc(req.params.id).update({
        status: 'VERIFIED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('users').doc(profile.userId).update({
        verified: true,
        influencerStatus: 'VERIFIED',
        role: 'influencer',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await logAudit(req.userId, 'APPROVE_INFLUENCER', { profileId: req.params.id });

      res.json({ message: 'Influencer approved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/admin/influencers/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const doc = await db.collection('influencerProfiles').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const profile = doc.data();
      
      await db.collection('influencerProfiles').doc(req.params.id).update({
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('users').doc(profile.userId).update({
        influencerStatus: 'REJECTED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await logAudit(req.userId, 'REJECT_INFLUENCER', { profileId: req.params.id, reason });

      res.json({ message: 'Influencer application rejected' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add more routes as needed...
};


