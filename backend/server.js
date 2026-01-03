import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

dotenv.config();

// Initialize Firebase Admin SDK (Optional for local, but kept for compatibility)
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ternak-klip',
    });
  }
} catch (error) {
  console.warn('Firebase Admin initialization warning:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to save data
const saveData = () => {
  const data = {
    users,
    campaigns,
    submissions,
    submissionProofs,
    transactions,
    withdrawRequests,
    paymentMethods,
    auditLogs,
    influencerProfiles,
    campaignClipperRelations,
    trustScores,
    webBalances,
    webBalanceLedger,
    withdrawalStatusHistory,
    withdrawalAdminLogs
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data saved to storage');
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Helper to load data
const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

      // Clear and populate arrays
      users.length = 0;
      users.push(...(data.users || []));

      campaigns.length = 0;
      campaigns.push(...(data.campaigns || []));

      submissions.length = 0;
      submissions.push(...(data.submissions || []));

      submissionProofs.length = 0;
      submissionProofs.push(...(data.submissionProofs || []));

      transactions.length = 0;
      transactions.push(...(data.transactions || []));

      withdrawRequests.length = 0;
      withdrawRequests.push(...(data.withdrawRequests || []));

      paymentMethods.length = 0;
      paymentMethods.push(...(data.paymentMethods || []));

      auditLogs.length = 0;
      auditLogs.push(...(data.auditLogs || []));

      influencerProfiles.length = 0;
      influencerProfiles.push(...(data.influencerProfiles || []));

      campaignClipperRelations.length = 0;
      campaignClipperRelations.push(...(data.campaignClipperRelations || []));

      trustScores.length = 0;
      trustScores.push(...(data.trustScores || []));

      webBalances.length = 0;
      webBalances.push(...(data.webBalances || []));

      webBalanceLedger.length = 0;
      webBalanceLedger.push(...(data.webBalanceLedger || []));

      withdrawalStatusHistory.length = 0;
      withdrawalStatusHistory.push(...(data.withdrawalStatusHistory || []));

      withdrawalAdminLogs.length = 0;
      withdrawalAdminLogs.push(...(data.withdrawalAdminLogs || []));

      // OPTIMIZATION: Rebuild indexes after loading data
      rebuildIndexes();

      console.log('Data loaded from storage');
      return true;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return false;
};

// In-memory data stores (loaded from file or initialized)
const users = [];
const campaigns = [];
const submissions = [];
const submissionProofs = [];
const transactions = [];
const withdrawRequests = [];
const paymentMethods = [];
const auditLogs = [];
const influencerProfiles = [];
// NEW: Campaign-Clipper Relationships
const campaignClipperRelations = [];
// NEW: Trust Scores
const trustScores = [];
// NEW: Web Balance (separate from wallet)
const webBalances = [];
// NEW: Web Balance Ledger
const webBalanceLedger = [];
// NEW: Withdrawal Status History (immutable)
const withdrawalStatusHistory = [];
// NEW: Withdrawal Admin Action Logs (immutable)
const withdrawalAdminLogs = [];

// OPTIMIZATION: Index Maps for O(1) lookups instead of O(n) array.find()
// These maps are maintained alongside arrays for fast lookups
const usersById = new Map(); // userId -> user
const usersByFirebaseUid = new Map(); // firebaseUid -> user
const campaignsById = new Map(); // campaignId -> campaign
const submissionsById = new Map(); // submissionId -> submission
const submissionsByUserId = new Map(); // userId -> Set<submissionId>
const submissionsByCampaignId = new Map(); // campaignId -> Set<submissionId>
const transactionsByUserId = new Map(); // userId -> Array<transaction>
const walletBalanceCache = new Map(); // userId -> { balance, timestamp }
const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

// OPTIMIZATION: Helper to add transaction and maintain indexes
const addTransaction = (transaction) => {
  transactions.push(transaction);
  // Update transaction index
  if (!transactionsByUserId.has(transaction.userId)) {
    transactionsByUserId.set(transaction.userId, []);
  }
  transactionsByUserId.get(transaction.userId).push(transaction);
  // Invalidate wallet cache for this user
  walletBalanceCache.delete(`wallet_${transaction.userId}`);
};

// Helper to rebuild indexes when data changes
const rebuildIndexes = () => {
  // Clear existing indexes
  usersById.clear();
  usersByFirebaseUid.clear();
  campaignsById.clear();
  submissionsById.clear();
  submissionsByUserId.clear();
  submissionsByCampaignId.clear();
  transactionsByUserId.clear();

  // Rebuild indexes
  users.forEach(user => {
    usersById.set(user.id, user);
    if (user.firebaseUid) {
      usersByFirebaseUid.set(user.firebaseUid, user);
    }
  });

  campaigns.forEach(campaign => {
    campaignsById.set(campaign.id, campaign);
  });

  submissions.forEach(submission => {
    submissionsById.set(submission.id, submission);

    if (!submissionsByUserId.has(submission.userId)) {
      submissionsByUserId.set(submission.userId, new Set());
    }
    submissionsByUserId.get(submission.userId).add(submission.id);

    if (!submissionsByCampaignId.has(submission.campaignId)) {
      submissionsByCampaignId.set(submission.campaignId, new Set());
    }
    submissionsByCampaignId.get(submission.campaignId).add(submission.id);
  });

  transactions.forEach(transaction => {
    if (!transactionsByUserId.has(transaction.userId)) {
      transactionsByUserId.set(transaction.userId, []);
    }
    transactionsByUserId.get(transaction.userId).push(transaction);
  });

  // Invalidate wallet cache when transactions change
  walletBalanceCache.clear();
};

// Initialize indexes on startup
rebuildIndexes();

// ==================== NEW SYSTEM HELPERS ====================

// [ENGINE_INTEGRATION_POINT] - Trust Score Calculation
// TODO: Replace this function with call to external Trust Score Engine
// Expected interface: calculate(clipperId) -> { score, tier, factors, history }
// Current implementation uses dummy data/logic
const calculateTrustScore = (clipperId) => {
  // Get existing trust score or create new one
  let trustScore = trustScores.find(ts => ts.clipperId === clipperId);

  if (!trustScore) {
    trustScore = {
      id: `trust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clipperId,
      score: 50, // Base score
      tier: 'MEDIUM',
      approvedSubmissions: 0,
      totalSubmissions: 0,
      autoFlags: 0,
      manualFlags: 0,
      consistencyScore: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
      calculatedAt: new Date().toISOString()
    };
    trustScores.push(trustScore);
  }

  // Get clipper's submissions
  const clipperSubmissions = submissions.filter(s => s.userId === clipperId || s.clipperId === clipperId);
  const approvedSubmissions = clipperSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length;
  const totalSubmissions = clipperSubmissions.length;
  const autoFlags = clipperSubmissions.filter(s => s.fraudFlags?.autoFlags?.length > 0).length;
  const manualFlags = clipperSubmissions.filter(s => s.fraudFlags?.manualFlags?.length > 0).length;

  // Calculate consistency score (dummy: based on submission pattern)
  const consistencyScore = totalSubmissions > 0 ? Math.min(100, (approvedSubmissions / totalSubmissions) * 100) : 0;

  // Calculate trust score: Base 50 + (approved * 5) + (consistency * 0.1) - (auto flags * 10) - (manual flags * 20)
  const newScore = Math.max(0, Math.min(100,
    50 +
    (approvedSubmissions * 5) +
    (consistencyScore * 0.1) -
    (autoFlags * 10) -
    (manualFlags * 20)
  ));

  // Determine tier
  let tier = 'LOW';
  if (newScore >= 86) tier = 'VERIFIED';
  else if (newScore >= 61) tier = 'HIGH';
  else if (newScore >= 31) tier = 'MEDIUM';

  // Update trust score
  trustScore.score = newScore;
  trustScore.tier = tier;
  trustScore.approvedSubmissions = approvedSubmissions;
  trustScore.totalSubmissions = totalSubmissions;
  trustScore.autoFlags = autoFlags;
  trustScore.manualFlags = manualFlags;
  trustScore.consistencyScore = consistencyScore;
  trustScore.lastUpdated = new Date().toISOString();
  trustScore.calculatedAt = new Date().toISOString();

  // Add to history
  trustScore.history.push({
    score: newScore,
    reason: `Recalculated: ${approvedSubmissions} approved, ${autoFlags} auto flags, ${manualFlags} manual flags`,
    timestamp: new Date().toISOString()
  });

  // Keep only last 50 history entries
  if (trustScore.history.length > 50) {
    trustScore.history = trustScore.history.slice(-50);
  }

  return trustScore;
};

// Get or initialize trust score
const getTrustScore = (clipperId) => {
  let trustScore = trustScores.find(ts => ts.clipperId === clipperId);
  if (!trustScore) {
    trustScore = calculateTrustScore(clipperId);
  }
  return trustScore;
};

// [ENGINE_INTEGRATION_POINT] - Fraud Detection
// TODO: Replace this function with call to external Fraud Detection Engine
// Expected interface: analyze(submission) -> { autoFlags, manualFlags, trustScoreImpact }
// Current implementation uses dummy data/logic
const detectFraud = (submission) => {
  const flags = {
    autoFlags: [],
    manualFlags: [],
    trustScoreImpact: 0
  };

  // Dummy fraud detection logic
  // 1. View/Like Ratio Anomaly
  if (submission.views > 0 && submission.likes > 0) {
    const likeRatio = submission.likes / submission.views;
    if (likeRatio < 0.001) { // Less than 0.1% like rate (suspicious)
      flags.autoFlags.push({
        type: 'VIEW_LIKE_RATIO_ANOMALY',
        reason: `Unusually low like ratio: ${(likeRatio * 100).toFixed(2)}%`,
        detectedAt: new Date().toISOString()
      });
      flags.trustScoreImpact -= 5;
    }
  }

  // 2. Sudden Engagement Spike (dummy: if views > 100k and uploaded recently)
  if (submission.views > 100000 && submission.uploadDate) {
    const uploadTime = new Date(submission.uploadDate);
    const now = new Date();
    const hoursSinceUpload = (now - uploadTime) / (1000 * 60 * 60);
    if (hoursSinceUpload < 24) { // 100k views in less than 24 hours
      flags.autoFlags.push({
        type: 'SUDDEN_ENGAGEMENT_SPIKE',
        reason: `Unusual growth: ${submission.views.toLocaleString()} views in ${hoursSinceUpload.toFixed(1)} hours`,
        detectedAt: new Date().toISOString()
      });
      flags.trustScoreImpact -= 10;
    }
  }

  // 3. Comment Spam Pattern (dummy: if comments > likes * 2)
  if (submission.comments && submission.likes) {
    if (submission.comments > submission.likes * 2) {
      flags.autoFlags.push({
        type: 'COMMENT_SPAM_PATTERN',
        reason: `Suspicious comment pattern: ${submission.comments} comments vs ${submission.likes} likes`,
        detectedAt: new Date().toISOString()
      });
      flags.trustScoreImpact -= 8;
    }
  }

  // 4. Velocity Mismatch (dummy: if submitted too soon after upload)
  if (submission.uploadDate && submission.submittedAt) {
    const uploadTime = new Date(submission.uploadDate);
    const submitTime = new Date(submission.submittedAt);
    const hoursBetween = (submitTime - uploadTime) / (1000 * 60 * 60);
    if (hoursBetween < 1) { // Submitted within 1 hour of upload
      flags.autoFlags.push({
        type: 'VELOCITY_MISMATCH',
        reason: `Submitted too soon after upload: ${hoursBetween.toFixed(1)} hours`,
        detectedAt: new Date().toISOString()
      });
      flags.trustScoreImpact -= 3;
    }
  }

  return flags;
};

// Web Balance Management
const getWebBalance = (userId) => {
  let balance = webBalances.find(wb => wb.userId === userId);
  if (!balance) {
    balance = {
      userId,
      balance: 0,
      lastUpdated: new Date().toISOString()
    };
    webBalances.push(balance);
  }
  return balance;
};

const creditWebBalance = (userId, amount, source, sourceId, campaignId, description) => {
  const balance = getWebBalance(userId);
  balance.balance = (balance.balance || 0) + amount;
  balance.lastUpdated = new Date().toISOString();

  // Add ledger entry
  const ledgerEntry = {
    id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'CREDIT',
    amount,
    source,
    sourceId,
    campaignId,
    description,
    timestamp: new Date().toISOString(),
    immutable: true
  };
  webBalanceLedger.push(ledgerEntry);

  return balance;
};

const debitWebBalance = (userId, amount, source, sourceId, description) => {
  const balance = getWebBalance(userId);
  if ((balance.balance || 0) < amount) {
    throw new Error('Insufficient web balance');
  }
  balance.balance = (balance.balance || 0) - amount;
  balance.lastUpdated = new Date().toISOString();

  // Add ledger entry
  const ledgerEntry = {
    id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'DEBIT',
    amount,
    source,
    sourceId,
    campaignId: null,
    description,
    timestamp: new Date().toISOString(),
    immutable: true
  };
  webBalanceLedger.push(ledgerEntry);

  return balance;
};

// Campaign-Clipper Relationship Management
const joinCampaign = (campaignId, clipperId) => {
  // Check if already joined
  const existing = campaignClipperRelations.find(
    r => r.campaignId === campaignId && r.clipperId === clipperId
  );
  if (existing) {
    return existing;
  }

  const relation = {
    id: `relation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    clipperId,
    joinedAt: new Date().toISOString(),
    status: 'ACTIVE',
    submissionCount: 0,
    lastSubmissionAt: null
  };

  campaignClipperRelations.push(relation);
  return relation;
};

const getCampaignClipperRelation = (campaignId, clipperId) => {
  return campaignClipperRelations.find(
    r => r.campaignId === campaignId && r.clipperId === clipperId
  );
};

// Submission State Machine
const transitionSubmissionStatus = (submission, newStatus, reason = null, reviewedBy = null) => {
  const validTransitions = {
    'DRAFT': ['SUBMITTED'],
    'SUBMITTED': ['AUTO_CHECKING'],
    'AUTO_CHECKING': ['APPROVED', 'FLAGGED_AUTO', 'UNDER_ADMIN_REVIEW'],
    'FLAGGED_AUTO': ['UNDER_ADMIN_REVIEW'],
    'UNDER_ADMIN_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['PAID'],
    'REJECTED': [], // Terminal
    'PAID': [] // Terminal
  };

  const currentStatus = submission.status;
  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid state transition from ${currentStatus} to ${newStatus}`);
  }

  // Initialize status history if not exists
  if (!submission.statusHistory) {
    submission.statusHistory = [{
      status: currentStatus,
      timestamp: submission.submittedAt || new Date().toISOString(),
      reason: null
    }];
  }

  // Add new status to history
  submission.statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    reason
  });

  // Update submission
  submission.status = newStatus;
  if (reviewedBy) {
    submission.reviewedBy = reviewedBy;
    submission.reviewedAt = new Date().toISOString();
  }

  return submission;
};

// --- SEED DATA FUNCTION ---
const seedData = () => {
  // Clear existing data to ensure a fresh state for seeding
  users.length = 0;
  campaigns.length = 0;
  submissions.length = 0;
  transactions.length = 0;
  withdrawRequests.length = 0;
  paymentMethods.length = 0;
  influencerProfiles.length = 0;

  console.log('Seeding dummy data...');
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;

  // 1. Users
  users.push(
    {
      id: 'admin_1',
      firebaseUid: 'firebase_admin_uid',
      email: 'admin@clipflow.com',
      name: 'Super Admin',
      password: 'password123',
      role: 'admin',
      balance: 0,
      pendingBalance: 0,
      status: 'active',
      verified: true,
      createdAt: new Date(now.getTime() - 60 * day).toISOString()
    },
    {
      id: 'inf_1',
      firebaseUid: 'firebase_inf_uid',
      email: 'influencer@clipflow.com',
      name: 'Gamer Pro',
      password: 'password123',
      role: 'influencer',
      balance: 0,
      pendingBalance: 0,
      budget: 25000000, // Rp 25.000.000
      status: 'verified',
      verified: true,
      influencerStatus: 'VERIFIED',
      createdAt: new Date(now.getTime() - 30 * day).toISOString()
    },
    {
      id: 'inf_2',
      email: 'beauty_vlog@test.com',
      name: 'Beauty Grace',
      password: 'password123',
      role: 'influencer',
      balance: 0,
      pendingBalance: 0,
      budget: 5000000,
      status: 'verified',
      verified: true,
      influencerStatus: 'VERIFIED',
      createdAt: new Date(now.getTime() - 15 * day).toISOString()
    },
    {
      id: 'clip_1',
      firebaseUid: 'firebase_clip_uid',
      email: 'clipper@test.com',
      name: 'Elite Clipper',
      password: 'password123',
      role: 'clipper',
      balance: 2450000, // Rp 2.450.000
      pendingBalance: 1250000,
      budget: 0,
      status: 'active',
      verified: true,
      createdAt: new Date(now.getTime() - 45 * day).toISOString()
    },
    {
      id: 'clip_2',
      email: 'newbie@test.com',
      name: 'Newbie Clipper',
      password: 'password123',
      role: 'clipper',
      balance: 75000,
      pendingBalance: 25000,
      budget: 0,
      status: 'active',
      verified: false,
      createdAt: new Date(now.getTime() - 5 * day).toISOString()
    },
    {
      id: 'clip_3',
      email: 'bad_actor@test.com',
      name: 'Suspended User',
      password: 'password123',
      role: 'clipper',
      balance: 500000,
      pendingBalance: 0,
      budget: 0,
      status: 'suspended',
      verified: false,
      createdAt: new Date(now.getTime() - 20 * day).toISOString()
    }
  );

  // 2. Campaigns
  campaigns.push(
    {
      id: 'camp_1',
      title: 'MLBB Savage Compilation - Dec 2025',
      influencerName: 'Gamer Pro',
      description: 'Cari klip savage terkeren dari stream saya minggu ini. Harus ada watermark GamerPro!',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',
      allowedPlatforms: ['tiktok', 'instagram', 'youtube'],
      ratePer1kViews: 12500,
      minEligibleViews: 1000,
      maxPayableViewsPerClip: 100000,
      totalBudget: 10000000,
      remainingBudget: 8500000,
      paidBudget: 1500000,
      reservedBudget: 0,
      startDate: new Date(now.getTime() - 20 * day).toISOString(),
      endDate: new Date(now.getTime() + 10 * day).toISOString(),
      status: 'ACTIVE',
      isPublic: true,
      allowUnlimitedClippers: true,
      clippers: 45,
      submissions: 120,
      totalViews: 850000,
      createdBy: 'inf_1',
      createdAt: new Date(now.getTime() - 21 * day).toISOString()
    },
    {
      id: 'camp_2',
      title: 'Skincare Routine Highlights',
      influencerName: 'Beauty Grace',
      description: 'Potong bagian terbaik dari video skincare routine saya jadi TikTok pendek.',
      thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1000',
      allowedPlatforms: ['tiktok'],
      ratePer1kViews: 20000,
      minEligibleViews: 2000,
      totalBudget: 5000000,
      remainingBudget: 5000000,
      paidBudget: 0,
      reservedBudget: 0,
      startDate: new Date(now.getTime() - 5 * day).toISOString(),
      endDate: new Date(now.getTime() + 25 * day).toISOString(),
      status: 'ACTIVE',
      isPublic: true,
      allowUnlimitedClippers: false,
      maxClippers: 10,
      clippers: 3,
      submissions: 5,
      totalViews: 12000,
      createdBy: 'inf_2',
      createdAt: new Date(now.getTime() - 6 * day).toISOString()
    },
    {
      id: 'camp_3',
      title: 'Funny Fail Moments - Exclusive',
      influencerName: 'Gamer Pro',
      description: 'Private campaign for selected clippers. Don\'t share outside!',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000',
      allowedPlatforms: ['tiktok', 'youtube'],
      ratePer1kViews: 15000,
      minEligibleViews: 500,
      totalBudget: 2000000,
      remainingBudget: 1500000,
      paidBudget: 500000,
      status: 'ACTIVE',
      isPublic: false,
      participants: ['clip_1', 'clip_2'],
      createdBy: 'inf_1',
      createdAt: new Date(now.getTime() - 10 * day).toISOString()
    }
  );

  // 3. Submissions
  submissions.push(
    {
      id: 'sub_1',
      userId: 'clip_1',
      campaignId: 'camp_1',
      title: 'Lancelot Fast Hand Skin Collector',
      platform: 'TIKTOK',
      contentUrl: 'https://tiktok.com/@elite_clippers/video/1',
      status: 'approved',
      views: 75000,
      reward: 937500, // 75 * 12500
      submittedAt: new Date(now.getTime() - 15 * day).toISOString(),
      reviewedAt: new Date(now.getTime() - 14 * day).toISOString(),
      reviewedBy: 'admin_1'
    },
    {
      id: 'sub_2',
      userId: 'clip_1',
      campaignId: 'camp_1',
      title: 'Fanny Rope 100% Precision',
      platform: 'TIKTOK',
      contentUrl: 'https://tiktok.com/@elite_clippers/video/2',
      status: 'pending',
      views: 12000,
      submittedAt: new Date(now.getTime() - 1 * day).toISOString()
    },
    {
      id: 'sub_3',
      userId: 'clip_2',
      campaignId: 'camp_1',
      title: 'Funny Gusion Blink',
      platform: 'INSTAGRAM',
      contentUrl: 'https://instagram.com/reel/1',
      status: 'rejected',
      rejectionReason: 'Video aspect ratio must be 9:16',
      views: 500,
      submittedAt: new Date(now.getTime() - 4 * day).toISOString(),
      reviewedAt: new Date(now.getTime() - 3 * day).toISOString(),
      reviewedBy: 'admin_1'
    }
  );

  // 4. Payment Methods
  paymentMethods.push(
    {
      id: 'pm_1',
      userId: 'clip_1',
      type: 'BANK',
      label: 'Main Bank (BCA)',
      bankName: 'BCA',
      accountNumber: '8830112233',
      accountName: 'Elite Clipper Store',
      isDefault: true,
      createdAt: new Date(now.getTime() - 40 * day).toISOString()
    },
    {
      id: 'pm_2',
      userId: 'clip_1',
      type: 'EWALLET',
      label: 'GOPAY',
      ewalletType: 'GOPAY',
      ewalletNumber: '08123456789',
      ewalletName: 'Elite Clipper Store',
      isDefault: false,
      createdAt: new Date(now.getTime() - 30 * day).toISOString()
    }
  );

  // 5. Withdraw Requests
  withdrawRequests.push(
    {
      id: 'withdraw_1',
      userId: 'clip_1',
      amount: 1000000,
      paymentMethodId: 'pm_1',
      paymentMethod: paymentMethods[0],
      status: 'PENDING',
      createdAt: new Date(now.getTime() - 12 * hour).toISOString()
    },
    {
      id: 'withdraw_2',
      userId: 'clip_1',
      amount: 500000,
      paymentMethodId: 'pm_1',
      status: 'APPROVED',
      createdAt: new Date(now.getTime() - 5 * day).toISOString(),
      reviewedAt: new Date(now.getTime() - 4 * day).toISOString(),
      reviewedBy: 'admin_1'
    },
    {
      id: 'withdraw_3',
      userId: 'clip_3',
      amount: 250000,
      paymentMethodId: 'pm_1',
      status: 'REJECTED',
      rejectionReason: 'Account suspended for policy violation',
      createdAt: new Date(now.getTime() - 10 * day).toISOString(),
      reviewedAt: new Date(now.getTime() - 9 * day).toISOString(),
      reviewedBy: 'admin_1'
    }
  );

  // 6. Transactions
  transactions.push(
    // Earnings
    {
      id: 'tx_earning_1',
      userId: 'clip_1',
      type: 'SUBMISSION_REWARD_APPROVED',
      amount: 937500,
      description: 'Reward for: Lancelot Fast Hand Skin Collector',
      status: 'completed',
      date: new Date(now.getTime() - 14 * day).toISOString()
    },
    // Withdrawals
    {
      id: 'tx_withdraw_1',
      userId: 'clip_1',
      type: 'WITHDRAW_REQUEST',
      amount: -1000000,
      description: 'Withdrawal request to Main Bank (BCA)',
      status: 'PENDING',
      date: new Date(now.getTime() - 12 * hour).toISOString()
    },
    {
      id: 'tx_withdraw_2',
      userId: 'clip_1',
      type: 'WITHDRAW_APPROVED',
      amount: -500000,
      description: 'Withdrawal approved',
      status: 'completed',
      date: new Date(now.getTime() - 4 * day).toISOString()
    }
  );

  // 7. Influencer Profiles (for review)
  influencerProfiles.push({
    id: 'prof_new',
    userId: 'inf_2',
    influencerName: 'Beauty Grace',
    socialPlatform: 'INSTAGRAM',
    socialHandle: '@beauty_grace',
    followers: 550000,
    niche: 'Lifestyle & Beauty',
    status: 'VERIFIED',
    submittedAt: new Date(now.getTime() - 16 * day).toISOString(),
    reviewedAt: new Date(now.getTime() - 15 * day).toISOString()
  });

  console.log(`Seeded: ${users.length} users, ${campaigns.length} campaigns, ${submissions.length} submissions, ${transactions.length} transactions`);

  // Save seeded data
  saveData();
};
// Auto-seed on start (DISABLED - using db.json instead)
// seedData();

// Simple JWT-like token system (in production, use proper JWT library)
let tokenCounter = 0;
const tokens = new Map(); // token -> userId

// Helper functions
const generateToken = (userId) => {
  const token = `token_${++tokenCounter}_${Date.now()}`;
  tokens.set(token, userId);
  return token;
};

// Helper to decode JWT without verification (for local dev only)
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
};

// Verify token - supports both Firebase ID tokens and backend tokens
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);

  // First, try Firebase token verification with Admin SDK
  let firebaseUid = null;
  let firebaseEmail = null;
  let firebaseName = null;

  try {
    if (admin.apps.length > 0) {
      // If Firebase Admin is initialized, verify token properly
      const decodedToken = await admin.auth().verifyIdToken(token);
      firebaseUid = decodedToken.uid;
      firebaseEmail = decodedToken.email;
      firebaseName = decodedToken.name;
    } else {
      // For local dev without Admin SDK, decode JWT without verification
      // WARNING: This is not secure and should only be used for local development
      const decoded = decodeJWT(token);
      if (decoded && decoded.user_id) {
        firebaseUid = decoded.user_id;
        firebaseEmail = decoded.email;
        firebaseName = decoded.name;
      }
    }
  } catch (firebaseError) {
    // If Firebase verification fails, try to decode anyway (local dev fallback)
    const decoded = decodeJWT(token);
    if (decoded && decoded.user_id) {
      firebaseUid = decoded.user_id;
      firebaseEmail = decoded.email;
      firebaseName = decoded.name;
    }
  }

  // If we have a Firebase UID, use it
  if (firebaseUid) {
    // OPTIMIZATION: Use Map lookup instead of array.find() - O(1) instead of O(n)
    let user = usersByFirebaseUid.get(firebaseUid);

    if (!user) {
      // Check if this is admin email - auto-assign admin role
      const isAdminEmail = firebaseEmail === 'admin@clipflow.com';
      const isInfluencerEmail = firebaseEmail === 'influencer@clipflow.com';

      // Create new user in backend storage
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        firebaseUid: firebaseUid,
        email: firebaseEmail || '',
        name: firebaseName || firebaseEmail?.split('@')[0] || 'User',
        password: '', // No password needed for Firebase auth
        role: isAdminEmail ? 'admin' : (isInfluencerEmail ? 'influencer' : null), // Auto-assign role for default accounts
        balance: 0,
        pendingBalance: 0,
        budget: isInfluencerEmail ? 10000 : 0, // Give influencer starting budget
        status: isAdminEmail ? 'active' : (isInfluencerEmail ? 'verified' : 'active'),
        verified: isAdminEmail || isInfluencerEmail, // Auto-verify default accounts
        influencerStatus: isInfluencerEmail ? 'VERIFIED' : 'NOT_APPLIED',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      // OPTIMIZATION: Update indexes when adding new user
      usersById.set(user.id, user);
      if (user.firebaseUid) {
        usersByFirebaseUid.set(user.firebaseUid, user);
      }
      console.log('Created new user from Firebase:', user.email, 'Role:', user.role);
    } else {
      // If user exists, check if they should be admin/influencer based on email
      // This handles the case where user was created before this fix
      if (user.email === 'admin@clipflow.com' && user.role !== 'admin') {
        user.role = 'admin';
        user.status = 'active';
        console.log('Updated user to admin:', user.email);
      } else if (user.email === 'influencer@clipflow.com' && user.role !== 'influencer') {
        user.role = 'influencer';
        user.verified = true;
        user.status = 'verified';
        user.influencerStatus = 'VERIFIED';
        if (!user.budget) user.budget = 10000;
        console.log('Updated user to influencer:', user.email);
      }

      // Ensure essential fields exist for all users
      if (user.balance === undefined) user.balance = 0;
      if (user.pendingBalance === undefined) user.pendingBalance = 0;
      if (!user.status) user.status = 'active';
    }

    req.userId = user.id;
    req.firebaseUid = firebaseUid;
    return next();
  }

  // Fallback to backend token system (for backward compatibility)
  const userId = tokens.get(token);
  if (userId) {
    req.userId = userId;
    return next();
  }

  // Both failed
  return res.status(401).json({ error: 'Invalid token' });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);

    if (!user) {
      console.log('requireRole: User not found', { userId: req.userId });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User account not found',
        userId: req.userId
      });
    }

    if (!roles.includes(user.role)) {
      console.log('requireRole: Role mismatch', {
        userId: req.userId,
        userRole: user.role,
        requiredRoles: roles
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires one of the following roles: ${roles.join(', ')}. Your role: ${user.role || 'none'}`,
        userRole: user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};

// Require verified influencer for campaign creation
const requireVerifiedInfluencer = () => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (user.role === 'influencer' && !user.verified) {
      return res.status(403).json({ error: 'Only verified influencers can create campaigns' });
    }
    next();
  };
};

// Require specific influencer status (e.g., 'VERIFIED')
const requireInfluencerStatus = (requiredStatus) => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden: User not found' });
    }

    if (user.role !== 'influencer') {
      return res.status(403).json({
        error: 'Forbidden: This endpoint is for influencers only',
        userRole: user.role
      });
    }

    const influencerStatus = user.influencerStatus || 'NOT_APPLIED';

    if (requiredStatus === 'VERIFIED' && influencerStatus !== 'VERIFIED') {
      return res.status(403).json({
        error: 'Your influencer account must be verified to access this feature',
        currentStatus: influencerStatus,
        message: influencerStatus === 'PENDING_REVIEW'
          ? 'Your application is pending admin review'
          : 'Please complete influencer onboarding first'
      });
    }

    next();
  };
};

// Block clippers from influencer routes
const blockClippersFromInfluencerRoutes = () => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (user.role === 'clipper') {
      // Log security event
      logAudit(user.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        attemptedRoute: req.path,
        userRole: 'clipper',
        targetRole: 'influencer',
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Access Denied',
        message: 'Clippers cannot access influencer features. This incident has been logged.',
        userRole: 'clipper'
      });
    }

    next();
  };
};

// Block influencers from clipper routes
const blockInfluencersFromClipperRoutes = () => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (user.role === 'influencer') {
      // Log security event
      logAudit(user.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        attemptedRoute: req.path,
        userRole: 'influencer',
        targetRole: 'clipper',
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Access Denied',
        message: 'Influencers cannot submit clips or access clipper features. This incident has been logged.',
        userRole: 'influencer'
      });
    }

    next();
  };
};


const requireRoleOrOwner = (roles, ownerCheck) => {
  return (req, res, next) => {
    // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
    const user = usersById.get(req.userId);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if user has required role
    if (roles.includes(user.role)) {
      return next();
    }

    // Check if user is owner (for influencer editing their own campaigns)
    if (ownerCheck && ownerCheck(req, user)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden' });
  };
};

// Audit log helper
const logAudit = (adminId, action, details) => {
  auditLogs.push({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    adminId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== AUTHENTICATION ====================

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // OPTIMIZATION: Check email uniqueness more efficiently
  // Note: For production, consider adding usersByEmail index
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password, // In production, hash this!
    name,
    role: null, // No role initially - user must choose
    balance: 0,
    pendingBalance: 0,
    budget: 0, // For influencer: campaign budget
    status: 'active', // active, suspended, blacklisted, pending, verified
    verified: false, // For influencers: true if verified
    influencerStatus: 'NOT_APPLIED', // NOT_APPLIED, PENDING_REVIEW, VERIFIED, REJECTED
    createdAt: new Date().toISOString()
  };

  users.push(user);
  // OPTIMIZATION: Update indexes when adding new user
  usersById.set(user.id, user);
  if (user.firebaseUid) {
    usersByFirebaseUid.set(user.firebaseUid, user);
  }
  saveData();
  const token = generateToken(user.id);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  // OPTIMIZATION: For login, we still need to search by email (could add email index)
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is suspended or blacklisted' });
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user has Firebase UID and Admin SDK is available, try to get latest info
    // SKIP for dummy users (starting with firebase_) to avoid API errors
    if (user.firebaseUid && !user.firebaseUid.startsWith('firebase_') &&
      typeof admin !== 'undefined' && admin.apps && admin.apps.length > 0) {
      try {
        const firebaseUser = await admin.auth().getUser(user.firebaseUid);
        // Update email if changed in Firebase
        if (firebaseUser.email && firebaseUser.email !== user.email) {
          user.email = firebaseUser.email;
        }
        if (firebaseUser.displayName && firebaseUser.displayName !== user.name) {
          user.name = firebaseUser.displayName;
        }
      } catch (error) {
        // If Firebase user not found, continue with backend user data
        // Only log warning if it's not a "not found" error
        if (error.code !== 'auth/user-not-found') {
          console.warn('Firebase sync failed:', error.message);
        }
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      balance: user.balance,
      pendingBalance: user.pendingBalance,
      budget: user.budget || 0,
      status: user.status,
      verified: user.verified || false,
      influencerStatus: user.influencerStatus || 'NOT_APPLIED'
    });
  } catch (err) {
    console.error('Critical Error in /api/auth/me:', err);
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
});

// ==================== CAMPAIGNS ====================

// Get all campaigns (marketplace - only public ACTIVE campaigns)
// Marketplace doesn't require auth, but admin view does
app.get('/api/campaigns', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const marketplace = req.query.marketplace === 'true'; // For clippers to see available campaigns
    let filteredCampaigns = campaigns;

    // Try to get user if token is provided (for admin view)
    let user = null;
    let isAdmin = false;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        // Try Firebase token verification
        let firebaseUid = null;
        try {
          if (admin.apps.length > 0) {
            const decodedToken = await admin.auth().verifyIdToken(token);
            firebaseUid = decodedToken.uid;
          } else {
            const decoded = decodeJWT(token);
            if (decoded && decoded.user_id) {
              firebaseUid = decoded.user_id;
            }
          }
        } catch (firebaseError) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.user_id) {
            firebaseUid = decoded.user_id;
          }
        }

        if (firebaseUid) {
          user = users.find(u => u.firebaseUid === firebaseUid);
        }

        // Try backend token as fallback
        if (!user) {
          const userId = tokens.get(token);
          if (userId) {
            user = users.find(u => u.id === userId);
          }
        }

        isAdmin = user && user.role === 'admin';
      }
    } catch (e) {
      // If auth fails, continue without user (for marketplace)
      console.warn('Auth check failed for campaigns endpoint:', e.message);
    }

    if (marketplace) {
      // OPTIMIZATION: Single-pass filtering with early returns
      // IMPACT: Reduced from multiple filter passes to single pass
      const now = new Date();
      console.log('MARKETPLACE DEBUG: Checking campaigns at', now.toISOString());
      console.log('Total campaigns in memory:', campaigns.length);

      // OPTIMIZATION: Single pass filter with optimized conditions
      filteredCampaigns = campaigns.filter(c => {
        // Debug logging for each campaign
        const debugInfo = {
          id: c.id,
          title: c.title,
          status: c.status,
          isPublic: c.isPublic,
          endDate: c.endDate,
          remainingBudget: c.remainingBudget,
          autoCloseOnBudgetExhausted: c.autoCloseOnBudgetExhausted
        };

        // Early return for non-active campaigns
        if (c.status !== 'ACTIVE') {
          console.log('MARKETPLACE FILTER: Campaign excluded - status not ACTIVE:', debugInfo);
          return false;
        }

        // Campaigns are public by default if status is ACTIVE (for backward compatibility)
        // Only exclude if explicitly set to false
        if (c.isPublic === false) {
          console.log('MARKETPLACE FILTER: Campaign excluded - isPublic is false:', debugInfo);
          return false;
        }

        // Early return for expired campaigns
        if (c.endDate) {
          const endDate = new Date(c.endDate);
          if (endDate <= now) {
            console.log('MARKETPLACE FILTER: Campaign excluded - expired:', debugInfo);
            return false;
          }
        }

        // Early return for exhausted budget (only if autoCloseOnBudgetExhausted is true)
        if (c.autoCloseOnBudgetExhausted === true && c.remainingBudget !== undefined && c.remainingBudget !== null && c.remainingBudget <= 0) {
          console.log('MARKETPLACE FILTER: Campaign excluded - budget exhausted:', debugInfo);
          return false;
        }

        console.log('MARKETPLACE FILTER: Campaign included:', debugInfo);
        return true;
      });

      console.log('MARKETPLACE DEBUG: Filtered campaigns count:', filteredCampaigns.length);

      // Return public data only (no sensitive info)
      filteredCampaigns = filteredCampaigns.map(c => ({
        id: c.id,
        title: c.title,
        influencerName: c.influencerName,
        description: c.description,
        thumbnail: c.thumbnail,
        allowedPlatforms: c.allowedPlatforms,
        ratePer1kViews: c.ratePer1kViews,
        minEligibleViews: c.minEligibleViews,
        maxPayableViewsPerClip: c.maxPayableViewsPerClip,
        remainingBudget: c.remainingBudget,
        endDate: c.endDate,
        startDate: c.startDate,
        contentGuidelines: c.contentGuidelines,
        captionRequirements: c.captionRequirements,
        hashtagRequirements: c.hashtagRequirements,
        prohibitedContent: c.prohibitedContent,
        allowUnlimitedClippers: c.allowUnlimitedClippers,
        maxClippers: c.maxClippers,
        maxClipsPerUser: c.maxClipsPerUser,
        clippers: c.clippers,
        submissions: c.submissions,
        createdAt: c.createdAt
      }));
    } else if (activeOnly) {
      const now = new Date();
      filteredCampaigns = campaigns.filter(c => {
        if (c.endDate) {
          const deadline = new Date(c.endDate);
          if (deadline <= now) return false;
        }
        return c.status === 'ACTIVE';
      });
    } else {
      // For admin, show all campaigns including DRAFT
      // For others, filter based on role
      if (!isAdmin) {
        // Non-admin users only see ACTIVE campaigns they created or are part of
        const userId = user ? user.id : null;
        filteredCampaigns = campaigns.filter(c => {
          if (c.status === 'ACTIVE') return true;
          if (userId && c.createdBy === userId) return true; // Can see own campaigns
          return false;
        });
      }
      // Admin sees all campaigns
    }

    console.log('GET /api/campaigns:', {
      totalCampaigns: campaigns.length,
      filteredCampaigns: filteredCampaigns.length,
      marketplace,
      activeOnly,
      isAdmin,
      userId: user ? user.id : 'none'
    });

    res.json({ campaigns: filteredCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get single campaign
app.get('/api/campaigns/:id', (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ campaign });
});

// Create campaign (Admin or Verified Influencer)
app.post('/api/campaigns', verifyToken, requireRoleOrOwner(['admin', 'influencer'], null), requireVerifiedInfluencer(), (req, res) => {
  const {
    title,
    influencerName,
    description,
    allowedPlatforms, // Array: ['tiktok', 'instagram', 'facebook']
    ratePer1kViews, // Rate per 1,000 views
    minEligibleViews, // Minimum views required
    maxPayableViewsPerClip, // Optional cap per clip
    totalBudget, // Total campaign budget
    contentGuidelines,
    captionRequirements,
    hashtagRequirements,
    prohibitedContent,
    startDate, // Default: now
    endDate, // Optional
    autoCloseOnBudgetExhausted, // Boolean
    isPublic, // Public or private
    allowUnlimitedClippers, // Boolean
    maxClippers, // If not unlimited
    maxClipsPerUser // Optional limit
  } = req.body;

  // Validation
  if (!title || !influencerName || !ratePer1kViews || !minEligibleViews || !totalBudget) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!allowedPlatforms || !Array.isArray(allowedPlatforms) || allowedPlatforms.length === 0) {
    return res.status(400).json({ error: 'At least one platform must be selected' });
  }

  const validPlatforms = ['tiktok', 'instagram', 'facebook'];
  const invalidPlatforms = allowedPlatforms.filter(p => !validPlatforms.includes(p.toLowerCase()));
  if (invalidPlatforms.length > 0) {
    return res.status(400).json({ error: `Invalid platforms: ${invalidPlatforms.join(', ')}` });
  }

  if (ratePer1kViews <= 0 || minEligibleViews <= 0 || totalBudget <= 0) {
    return res.status(400).json({ error: 'Rate, minimum views, and budget must be greater than 0' });
  }

  // Check budget for influencer
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'influencer') {
    if (!user.verified) {
      return res.status(403).json({ error: 'Only verified influencers can create campaigns' });
    }
    if ((user.budget || 0) < totalBudget) {
      return res.status(400).json({ error: 'Insufficient wallet balance. Please top up first.' });
    }
    // Reserve budget (don't deduct yet, will deduct when campaign becomes ACTIVE)
    user.budget = (user.budget || 0) - totalBudget;
  }

  try {
    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      influencerName,
      description: description || '',
      thumbnail: req.body.thumbnail || null,
      allowedPlatforms: allowedPlatforms.map(p => p.toLowerCase()),
      ratePer1kViews: parseFloat(ratePer1kViews),
      minEligibleViews: parseInt(minEligibleViews),
      maxPayableViewsPerClip: maxPayableViewsPerClip ? parseInt(maxPayableViewsPerClip) : null,
      totalBudget: parseFloat(totalBudget),
      reservedBudget: parseFloat(totalBudget), // Initially all budget is reserved
      paidBudget: 0,
      remainingBudget: parseFloat(totalBudget),
      // Campaign rules
      contentGuidelines: contentGuidelines || '',
      captionRequirements: captionRequirements || '',
      hashtagRequirements: hashtagRequirements || '',
      prohibitedContent: prohibitedContent || '',
      // Timeline
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      autoCloseOnBudgetExhausted: autoCloseOnBudgetExhausted !== false, // Default true
      // Visibility
      isPublic: isPublic !== false, // Default true
      allowUnlimitedClippers: allowUnlimitedClippers !== false, // Default true
      maxClippers: allowUnlimitedClippers ? null : (maxClippers ? parseInt(maxClippers) : null),
      maxClipsPerUser: maxClipsPerUser ? parseInt(maxClipsPerUser) : null,
      // Status
      status: 'DRAFT', // DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED
      // Stats
      clippers: 0,
      submissions: 0,
      totalViews: 0,
      participants: [], // Array of participant IDs
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    campaigns.push(campaign);
    // OPTIMIZATION: Update index when adding campaign
    campaignsById.set(campaign.id, campaign);
    console.log('Campaign created:', {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      influencerName: campaign.influencerName,
      totalCampaigns: campaigns.length
    });

    if (user.role === 'admin') {
      logAudit(req.userId, 'CREATE_CAMPAIGN', { campaignId: campaign.id, title: campaign.title });
    }

    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Update campaign (Admin or Influencer - own campaigns only)
app.put('/api/campaigns/:id', verifyToken, requireRoleOrOwner(['admin'], (req, user) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  return campaign && campaign.createdBy === user.id && user.role === 'influencer';
}), (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const user = users.find(u => u.id === req.userId);

  // Influencer can only edit their own campaigns and cannot change status
  if (user.role === 'influencer' && campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'You can only edit your own campaigns' });
  }

  const oldStatus = campaign.status;
  const updateData = { ...req.body };

  // Influencer cannot change status
  if (user.role === 'influencer') {
    delete updateData.status;
  }

  Object.assign(campaign, {
    ...updateData,
    id: campaign.id,
    createdAt: campaign.createdAt
  });

  if (user.role === 'admin') {
    if (oldStatus !== campaign.status) {
      logAudit(req.userId, 'UPDATE_CAMPAIGN_STATUS', {
        campaignId: campaign.id,
        oldStatus,
        newStatus: campaign.status
      });
    } else {
      logAudit(req.userId, 'UPDATE_CAMPAIGN', { campaignId: campaign.id });
    }
  }

  res.json({ campaign });
});

// Activate campaign (change from DRAFT to ACTIVE) - Influencer or Admin
app.patch('/api/campaigns/:id/activate', verifyToken, requireRoleOrOwner(['admin'], (req, user) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  return campaign && campaign.createdBy === user.id && user.role === 'influencer';
}), (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Only DRAFT campaigns can be activated' });
  }

  const user = users.find(u => u.id === req.userId);
  if (user.role === 'influencer' && campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'You can only activate your own campaigns' });
  }

  campaign.status = 'ACTIVE';
  campaign.updatedAt = new Date().toISOString();

  if (user.role === 'admin') {
    logAudit(req.userId, 'ACTIVATE_CAMPAIGN', { campaignId: campaign.id });
  }

  res.json({ campaign });
});

// Pause/Resume campaign - Influencer (own campaigns) or Admin
app.patch('/api/campaigns/:id/status', verifyToken, requireRoleOrOwner(['admin'], (req, user) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  return campaign && campaign.createdBy === user.id && user.role === 'influencer';
}), (req, res) => {
  const { status } = req.body; // 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'
  if (!['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const user = users.find(u => u.id === req.userId);
  if (user.role === 'influencer' && campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'You can only manage your own campaigns' });
  }

  // Prevent changing from COMPLETED or CANCELLED
  if (['COMPLETED', 'CANCELLED'].includes(campaign.status) && status !== campaign.status) {
    return res.status(400).json({ error: 'Cannot change status of completed or cancelled campaigns' });
  }

  const oldStatus = campaign.status;
  campaign.status = status;
  campaign.updatedAt = new Date().toISOString();

  if (user.role === 'admin') {
    logAudit(req.userId, 'UPDATE_CAMPAIGN_STATUS', {
      campaignId: campaign.id,
      oldStatus,
      newStatus: status
    });
  }

  res.json({ campaign });
});

// Delete campaign (Admin only)
app.delete('/api/campaigns/:id', verifyToken, requireRole(['admin']), (req, res) => {
  const index = campaigns.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const campaign = campaigns[index];
  campaigns.splice(index, 1);
  logAudit(req.userId, 'DELETE_CAMPAIGN', { campaignId: campaign.id, title: campaign.title });

  res.json({ message: 'Campaign deleted' });
});

// ==================== SUBMISSIONS ====================

// Get submissions (filtered by user role)
// OPTIMIZATION: Eliminated N+1 query problem by pre-building user lookup map
// IMPACT: Reduced complexity from O(n*m) to O(n) where n=submissions, m=users
app.get('/api/submissions', verifyToken, (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let filteredSubmissions = submissions;

  if (user.role === 'clipper') {
    // OPTIMIZATION: Use indexed submissions if available, otherwise filter once
    const userSubmissionIds = submissionsByUserId.get(req.userId);
    if (userSubmissionIds) {
      filteredSubmissions = Array.from(userSubmissionIds).map(id => submissionsById.get(id));
    } else {
      filteredSubmissions = submissions.filter(s => s.userId === req.userId);
    }
  }

  // OPTIMIZATION: Pre-build user lookup map to avoid N+1 queries
  // Instead of calling users.find() for each submission, build map once
  if (user.role === 'admin') {
    // Build user lookup map once - O(m) where m = unique user count
    const userLookupMap = new Map();
    const campaignLookupMap = new Map();

    filteredSubmissions.forEach(s => {
      if (!userLookupMap.has(s.userId)) {
        const clipper = usersById.get(s.userId);
        userLookupMap.set(s.userId, {
          name: clipper?.name || 'Unknown',
          email: clipper?.email || 'Unknown'
        });
      }

      if (!campaignLookupMap.has(s.campaignId)) {
        const campaign = campaignsById.get(s.campaignId);
        campaignLookupMap.set(s.campaignId, {
          title: campaign?.title || 'Unknown Campaign'
        });
      }
    });

    // Now map with O(1) lookups instead of O(n) finds
    filteredSubmissions = filteredSubmissions.map(s => {
      const clipperInfo = userLookupMap.get(s.userId);
      const campaignInfo = campaignLookupMap.get(s.campaignId);
      return {
        ...s,
        // Populate user object (expected by frontend)
        user: {
          name: clipperInfo.name,
          email: clipperInfo.email
        },
        // Populate campaign object (expected by frontend)
        campaign: {
          title: campaignInfo.title
        },
        // Ensure contentUrl is available (map from videoUrl if not exists)
        contentUrl: s.contentUrl || s.videoUrl,
        // Keep legacy fields for backward compatibility
        clipperName: clipperInfo.name,
        clipperEmail: clipperInfo.email
      };
    });
  }

  // For influencer: only show submissions from their campaigns, but NO clipper info
  if (user.role === 'influencer') {
    // OPTIMIZATION: Use Set for O(1) lookups instead of array.includes() which is O(n)
    const influencerCampaignIds = new Set();
    campaigns.forEach(c => {
      if (c.createdBy === req.userId) {
        influencerCampaignIds.add(c.id);
      }
    });

    // Filter and map in single pass
    filteredSubmissions = filteredSubmissions
      .filter(s => influencerCampaignIds.has(s.campaignId))
      .map(s => {
        const { userId, ...submissionWithoutUserId } = s;
        return submissionWithoutUserId;
      });
  }

  res.json({ submissions: filteredSubmissions });
});

// Get single submission
app.get('/api/submissions/:id', verifyToken, (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const submission = submissionsById.get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const user = users.find(u => u.id === req.userId);
  if (user.role === 'clipper' && submission.userId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Add clipper info for admin
  if (user.role === 'admin') {
    const clipper = users.find(u => u.id === submission.userId);
    submission.clipper = {
      id: clipper?.id,
      name: clipper?.name,
      email: clipper?.email,
      status: clipper?.status,
      totalSubmissions: submissions.filter(s => s.userId === submission.userId).length,
      approvedSubmissions: submissions.filter(s => s.userId === submission.userId && s.status === 'approved').length
    };
  }

  res.json({ submission });
});

// Create submission
app.post('/api/submissions', verifyToken, blockInfluencersFromClipperRoutes(), (req, res) => {
  const {
    platform, // YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK
    videoUrl,
    campaignId,
    title,
    thumbnail,
    views,
    likes,
    duration,
    channelName,
    channelId,
    uploadDate, // For non-YouTube
    isOriginal, // For non-YouTube
    note // Optional
  } = req.body;

  if (!videoUrl || !campaignId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const selectedPlatform = (platform || 'YOUTUBE').toUpperCase();
  const validPlatforms = ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK'];
  if (!validPlatforms.includes(selectedPlatform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  const user = users.find(u => u.id === req.userId);
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is suspended or blacklisted' });
  }

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Campaign is not active' });
  }

  // Check if platform is allowed in campaign
  if (campaign.allowedPlatforms && campaign.allowedPlatforms.length > 0) {
    const platformLower = selectedPlatform.toLowerCase();
    if (!campaign.allowedPlatforms.includes(platformLower)) {
      return res.status(400).json({ error: `Platform ${selectedPlatform} is not allowed for this campaign` });
    }
  }

  // Validate URL format
  const urlPatterns = {
    YOUTUBE: [/youtube\.com\/watch/, /youtu\.be\//],
    TIKTOK: [/tiktok\.com/],
    INSTAGRAM: [/instagram\.com\/reel/, /instagram\.com\/p/],
    FACEBOOK: [/facebook\.com\/watch/, /fb\.watch/],
  };
  const isValidUrl = urlPatterns[selectedPlatform].some(pattern => pattern.test(videoUrl));
  if (!isValidUrl) {
    return res.status(400).json({ error: `Invalid ${selectedPlatform} URL format` });
  }

  // Check for duplicate URL across all submissions
  const existingSubmission = submissions.find(s => s.videoUrl === videoUrl);
  if (existingSubmission) {
    return res.status(400).json({ error: 'This video URL has already been submitted' });
  }

  // Check if user has joined the campaign using new relationship system
  const relation = getCampaignClipperRelation(campaignId, req.userId);
  if (!relation || relation.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'You must join the campaign first' });
  }

  // Check max clips per user
  if (campaign.maxClipsPerUser) {
    const userSubmissions = submissions.filter(s =>
      s.campaignId === campaignId && s.userId === req.userId
    );
    if (userSubmissions.length >= campaign.maxClipsPerUser) {
      return res.status(400).json({ error: `Maximum ${campaign.maxClipsPerUser} clips per user reached` });
    }
  }

  // For non-YouTube, validate additional fields
  if (selectedPlatform !== 'YOUTUBE') {
    if (!uploadDate) {
      return res.status(400).json({ error: 'Upload date is required for non-YouTube submissions' });
    }
    if (!isOriginal) {
      return res.status(400).json({ error: 'You must confirm the video is original' });
    }
  }

  // Calculate potential reward (for YouTube with views, for others will be calculated after proof)
  let eligibleViews = 0;
  let potentialReward = 0;
  const viewsInt = parseInt(views) || 0;
  const likesInt = parseInt(likes) || 0;
  const commentsInt = parseInt(req.body.comments) || 0; // New field

  if (selectedPlatform === 'YOUTUBE' && viewsInt) {
    eligibleViews = Math.min(
      viewsInt,
      campaign.maxPayableViewsPerClip || viewsInt
    );
    potentialReward = eligibleViews >= campaign.minEligibleViews
      ? (eligibleViews / 1000) * campaign.ratePer1kViews
      : 0;
  }

  // Create submission with new structure
  const submission = {
    id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    clipperId: req.userId, // Use clipperId for consistency
    userId: req.userId, // Keep for backward compatibility
    campaignId,
    // Submission Data
    platform: selectedPlatform,
    videoUrl,
    title: title || 'Untitled Clip',
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    // Engagement Metrics (snapshot at submission)
    views: selectedPlatform === 'YOUTUBE' ? viewsInt : 0,
    likes: selectedPlatform === 'YOUTUBE' ? likesInt : 0,
    comments: selectedPlatform === 'YOUTUBE' ? commentsInt : 0,
    uploadDate: selectedPlatform !== 'YOUTUBE' ? uploadDate : (req.body.uploadDate || new Date().toISOString()),
    engagementGrowthRate: null, // Will be calculated if needed
    // Validation
    validationStatus: 'PENDING',
    validationErrors: [],
    validatedAt: null,
    // Fraud Detection (will be populated)
    fraudFlags: {
      autoFlags: [],
      manualFlags: [],
      trustScoreImpact: 0
    },
    // State Machine - Start with SUBMITTED
    status: 'SUBMITTED',
    statusHistory: [{
      status: 'SUBMITTED',
      timestamp: new Date().toISOString(),
      reason: null
    }],
    // Reward
    eligibleViews: eligibleViews,
    rewardAmount: potentialReward,
    potentialReward: potentialReward, // Keep for backward compatibility
    reward: potentialReward, // Keep for backward compatibility
    webBalanceCredited: false,
    creditedAt: null,
    // Review
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    // Legacy fields (for backward compatibility)
    flagged: false,
    flagReason: null,
    duration: duration || '0:00',
    channelName: channelName || '',
    channelId: channelId || '',
    isOriginal: selectedPlatform !== 'YOUTUBE' ? isOriginal : true,
    note: note || null,
    lockUntil: selectedPlatform !== 'YOUTUBE'
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null,
    viewHistory: selectedPlatform === 'YOUTUBE'
      ? [{ views: viewsInt, timestamp: new Date().toISOString() }]
      : [],
    // Metadata
    submittedAt: new Date().toISOString(),
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  // Hard Validation
  const validationErrors = [];

  // Check deadline
  if (campaign.endDate && new Date(campaign.endDate) < new Date()) {
    validationErrors.push('Campaign deadline has passed');
  }

  // Check minimum views (for YouTube)
  if (selectedPlatform === 'YOUTUBE' && viewsInt < campaign.minEligibleViews) {
    validationErrors.push(`Views (${viewsInt}) below minimum requirement (${campaign.minEligibleViews})`);
  }

  // If validation fails, reject immediately
  if (validationErrors.length > 0) {
    submission.validationStatus = 'FAILED';
    submission.validationErrors = validationErrors;
    submission.validatedAt = new Date().toISOString();
    transitionSubmissionStatus(submission, 'REJECTED', `Validation failed: ${validationErrors.join(', ')}`);
    submissions.push(submission);
    submissionsById.set(submission.id, submission);
    saveData();
    return res.status(400).json({
      error: 'Validation failed',
      errors: validationErrors,
      submission
    });
  }

  // Validation passed
  submission.validationStatus = 'PASSED';
  submission.validatedAt = new Date().toISOString();

  // Run Fraud Detection
  // [ENGINE_INTEGRATION_POINT] - Bot Detection Engine
  // TODO: When Bot Detection Engine is ready, replace detectFraud() with external API call
  // Current implementation: detectFraud() uses dummy heuristics (lines 316-380)
  // Future: Call external engine that returns { autoFlags, manualFlags, trustScoreImpact }
  const fraudFlags = detectFraud(submission);
  submission.fraudFlags = fraudFlags;

  // Auto-transition to AUTO_CHECKING
  try {
    transitionSubmissionStatus(submission, 'AUTO_CHECKING', 'Automatic validation and fraud check');
  } catch (error) {
    console.error('State transition error:', error);
    // Fallback to SUBMITTED if state machine fails
  }

  // TEMPORARY AUTO-APPROVAL LOGIC (until Trust Score & Bot Detection engines are implemented)
  // TODO: Remove this section when engines are ready
  // Currently: Auto-approve all submissions that pass validation (no engine checks)
  // Future: Use fraud flags and trust score to determine approval

  // Determine next state based on fraud detection
  // NOTE: Temporarily disabled fraud flag checking - will re-enable when Bot Detection Engine is ready
  const SKIP_FRAUD_CHECKS = true; // Set to false when Bot Detection Engine is implemented

  if (!SKIP_FRAUD_CHECKS && fraudFlags.autoFlags.length > 0) {
    // Has auto flags - move to FLAGGED_AUTO
    try {
      transitionSubmissionStatus(submission, 'FLAGGED_AUTO', `Auto-flagged: ${fraudFlags.autoFlags.length} issue(s) detected`);
    } catch (error) {
      console.error('State transition error:', error);
    }
  } else {
    // [ENGINE_INTEGRATION_POINT] - Trust Score Engine
    // TODO: When Trust Score Engine is ready, replace getTrustScore() with external API call
    // Current implementation: getTrustScore() uses dummy calculation (lines 304-310)
    // Future: Call external engine that returns { score, tier, factors, history }

    // TEMPORARY: Move ALL valid submissions to manual review (bypass trust score check)
    // TODO: Re-enable trust score check when engine is implemented
    const SKIP_TRUST_SCORE_CHECK = true; // Set to false when Trust Score Engine is implemented

    if (SKIP_TRUST_SCORE_CHECK) {
      // Temporarily move all valid submissions to manual review queue
      // Admin can then approve them manually
      try {
        transitionSubmissionStatus(submission, 'UNDER_ADMIN_REVIEW', 'Awaiting manual review (engines not yet implemented)');
      } catch (error) {
        console.error('State transition error:', error);
      }
    } else {
      // Future logic when Trust Score Engine is implemented:
      const trustScore = getTrustScore(req.userId);
      if (trustScore.tier === 'HIGH' || trustScore.tier === 'VERIFIED') {
        // High trust - auto approve
        try {
          transitionSubmissionStatus(submission, 'APPROVED', 'Auto-approved: High trust score');
          // Credit web balance immediately
          creditWebBalance(
            req.userId,
            potentialReward,
            'SUBMISSION_APPROVAL',
            submission.id,
            campaignId,
            `Reward for submission: ${submission.title}`
          );
          submission.webBalanceCredited = true;
          submission.creditedAt = new Date().toISOString();
          // Update trust score
          calculateTrustScore(req.userId);
        } catch (error) {
          console.error('State transition error:', error);
          // Fallback to UNDER_ADMIN_REVIEW
          transitionSubmissionStatus(submission, 'UNDER_ADMIN_REVIEW', 'Auto-approval failed, requires manual review');
        }
      } else {
        // Medium/Low trust - manual review
        try {
          transitionSubmissionStatus(submission, 'UNDER_ADMIN_REVIEW', 'Manual review required: Medium/Low trust score');
        } catch (error) {
          console.error('State transition error:', error);
        }
      }
    }
  }

  submissions.push(submission);
  // OPTIMIZATION: Update indexes when adding submission
  submissionsById.set(submission.id, submission);
  if (!submissionsByUserId.has(submission.userId)) {
    submissionsByUserId.set(submission.userId, new Set());
  }
  submissionsByUserId.get(submission.userId).add(submission.id);
  if (!submissionsByCampaignId.has(submission.campaignId)) {
    submissionsByCampaignId.set(submission.campaignId, new Set());
  }
  submissionsByCampaignId.get(submission.campaignId).add(submission.id);

  // Update campaign stats
  campaign.submissions = (campaign.submissions || 0) + 1;
  if (selectedPlatform === 'YOUTUBE') {
    campaign.totalViews += submission.views;
  }

  // Update campaign-clipper relation
  if (relation) {
    relation.submissionCount = (relation.submissionCount || 0) + 1;
    relation.lastSubmissionAt = new Date().toISOString();
  }

  // Invalidate wallet cache when new submission is created
  walletBalanceCache.delete(`wallet_${submission.userId}`);

  // Save data
  saveData();

  res.status(201).json({
    submission,
    message: submission.status === 'APPROVED'
      ? 'Submission approved automatically! Reward credited to web balance.'
      : submission.status === 'FLAGGED_AUTO'
        ? 'Submission flagged for review due to detected anomalies.'
        : 'Submission received and is being processed.'
  });
});

// Get my submissions (Clipper)
app.get('/api/submissions/my', verifyToken, requireRole(['clipper']), blockInfluencersFromClipperRoutes(), (req, res) => {
  const userSubmissions = submissions
    .filter(s => s.userId === req.userId)
    .map(s => {
      const proof = submissionProofs.find(p => p.submissionId === s.id);
      return {
        ...s,
        proof: proof || null,
        canSubmitProof: s.platform !== 'YOUTUBE' &&
          s.status === 'SUBMITTED' &&
          s.lockUntil &&
          new Date(s.lockUntil) <= new Date()
      };
    })
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.json({ submissions: userSubmissions });
});

// Submit proof for non-YouTube submission
app.post('/api/submissions/:id/proof', verifyToken, requireRole(['clipper']), (req, res) => {
  const {
    analyticsScreenshot, // URL to uploaded image
    videoPageScreenshot, // URL to uploaded image
    screenRecording, // Optional URL
    totalViews,
    proofDate, // Date when proof was taken
    proofTime // Time when proof was taken
  } = req.body;

  if (!analyticsScreenshot || !videoPageScreenshot || !totalViews) {
    return res.status(400).json({ error: 'Missing required proof fields' });
  }

  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  if (submission.userId !== req.userId) {
    return res.status(403).json({ error: 'You can only submit proof for your own submissions' });
  }

  if (submission.platform === 'YOUTUBE') {
    return res.status(400).json({ error: 'Proof submission is not required for YouTube videos' });
  }

  if (submission.status !== 'SUBMITTED' && submission.status !== 'WAITING_VIEW_CHECK') {
    return res.status(400).json({ error: `Cannot submit proof for submission with status: ${submission.status}` });
  }

  // Check if lock period has passed
  if (submission.lockUntil && new Date(submission.lockUntil) > new Date()) {
    const hoursLeft = Math.ceil((new Date(submission.lockUntil) - new Date()) / (1000 * 60 * 60));
    return res.status(400).json({
      error: `Please wait ${hoursLeft} more hours before submitting proof`,
      lockUntil: submission.lockUntil
    });
  }

  // Check if proof already submitted
  const existingProof = submissionProofs.find(p => p.submissionId === submission.id);
  if (existingProof) {
    return res.status(400).json({ error: 'Proof has already been submitted for this submission' });
  }

  const campaign = campaigns.find(c => c.id === submission.campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Validate minimum views
  const views = parseInt(totalViews);
  if (views < campaign.minEligibleViews) {
    return res.status(400).json({
      error: `Views (${views}) are below minimum requirement (${campaign.minEligibleViews})`
    });
  }

  // Calculate reward
  const eligibleViews = Math.min(
    views,
    campaign.maxPayableViewsPerClip || views
  );
  const reward = (eligibleViews / 1000) * campaign.ratePer1kViews;

  // Create proof record
  const proof = {
    id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    submissionId: submission.id,
    analyticsScreenshot,
    videoPageScreenshot,
    screenRecording: screenRecording || null,
    totalViews: views,
    proofDate: proofDate || new Date().toISOString().split('T')[0],
    proofTime: proofTime || new Date().toTimeString().split(' ')[0],
    submittedAt: new Date().toISOString(),
    // Image hash for duplicate detection (in production, calculate from image)
    imageHash: `${analyticsScreenshot}_${videoPageScreenshot}`.substring(0, 50)
  };

  submissionProofs.push(proof);

  // Update submission
  submission.status = 'WAITING_REVIEW';
  submission.views = views;
  submission.eligibleViews = eligibleViews;
  submission.potentialReward = reward;
  submission.reward = reward;
  submission.viewHistory = [{ views, timestamp: new Date().toISOString() }];

  // Update campaign stats
  campaign.totalViews += views;

  res.status(201).json({ proof, submission });
});

// Join campaign (Clipper) - UPDATED to use new relationship system
app.post('/api/campaigns/:id/join', verifyToken, requireRole(['clipper']), (req, res) => {
  const campaign = campaignsById.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Campaign is not active' });
  }

  if (!campaign.isPublic) {
    return res.status(403).json({ error: 'This is a private campaign' });
  }

  // Check if campaign allows more clippers
  if (!campaign.allowUnlimitedClippers && campaign.maxClippers) {
    const currentClippers = campaignClipperRelations.filter(r => r.campaignId === campaign.id && r.status === 'ACTIVE').length;
    if (currentClippers >= campaign.maxClippers) {
      return res.status(400).json({ error: 'Campaign has reached maximum clippers' });
    }
  }

  // Check if user already joined using new relationship system
  const existingRelation = getCampaignClipperRelation(campaign.id, req.userId);
  if (existingRelation && existingRelation.status === 'ACTIVE') {
    return res.status(400).json({ error: 'You have already joined this campaign' });
  }

  // Create or reactivate relationship
  let relation;
  if (existingRelation) {
    // Reactivate if previously expired
    relation = existingRelation;
    relation.status = 'ACTIVE';
    relation.joinedAt = new Date().toISOString();
  } else {
    // Create new relationship
    relation = joinCampaign(campaign.id, req.userId);
  }

  // Update campaign participants (backward compatibility)
  if (!campaign.participants) {
    campaign.participants = [];
  }
  if (!campaign.participants.includes(req.userId)) {
    campaign.participants.push(req.userId);
  }
  campaign.clippers = campaignClipperRelations.filter(r => r.campaignId === campaign.id && r.status === 'ACTIVE').length;

  saveData();

  res.json({
    message: 'Successfully joined campaign',
    campaign,
    relation
  });
});

// Approve/Reject submission (Admin or Influencer - own campaigns) - UPDATED with new state machine
app.patch('/api/submissions/:id/approve', verifyToken, requireRoleOrOwner(['admin'], (req, user) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const submission = submissionsById.get(req.params.id);
  if (!submission) return false;
  const campaign = campaignsById.get(submission.campaignId);
  return campaign && campaign.createdBy === user.id && user.role === 'influencer';
}), (req, res) => {
  const { status, reason } = req.body; // 'approved' or 'rejected' or 'APPROVED' or 'REJECTED'

  // Support both old and new status formats
  const normalizedStatus = status.toUpperCase();
  if (!['APPROVED', 'REJECTED', 'APPROVE', 'REJECT'].includes(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid status. Use: approved or rejected' });
  }

  const finalStatus = normalizedStatus === 'APPROVE' ? 'APPROVED' :
    normalizedStatus === 'REJECT' ? 'REJECTED' : normalizedStatus;

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const submission = submissionsById.get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // Use new state machine for transitions
  // Valid transitions: UNDER_ADMIN_REVIEW → APPROVED/REJECTED, FLAGGED_AUTO → UNDER_ADMIN_REVIEW → APPROVED/REJECTED
  const validCurrentStates = ['UNDER_ADMIN_REVIEW', 'FLAGGED_AUTO', 'AUTO_CHECKING', 'WAITING_REVIEW', 'pending'];
  if (!validCurrentStates.includes(submission.status)) {
    return res.status(400).json({
      error: `Cannot approve/reject submission in status: ${submission.status}. Must be in review.`
    });
  }

  // For non-YouTube, ensure proof is submitted before approval
  if (finalStatus === 'APPROVED' && submission.platform !== 'YOUTUBE') {
    const proof = submissionProofs.find(p => p.submissionId === submission.id);
    if (!proof) {
      return res.status(400).json({ error: 'Proof must be submitted before approval' });
    }
  }

  const oldStatus = submission.status;

  try {
    // Use state machine transition
    if (finalStatus === 'APPROVED') {
      transitionSubmissionStatus(submission, 'APPROVED', reason || 'Approved by admin/influencer', req.userId);
    } else {
      transitionSubmissionStatus(submission, 'REJECTED', reason || 'Rejected by admin/influencer', req.userId);
      submission.rejectionReason = reason || 'No reason provided';
    }
  } catch (error) {
    return res.status(400).json({
      error: `Invalid state transition: ${error.message}`
    });
  }

  submission.reviewedAt = new Date().toISOString();
  submission.reviewedBy = req.userId;

  if (finalStatus === 'APPROVED') {
    // OPTIMIZATION: Use Map lookups - O(1) instead of O(n)
    const clipper = usersById.get(submission.userId || submission.clipperId);
    const campaign = campaignsById.get(submission.campaignId);

    if (campaign && clipper) {
      // Use reward amount from submission
      const rewardAmount = submission.rewardAmount || submission.reward || submission.potentialReward || 0;

      if (rewardAmount > 0) {
        // Check if campaign has remaining budget
        if ((campaign.remainingBudget || 0) < rewardAmount) {
          // Revert state transition
          submission.status = oldStatus;
          return res.status(400).json({ error: 'Campaign budget exhausted' });
        }

        // Credit web balance (NEW SYSTEM)
        if (!submission.webBalanceCredited) {
          try {
            creditWebBalance(
              submission.userId || submission.clipperId,
              rewardAmount,
              'SUBMISSION_APPROVAL',
              submission.id,
              submission.campaignId,
              `Reward for submission: ${submission.title || 'Clip'}`
            );
            submission.webBalanceCredited = true;
            submission.creditedAt = new Date().toISOString();
          } catch (error) {
            console.error('Error crediting web balance:', error);
            // Don't fail the approval, but log the error
          }
        }

        // Update campaign budget
        campaign.paidBudget = (campaign.paidBudget || 0) + rewardAmount;
        campaign.remainingBudget = (campaign.remainingBudget || 0) - rewardAmount;
        campaign.spentBudget = campaign.paidBudget; // For backward compatibility

        // Transition to PAID state
        try {
          transitionSubmissionStatus(submission, 'PAID', 'Reward credited to web balance');
        } catch (error) {
          console.error('Error transitioning to PAID:', error);
          // Keep as APPROVED if transition fails
        }

        // Auto-close if budget exhausted
        if (campaign.remainingBudget <= 0 && campaign.autoCloseOnBudgetExhausted) {
          campaign.status = 'COMPLETED';
          campaign.updatedAt = new Date().toISOString();
        }
      }

      // Update trust score (positive impact for approval)
      calculateTrustScore(submission.userId || submission.clipperId);
    }
  } else {
    // REJECTED - update trust score (negative impact)
    calculateTrustScore(submission.userId || submission.clipperId);
  }

  // Audit logging
  const user = usersById.get(req.userId);
  if (user && user.role === 'admin') {
    logAudit(req.userId, `${finalStatus}_SUBMISSION`, {
      submissionId: submission.id,
      userId: submission.userId || submission.clipperId,
      reason: reason || null,
      oldStatus,
      newStatus: submission.status
    });
  }

  saveData();

  res.json({
    submission,
    message: finalStatus === 'APPROVED'
      ? 'Submission approved! Reward credited to web balance.'
      : 'Submission rejected.'
  });
});

// Flag submission (Admin only)
app.patch('/api/submissions/:id/flag', verifyToken, requireRole(['admin']), (req, res) => {
  const { flagged, reason } = req.body;

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const submission = submissionsById.get(req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submission.flagged = flagged;
  submission.flagReason = reason || null;

  logAudit(req.userId, flagged ? 'FLAG_SUBMISSION' : 'UNFLAG_SUBMISSION', {
    submissionId: submission.id,
    reason: reason || null
  });

  res.json({ submission });
});

// ==================== WALLET & TRANSACTIONS ====================

// Helper function to calculate wallet balance from transactions (ledger-based)
// OPTIMIZATION: Added caching and eliminated nested find() calls
// IMPACT: Reduced complexity from O(n^2) to O(n) with caching for O(1) subsequent calls
// COMPLEXITY: O(n) for cache miss, O(1) for cache hit
const calculateWalletBalance = (userId, forceRefresh = false) => {
  // OPTIMIZATION: Check cache first
  const cacheKey = `wallet_${userId}`;
  const cached = walletBalanceCache.get(cacheKey);

  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  // OPTIMIZATION: Use indexed transactions if available, otherwise filter once
  let userTransactions = transactionsByUserId.get(userId) || [];
  if (userTransactions.length === 0) {
    userTransactions = transactions.filter(t => t.userId === userId);
  }

  let availableBalance = 0;
  let pendingBalance = 0;
  let lockedBalance = 0;
  let lifetimeEarned = 0;
  let lifetimeWithdrawn = 0;

  // OPTIMIZATION: Build pending transaction lookup map to avoid nested find()
  // This eliminates O(n^2) complexity from nested find() calls
  const pendingTxMap = new Map(); // relatedTransactionId -> pendingTx
  userTransactions.forEach(t => {
    if (t.type === 'SUBMISSION_REWARD_PENDING' && t.relatedTransactionId) {
      pendingTxMap.set(t.relatedTransactionId, t);
    }
  });

  // OPTIMIZATION: Single pass through transactions
  userTransactions.forEach(t => {
    const amount = Math.abs(t.amount);

    switch (t.type) {
      case 'SUBMISSION_REWARD_PENDING':
        pendingBalance += amount;
        lifetimeEarned += amount;
        break;
      case 'SUBMISSION_REWARD_APPROVED':
        availableBalance += amount;
        // OPTIMIZATION: O(1) lookup instead of O(n) find()
        const pendingTx = pendingTxMap.get(t.id);
        if (pendingTx) {
          pendingBalance -= Math.abs(pendingTx.amount);
        }
        break;
      case 'SUBMISSION_REWARD_REVERSED':
        // Deduct from available or pending
        availableBalance -= amount;
        break;
      case 'WITHDRAW_REQUEST':
        availableBalance -= amount;
        lockedBalance += amount;
        break;
      case 'WITHDRAW_APPROVED':
        lockedBalance -= amount;
        lifetimeWithdrawn += amount;
        break;
      case 'WITHDRAW_REJECTED':
        lockedBalance -= amount;
        availableBalance += amount; // Return to available
        break;
      case 'CAMPAIGN_FUNDING':
        availableBalance -= amount;
        break;
      case 'ADMIN_ADJUSTMENT':
        if (t.amount > 0) {
          availableBalance += amount;
        } else {
          availableBalance -= amount;
        }
        break;
    }
  });

  const result = {
    availableBalance,
    pendingBalance,
    lockedBalance,
    lifetimeEarned,
    lifetimeWithdrawn
  };

  // OPTIMIZATION: Cache the result
  walletBalanceCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
};

// Get wallet info (calculated from transactions)
app.get('/api/wallet', verifyToken, (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const balance = calculateWalletBalance(req.userId);

  res.json({
    balance: balance.availableBalance, // For backward compatibility
    availableBalance: balance.availableBalance,
    pendingBalance: balance.pendingBalance,
    lockedBalance: balance.lockedBalance,
    totalEarned: balance.lifetimeEarned,
    lifetimeEarned: balance.lifetimeEarned,
    totalWithdrawn: balance.lifetimeWithdrawn,
    lifetimeWithdrawn: balance.lifetimeWithdrawn
  });
});

// Get transactions
app.get('/api/transactions', verifyToken, (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(req.userId);
  // OPTIMIZATION: Use indexed transactions if available
  let userTransactions = transactionsByUserId.get(req.userId) || [];
  if (userTransactions.length === 0) {
    userTransactions = transactions.filter(t => t.userId === req.userId);
  }

  // Admin can see all transactions
  if (user.role === 'admin') {
    userTransactions = transactions;
  }

  userTransactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  res.json({ transactions: userTransactions });
});

// Get wallet transactions (with filters)
app.get('/api/wallet/transactions', verifyToken, (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(req.userId);
  // OPTIMIZATION: Use indexed transactions if available
  let userTransactions = transactionsByUserId.get(req.userId) || [];
  if (userTransactions.length === 0) {
    userTransactions = transactions.filter(t => t.userId === req.userId);
  }

  // Apply filters
  if (req.query.type) {
    userTransactions = userTransactions.filter(t => t.type === req.query.type);
  }
  if (req.query.status) {
    userTransactions = userTransactions.filter(t => t.status === req.query.status);
  }

  userTransactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  res.json({ transactions: userTransactions });
});

// ==================== PAYMENT METHODS ====================

// Get payment methods
app.get('/api/wallet/payment-methods', verifyToken, (req, res) => {
  const userMethods = paymentMethods.filter(pm => pm.userId === req.userId);
  res.json({ paymentMethods: userMethods });
});

// Add payment method
app.post('/api/wallet/payment-methods', verifyToken, (req, res) => {
  const { type, label, bankName, accountNumber, accountName, ewalletType, ewalletNumber, ewalletName } = req.body;

  if (!type || !['BANK', 'EWALLET'].includes(type)) {
    return res.status(400).json({ error: 'Invalid payment method type' });
  }

  if (type === 'BANK' && (!bankName || !accountNumber || !accountName)) {
    return res.status(400).json({ error: 'Missing bank details' });
  }

  if (type === 'EWALLET' && (!ewalletType || !ewalletNumber || !ewalletName)) {
    return res.status(400).json({ error: 'Missing e-wallet details' });
  }

  const method = {
    id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    type,
    label: label || (type === 'BANK' ? bankName : ewalletType),
    bankName: type === 'BANK' ? bankName : null,
    accountNumber: type === 'BANK' ? accountNumber : null,
    accountName: type === 'BANK' ? accountName : null,
    ewalletType: type === 'EWALLET' ? ewalletType : null,
    ewalletNumber: type === 'EWALLET' ? ewalletNumber : null,
    ewalletName: type === 'EWALLET' ? ewalletName : null,
    isDefault: paymentMethods.filter(pm => pm.userId === req.userId).length === 0,
    createdAt: new Date().toISOString()
  };

  paymentMethods.push(method);
  res.status(201).json({ paymentMethod: method });
});

// Update payment method
app.put('/api/wallet/payment-methods/:id', verifyToken, (req, res) => {
  const method = paymentMethods.find(pm => pm.id === req.params.id);
  if (!method) {
    return res.status(404).json({ error: 'Payment method not found' });
  }

  if (method.userId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { label, bankName, accountNumber, accountName, ewalletType, ewalletNumber, ewalletName } = req.body;

  Object.assign(method, {
    label: label || method.label,
    bankName: method.type === 'BANK' ? (bankName || method.bankName) : null,
    accountNumber: method.type === 'BANK' ? (accountNumber || method.accountNumber) : null,
    accountName: method.type === 'BANK' ? (accountName || method.accountName) : null,
    ewalletType: method.type === 'EWALLET' ? (ewalletType || method.ewalletType) : null,
    ewalletNumber: method.type === 'EWALLET' ? (ewalletNumber || method.ewalletNumber) : null,
    ewalletName: method.type === 'EWALLET' ? (ewalletName || method.ewalletName) : null,
    updatedAt: new Date().toISOString()
  });

  res.json({ paymentMethod: method });
});

// Delete payment method
app.delete('/api/wallet/payment-methods/:id', verifyToken, (req, res) => {
  const index = paymentMethods.findIndex(pm => pm.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Payment method not found' });
  }

  const method = paymentMethods[index];
  if (method.userId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  paymentMethods.splice(index, 1);
  res.json({ message: 'Payment method deleted' });
});

// ==================== WITHDRAW REQUESTS ====================

// Create withdraw request
app.post('/api/wallet/withdraw', verifyToken, requireRole(['clipper']), (req, res) => {
  const { amount, paymentMethodId, notes } = req.body;

  if (!amount || !paymentMethodId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const withdrawAmount = parseFloat(amount);
  const minWithdraw = 50000; // Rp 50.000

  if (withdrawAmount < minWithdraw) {
    return res.status(400).json({ error: `Minimum withdrawal is Rp ${minWithdraw.toLocaleString('id-ID')}` });
  }

  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate balance from transactions
  const balance = calculateWalletBalance(req.userId);

  if (withdrawAmount > balance.availableBalance) {
    return res.status(400).json({ error: 'Insufficient available balance' });
  }

  const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId && pm.userId === req.userId);
  if (!paymentMethod) {
    return res.status(404).json({ error: 'Payment method not found' });
  }

  // Check cooldown (prevent rapid withdrawals)
  const recentWithdraw = withdrawRequests
    .filter(w => w.userId === req.userId && w.status === 'PENDING')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  if (recentWithdraw) {
    const hoursSinceLastWithdraw = (new Date().getTime() - new Date(recentWithdraw.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastWithdraw < 24) {
      return res.status(400).json({ error: 'Please wait 24 hours between withdrawal requests' });
    }
  }

  // Create withdraw request
  const withdrawRequest = {
    id: `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    amount: withdrawAmount,
    paymentMethodId,
    paymentMethod: paymentMethod,
    notes: notes || null,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  withdrawRequests.push(withdrawRequest);

  // Create transaction: WITHDRAW_REQUEST
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    type: 'WITHDRAW_REQUEST',
    amount: -withdrawAmount, // Negative for withdrawal
    description: `Withdrawal request to ${paymentMethod.label}`,
    status: 'PENDING',
    relatedEntityId: withdrawRequest.id,
    createdAt: new Date().toISOString(),
    date: new Date().toISOString()
  };

  // OPTIMIZATION: Use helper function to maintain indexes
  addTransaction(transaction);

  res.status(201).json({ withdrawRequest, transaction });
});

// Get my withdraw requests
app.get('/api/wallet/withdraws', verifyToken, requireRole(['clipper']), (req, res) => {
  const userWithdraws = withdrawRequests
    .filter(w => w.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ withdrawRequests: userWithdraws });
});

// Create transaction (for approved submissions - legacy)
app.post('/api/transactions', verifyToken, (req, res) => {
  const { type, amount, description } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (type === 'withdrawal') {
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    user.balance -= amount;
  } else if (type === 'earning') {
    // Move from pending to balance
    if (user.pendingBalance < amount) {
      return res.status(400).json({ error: 'Insufficient pending balance' });
    }
    user.pendingBalance -= amount;
    user.balance += amount;
  }

  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    type,
    amount: type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount),
    description: description || '',
    status: type === 'withdrawal' ? 'pending' : 'completed',
    date: new Date().toISOString()
  };

  transactions.push(transaction);
  res.status(201).json({ transaction });
});

// ==================== ADMIN DASHBOARD ====================

// Get admin stats
app.get('/api/admin/stats', verifyToken, requireRole(['admin']), (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeCampaigns = campaigns.filter(c => {
    const deadline = new Date(c.deadline);
    return deadline > now && c.status === 'active';
  });

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const flaggedSubmissions = submissions.filter(s => s.flagged === true);

  const submissionsToday = submissions.filter(s => {
    const submitted = new Date(s.submittedAt);
    return submitted >= today;
  });

  const payoutToday = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      return txDate >= today && t.type === 'withdrawal' && t.status === 'completed';
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const payoutWeek = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      return txDate >= weekAgo && t.type === 'withdrawal' && t.status === 'completed';
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalPendingPayout = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'pending')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  res.json({
    totalUsers: users.length,
    activeCampaigns: activeCampaigns.length,
    totalCampaigns: campaigns.length,
    pendingSubmissions: pendingSubmissions.length,
    submissionsToday: submissionsToday.length,
    flaggedSubmissions: flaggedSubmissions.length,
    approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
    totalSubmissions: submissions.length,
    payoutToday,
    payoutWeek,
    totalPendingPayout,
    totalBalance,
    totalEarnings: transactions
      .filter(t => t.type === 'earning' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  });
});

// ==================== ADMIN USER MANAGEMENT ====================

// Get all users (Admin only)
app.get('/api/admin/users', verifyToken, requireRole(['admin']), (req, res) => {
  const userList = users.map(u => {
    const userSubmissions = submissions.filter(s => s.userId === u.id);
    const approved = userSubmissions.filter(s => s.status === 'approved').length;
    const approvalRate = userSubmissions.length > 0
      ? Math.round((approved / userSubmissions.length) * 100)
      : 0;

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      balance: u.balance,
      pendingBalance: u.pendingBalance,
      totalSubmissions: userSubmissions.length,
      approvedSubmissions: approved,
      approvalRate,
      createdAt: u.createdAt
    };
  });

  res.json({ users: userList });
});

// Get single user details (Admin only)
app.get('/api/admin/users/:id', verifyToken, requireRole(['admin']), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userSubmissions = submissions.filter(s => s.userId === user.id);
  const userTransactions = transactions.filter(t => t.userId === user.id);

  res.json({
    ...user,
    submissions: userSubmissions,
    transactions: userTransactions
  });
});

// Update user status (Admin only) - suspend, blacklist, activate
app.patch('/api/admin/users/:id/status', verifyToken, requireRole(['admin']), (req, res) => {
  const { status } = req.body; // 'active', 'suspended', 'blacklisted'
  if (!['active', 'suspended', 'blacklisted'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldStatus = user.status;
  user.status = status;

  logAudit(req.userId, 'UPDATE_USER_STATUS', {
    userId: user.id,
    oldStatus,
    newStatus: status
  });

  res.json({ user });
});

// Update user role (Admin only)
app.patch('/api/admin/users/:id/role', verifyToken, requireRole(['admin']), (req, res) => {
  const { role } = req.body;
  if (!['admin', 'clipper', 'influencer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldRole = user.role;
  user.role = role;

  logAudit(req.userId, 'UPDATE_USER_ROLE', {
    userId: user.id,
    oldRole,
    newRole: role
  });

  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Verify/Unverify influencer (Admin only)
app.patch('/api/admin/users/:id/verify', verifyToken, requireRole(['admin']), (req, res) => {
  const { verified } = req.body;

  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role !== 'influencer') {
    return res.status(400).json({ error: 'Only influencers can be verified' });
  }

  const oldVerified = user.verified || false;
  user.verified = verified === true;
  if (user.verified) {
    user.status = 'verified';
  } else {
    user.status = 'active';
  }

  logAudit(req.userId, verified ? 'VERIFY_INFLUENCER' : 'UNVERIFY_INFLUENCER', {
    userId: user.id,
    email: user.email
  });

  res.json({ user });
});

// Adjust user balance (Admin only)
app.patch('/api/admin/users/:id/balance', verifyToken, requireRole(['admin']), (req, res) => {
  const { amount, type, reason } = req.body; // type: 'add' or 'subtract'

  if (!amount || !type || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (type === 'add') {
    user.balance += parseFloat(amount);
  } else if (type === 'subtract') {
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    user.balance -= parseFloat(amount);
  }

  logAudit(req.userId, 'ADJUST_USER_BALANCE', {
    userId: user.id,
    type,
    amount: parseFloat(amount),
    reason
  });

  res.json({ user });
});

// ==================== ADMIN WITHDRAW MANAGEMENT ====================

// Get all withdraw requests (Admin only)
app.get('/api/admin/withdraws', verifyToken, requireRole(['admin']), (req, res) => {
  const status = req.query.status; // Optional filter: PENDING, APPROVED, REJECTED

  let requests = withdrawRequests;
  if (status) {
    requests = requests.filter(w => w.status === status);
  }

  // Add user info
  const requestsWithUser = requests.map(request => {
    const user = users.find(u => u.id === request.userId);
    return {
      ...request,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      } : null
    };
  });

  // Sort by created date (newest first)
  requestsWithUser.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({ withdrawRequests: requestsWithUser });
});

// Get single withdraw request (Admin only)
// BUG FIX: Ensure route exists and is properly defined
app.get('/api/admin/withdraws/:id', verifyToken, requireRole(['admin']), (req, res) => {
  const request = withdrawRequests.find(w => w.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Withdraw request not found' });
  }

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(request.userId);
  // OPTIMIZATION: Use indexed transactions if available
  const userTransactions = transactionsByUserId.get(request.userId) || [];
  // OPTIMIZATION: Use indexed submissions if available
  const userSubmissionIds = submissionsByUserId.get(request.userId);
  const userSubmissions = userSubmissionIds
    ? Array.from(userSubmissionIds).map(id => submissionsById.get(id)).filter(Boolean)
    : submissions.filter(s => s.userId === request.userId);

  res.json({
    ...request,
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status
    } : null,
    userStats: {
      totalTransactions: userTransactions.length,
      totalSubmissions: userSubmissions.length,
      approvedSubmissions: userSubmissions.filter(s => s.status === 'approved' || s.status === 'APPROVED').length
    }
  });
});

// Approve withdraw request (Admin only)
app.post('/api/admin/withdraws/:id/approve', verifyToken, requireRole(['admin']), (req, res) => {
  const request = withdrawRequests.find(w => w.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Withdraw request not found' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot approve request with status: ${request.status}` });
  }

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(request.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update request
  request.status = 'APPROVED';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = req.userId;

  // Create transaction: WITHDRAW_APPROVED
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: request.userId,
    type: 'WITHDRAW_APPROVED',
    amount: -request.amount, // Negative
    description: `Withdrawal approved - ${request.paymentMethod?.label || 'Payment method'}`,
    status: 'completed',
    relatedEntityId: request.id,
    createdAt: new Date().toISOString(),
    date: new Date().toISOString()
  };

  // OPTIMIZATION: Use helper function to maintain indexes
  addTransaction(transaction);

  logAudit(req.userId, 'APPROVE_WITHDRAW', {
    withdrawRequestId: request.id,
    userId: request.userId,
    amount: request.amount
  });

  res.json({ withdrawRequest: request, transaction });
});

// Reject withdraw request (Admin only)
app.post('/api/admin/withdraws/:id/reject', verifyToken, requireRole(['admin']), (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const request = withdrawRequests.find(w => w.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Withdraw request not found' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot reject request with status: ${request.status}` });
  }

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const user = usersById.get(request.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update request
  request.status = 'REJECTED';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = req.userId;
  request.rejectionReason = reason;

  // Create transaction: WITHDRAW_REJECTED (return funds)
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: request.userId,
    type: 'WITHDRAW_REJECTED',
    amount: request.amount, // Positive (return funds)
    description: `Withdrawal rejected - ${reason}`,
    status: 'completed',
    relatedEntityId: request.id,
    createdAt: new Date().toISOString(),
    date: new Date().toISOString()
  };

  // OPTIMIZATION: Use helper function to maintain indexes
  addTransaction(transaction);

  logAudit(req.userId, 'REJECT_WITHDRAW', {
    withdrawRequestId: request.id,
    userId: request.userId,
    amount: request.amount,
    reason
  });

  res.json({ withdrawRequest: request, transaction });
});

// BUG FIX: Mark withdrawal as paid (Admin only)
app.post('/api/admin/withdraws/:id/mark-paid', verifyToken, requireRole(['admin']), (req, res) => {
  const request = withdrawRequests.find(w => w.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Withdraw request not found' });
  }

  if (request.status !== 'APPROVED') {
    return res.status(400).json({ error: `Can only mark approved withdrawals as paid. Current status: ${request.status}` });
  }

  // Update request
  request.status = 'PAID';
  request.paidAt = new Date().toISOString();
  request.paidBy = req.userId;
  saveData();

  logAudit(req.userId, 'MARK_WITHDRAW_PAID', {
    withdrawRequestId: request.id,
    userId: request.userId,
    amount: request.amount
  });

  res.json({
    message: 'Withdrawal marked as paid',
    withdrawRequest: request
  });
});

// Admin wallet adjustment
app.post('/api/admin/wallet/adjust', verifyToken, requireRole(['admin']), (req, res) => {
  const { userId, amount, type, reason } = req.body; // type: 'add' or 'subtract'

  if (!userId || !amount || !type || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const adjustAmount = parseFloat(amount);
  const transactionAmount = type === 'add' ? adjustAmount : -adjustAmount;

  // Create transaction: ADMIN_ADJUSTMENT
  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'ADMIN_ADJUSTMENT',
    amount: transactionAmount,
    description: `Admin adjustment: ${reason}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    date: new Date().toISOString()
  };

  transactions.push(transaction);

  logAudit(req.userId, 'ADMIN_WALLET_ADJUSTMENT', {
    userId,
    type,
    amount: adjustAmount,
    reason
  });

  res.json({ transaction });
});

// ==================== ADMIN TRANSACTION MANAGEMENT ====================

// Update transaction status (Admin only) - mark payout as paid
app.patch('/api/admin/transactions/:id/status', verifyToken, requireRole(['admin']), (req, res) => {
  const { status } = req.body; // 'pending', 'completed', 'cancelled'

  const transaction = transactions.find(t => t.id === req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const oldStatus = transaction.status;
  transaction.status = status;

  // If marking as completed, update user balance
  if (status === 'completed' && oldStatus === 'pending' && transaction.type === 'withdrawal') {
    // Balance already deducted on creation, so nothing to do
  }

  // If cancelling, refund balance
  if (status === 'cancelled' && oldStatus === 'pending' && transaction.type === 'withdrawal') {
    const user = users.find(u => u.id === transaction.userId);
    if (user) {
      user.balance += Math.abs(transaction.amount);
    }
  }

  logAudit(req.userId, 'UPDATE_TRANSACTION_STATUS', {
    transactionId: transaction.id,
    oldStatus,
    newStatus: status
  });

  res.json({ transaction });
});

// ==================== ADMIN INFLUENCER REVIEW ====================

// Get all influencer applications (Admin only)
app.get('/api/admin/influencers', verifyToken, requireRole(['admin']), (req, res) => {
  const status = req.query.status; // Optional filter: PENDING_REVIEW, VERIFIED, REJECTED

  let profiles = influencerProfiles;
  if (status) {
    profiles = profiles.filter(p => p.status === status);
  }

  // Add user info
  const profilesWithUser = profiles.map(profile => {
    const user = users.find(u => u.id === profile.userId);
    return {
      ...profile,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      } : null
    };
  });

  // Sort by submitted date (newest first)
  profilesWithUser.sort((a, b) =>
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  res.json({ influencers: profilesWithUser });
});

// Get single influencer application (Admin only)
app.get('/api/admin/influencers/:id', verifyToken, requireRole(['admin']), (req, res) => {
  const profile = influencerProfiles.find(p => p.id === req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Influencer application not found' });
  }

  const user = users.find(u => u.id === profile.userId);
  res.json({
    ...profile,
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    } : null
  });
});

// Approve influencer application (Admin only)
app.post('/api/admin/influencers/:id/approve', verifyToken, requireRole(['admin']), (req, res) => {
  const profile = influencerProfiles.find(p => p.id === req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Influencer application not found' });
  }

  if (profile.status === 'VERIFIED') {
    return res.status(400).json({ error: 'Application already approved' });
  }

  const user = users.find(u => u.id === profile.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update profile
  profile.status = 'VERIFIED';
  profile.reviewedAt = new Date().toISOString();
  profile.reviewedBy = req.userId;

  // Update user
  user.influencerStatus = 'VERIFIED';
  user.verified = true;
  // User can now activate influencer role if they want

  logAudit(req.userId, 'APPROVE_INFLUENCER', {
    influencerId: profile.id,
    userId: profile.userId,
    influencerName: profile.influencerName
  });

  res.json({ profile, user });
});

// Reject influencer application (Admin only)
app.post('/api/admin/influencers/:id/reject', verifyToken, requireRole(['admin']), (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const profile = influencerProfiles.find(p => p.id === req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Influencer application not found' });
  }

  if (profile.status === 'VERIFIED') {
    return res.status(400).json({ error: 'Cannot reject an approved application' });
  }

  const user = users.find(u => u.id === profile.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update profile
  profile.status = 'REJECTED';
  profile.reviewedAt = new Date().toISOString();
  profile.reviewedBy = req.userId;
  profile.rejectionReason = reason;

  // Update user
  user.influencerStatus = 'REJECTED';
  user.verified = false;

  logAudit(req.userId, 'REJECT_INFLUENCER', {
    influencerId: profile.id,
    userId: profile.userId,
    influencerName: profile.influencerName,
    reason
  });

  res.json({ profile, user });
});

// ==================== TRUST SCORE ENDPOINTS ====================

// Get clipper trust score
app.get('/api/clipper/trust-score', verifyToken, requireRole(['clipper']), (req, res) => {
  const trustScore = getTrustScore(req.userId);
  res.json({ trustScore });
});

// Get trust score history
app.get('/api/clipper/trust-score/history', verifyToken, requireRole(['clipper']), (req, res) => {
  const trustScore = getTrustScore(req.userId);
  res.json({
    history: trustScore.history || [],
    currentScore: trustScore.score,
    tier: trustScore.tier
  });
});

// ==================== WEB BALANCE ENDPOINTS ====================

// Get clipper web balance
app.get('/api/clipper/web-balance', verifyToken, requireRole(['clipper']), (req, res) => {
  const balance = getWebBalance(req.userId);
  res.json({
    balance: balance.balance || 0,
    lastUpdated: balance.lastUpdated
  });
});

// Get web balance ledger
app.get('/api/clipper/web-balance/ledger', verifyToken, requireRole(['clipper']), (req, res) => {
  const ledger = webBalanceLedger
    .filter(entry => entry.userId === req.userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 100); // Last 100 entries

  res.json({ ledger });
});

// ==================== CLIPPER CAMPAIGNS ENDPOINTS ====================

// Get clipper's campaigns (active, ending soon, completed, expired)
app.get('/api/clipper/campaigns', verifyToken, requireRole(['clipper']), (req, res) => {
  const relations = campaignClipperRelations.filter(r => r.clipperId === req.userId);
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const activeCampaigns = [];
  const endingSoonCampaigns = [];
  const completedCampaigns = [];
  const expiredCampaigns = [];

  relations.forEach(relation => {
    const campaign = campaignsById.get(relation.campaignId);
    if (!campaign) return;

    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
    const hasSubmissions = submissions.some(s =>
      s.campaignId === campaign.id && (s.userId === req.userId || s.clipperId === req.userId)
    );

    if (campaign.status === 'ACTIVE' && (!endDate || endDate > now)) {
      const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      if (endDate && endDate <= threeDaysFromNow) {
        endingSoonCampaigns.push({
          ...campaign,
          relation,
          daysLeft,
          submissionCount: submissions.filter(s =>
            s.campaignId === campaign.id && (s.userId === req.userId || s.clipperId === req.userId)
          ).length
        });
      } else {
        activeCampaigns.push({
          ...campaign,
          relation,
          daysLeft,
          submissionCount: submissions.filter(s =>
            s.campaignId === campaign.id && (s.userId === req.userId || s.clipperId === req.userId)
          ).length
        });
      }
    } else if (campaign.status === 'COMPLETED' || (endDate && endDate <= now)) {
      if (hasSubmissions) {
        completedCampaigns.push({
          ...campaign,
          relation,
          submissionCount: submissions.filter(s =>
            s.campaignId === campaign.id && (s.userId === req.userId || s.clipperId === req.userId)
          ).length
        });
      } else {
        expiredCampaigns.push({
          ...campaign,
          relation,
          submissionCount: 0
        });
      }
    }
  });

  res.json({
    active: activeCampaigns,
    endingSoon: endingSoonCampaigns,
    completed: completedCampaigns,
    expired: expiredCampaigns
  });
});

// ==================== WITHDRAWAL ENDPOINTS ====================

// Request withdrawal (Clipper)
app.post('/api/clipper/withdrawals', verifyToken, requireRole(['clipper']), (req, res) => {
  const { amount, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  if (!paymentMethod || !paymentMethod.type) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  // Get web balance
  const balance = getWebBalance(req.userId);
  if ((balance.balance || 0) < amount) {
    return res.status(400).json({ error: 'Insufficient web balance' });
  }

  // Get trust score
  const trustScore = getTrustScore(req.userId);

  // Get submission history
  const clipperSubmissions = submissions.filter(s =>
    s.userId === req.userId || s.clipperId === req.userId
  );

  // Get flag history
  const flagHistory = [];
  clipperSubmissions.forEach(sub => {
    if (sub.fraudFlags?.autoFlags?.length > 0) {
      sub.fraudFlags.autoFlags.forEach(flag => {
        flagHistory.push({ type: 'AUTO', reason: flag.reason });
      });
    }
    if (sub.fraudFlags?.manualFlags?.length > 0) {
      sub.fraudFlags.manualFlags.forEach(flag => {
        flagHistory.push({ type: 'MANUAL', reason: flag.reason });
      });
    }
  });

  // Get withdrawal pattern
  const previousWithdrawals = withdrawRequests.filter(w => w.userId === req.userId);
  const withdrawalPattern = {
    totalWithdrawals: previousWithdrawals.length,
    totalAmount: previousWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
    frequency: previousWithdrawals.length > 0
      ? (new Date() - new Date(previousWithdrawals[0].requestedAt)) / (1000 * 60 * 60 * 24) / previousWithdrawals.length
      : 0
  };

  const withdrawal = {
    id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    amount: parseFloat(amount),
    paymentMethod,
    status: 'PENDING',
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    trustScoreAtRequest: trustScore.score,
    submissionHistory: clipperSubmissions.map(s => ({
      submissionId: s.id,
      status: s.status
    })),
    flagHistory,
    withdrawalPattern,
    paidAt: null,
    invoiceId: null,
    requestedAt: new Date().toISOString(),
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  withdrawRequests.push(withdrawal);

  // Add initial status history entry
  const initialStatusHistory = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'REQUESTED',
    timestamp: withdrawal.requestedAt,
    actor: 'SYSTEM',
    actorId: null,
    description: 'Withdrawal request created',
    metadata: {
      ipAddress: withdrawal.ipAddress,
      userAgent: withdrawal.userAgent
    }
  };
  withdrawalStatusHistory.push(initialStatusHistory);

  // Add auto risk evaluation status
  const riskEvalStatus = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'PENDING_REVIEW',
    timestamp: new Date().toISOString(),
    actor: 'SYSTEM',
    actorId: null,
    description: 'Auto risk evaluation completed',
    metadata: {
      trustScore: trustScore.score,
      riskTier: trustScore.tier
    }
  };
  withdrawalStatusHistory.push(riskEvalStatus);

  saveData();

  res.status(201).json({
    withdrawal,
    message: 'Withdrawal request submitted. It will be reviewed by an admin.'
  });
});

// Get clipper withdrawal history
app.get('/api/clipper/withdrawals', verifyToken, requireRole(['clipper']), (req, res) => {
  const userWithdrawals = withdrawRequests
    .filter(w => w.userId === req.userId)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  res.json({ withdrawals: userWithdrawals });
});

// Get all withdrawal requests (Admin)
app.get('/api/admin/withdrawals', verifyToken, requireRole(['admin']), (req, res) => {
  const { status } = req.query;
  let allWithdrawals = withdrawRequests;

  if (status) {
    allWithdrawals = allWithdrawals.filter(w => w.status === status.toUpperCase());
  }

  // Sort by requested date (newest first)
  allWithdrawals = allWithdrawals.sort((a, b) =>
    new Date(b.requestedAt || b.createdAt) - new Date(a.requestedAt || a.createdAt)
  );

  // Add user info
  const withdrawalsWithUserInfo = allWithdrawals.map(w => {
    const user = usersById.get(w.userId);
    return {
      ...w,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email
      } : null
    };
  });

  res.json({ withdrawals: withdrawalsWithUserInfo });
});

// Get comprehensive withdrawal detail (Admin or Clipper - own only)
app.get('/api/withdrawals/:id', verifyToken, (req, res) => {
  const withdrawal = withdrawRequests.find(w => w.id === req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal not found' });
  }

  // Access control: Clippers can only view their own, Admins can view all
  const user = usersById.get(req.userId);
  if (user.role !== 'admin' && withdrawal.userId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get user info
  const clipper = usersById.get(withdrawal.userId);
  const clipperSnapshot = clipper ? {
    id: clipper.id,
    username: clipper.username || clipper.name,
    email: clipper.email ? clipper.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'N/A',
    accountAge: clipper.createdAt ? Math.floor((new Date() - new Date(clipper.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
    trustScore: withdrawal.trustScoreAtRequest || 0,
    riskTier: withdrawal.trustScoreAtRequest >= 86 ? 'LOW' : withdrawal.trustScoreAtRequest >= 61 ? 'MEDIUM' : 'HIGH'
  } : null;

  // Get status history
  const statusHistory = withdrawalStatusHistory
    .filter(h => h.withdrawalId === withdrawal.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Get admin action logs
  const adminLogs = withdrawalAdminLogs
    .filter(l => l.withdrawalId === withdrawal.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(log => {
      const admin = usersById.get(log.adminId);
      return {
        ...log,
        adminName: admin?.name || 'Unknown Admin',
        adminEmail: admin?.email ? admin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'N/A'
      };
    });

  // Get web balance snapshot
  const balanceSnapshot = {
    before: null,
    after: null
  };
  const balanceBeforeEntry = statusHistory.find(h => h.metadata?.balanceBefore !== undefined);
  const balanceAfterEntry = statusHistory.find(h => h.metadata?.balanceAfter !== undefined);
  if (balanceBeforeEntry) balanceSnapshot.before = balanceBeforeEntry.metadata.balanceBefore;
  if (balanceAfterEntry) balanceSnapshot.after = balanceAfterEntry.metadata.balanceAfter;

  // Get ledger entries
  const ledgerEntries = webBalanceLedger
    .filter(l => l.relatedEntityId === withdrawal.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Get submission stats
  const clipperSubmissions = submissions.filter(s =>
    s.userId === withdrawal.userId || s.clipperId === withdrawal.userId
  );
  const submissionStats = {
    total: clipperSubmissions.length,
    approved: clipperSubmissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length,
    rejected: clipperSubmissions.filter(s => s.status === 'REJECTED').length,
    flagged: clipperSubmissions.filter(s => s.fraudFlags?.autoFlags?.length > 0 || s.fraudFlags?.manualFlags?.length > 0).length
  };

  // Get campaign stats
  const joinedCampaigns = campaignClipperRelations.filter(r => r.clipperId === withdrawal.userId);

  // Get trust score history (last 90 days)
  const trustScoreHistory = []; // Placeholder - would come from trust score engine

  // Get withdrawal pattern
  const allUserWithdrawals = withdrawRequests.filter(w => w.userId === withdrawal.userId);
  const withdrawalVelocity = {
    totalWithdrawals: allUserWithdrawals.length,
    totalAmount: allUserWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
    averageAmount: allUserWithdrawals.length > 0
      ? allUserWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0) / allUserWithdrawals.length
      : 0,
    frequency: withdrawal.withdrawalPattern?.frequency || 0
  };

  // Get invoice info
  const invoice = withdrawal.invoiceId ? {
    id: withdrawal.invoiceId,
    number: withdrawal.invoiceId,
    generatedAt: withdrawal.paidAt,
    downloadUrl: `/api/invoices/${withdrawal.invoiceId}/download` // Placeholder
  } : null;

  // Get system notes
  const systemNotes = [];
  if (withdrawal.flagHistory && withdrawal.flagHistory.length > 0) {
    withdrawal.flagHistory.forEach(flag => {
      systemNotes.push({
        type: 'FRAUD_FLAG',
        source: flag.type === 'AUTO' ? 'Fraud Engine' : 'Admin Manual',
        message: flag.reason,
        timestamp: withdrawal.requestedAt
      });
    });
  }

  // Mask payment method details for security
  const maskedPaymentMethod = withdrawal.paymentMethod ? {
    ...withdrawal.paymentMethod,
    accountNumber: withdrawal.paymentMethod.accountNumber
      ? withdrawal.paymentMethod.accountNumber.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
      : null,
    ewalletNumber: withdrawal.paymentMethod.ewalletNumber
      ? withdrawal.paymentMethod.ewalletNumber.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
      : null,
    accountName: withdrawal.paymentMethod.accountName
      ? withdrawal.paymentMethod.accountName.replace(/(.{2}).*(.{2})/, '$1***$2')
      : null
  } : null;

  // Calculate estimated payout time
  let estimatedPayoutTime = null;
  if (withdrawal.status === 'APPROVED' || withdrawal.status === 'PAYOUT_PROCESSING') {
    const approvedDate = new Date(withdrawal.reviewedAt || withdrawal.paidAt);
    estimatedPayoutTime = new Date(approvedDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 business days
  }

  res.json({
    withdrawal: {
      ...withdrawal,
      paymentMethod: maskedPaymentMethod
    },
    clipperSnapshot,
    statusHistory,
    adminLogs,
    balanceSnapshot,
    ledgerEntries,
    submissionStats,
    campaignStats: {
      totalJoined: joinedCampaigns.length
    },
    trustScoreHistory,
    withdrawalVelocity,
    invoice,
    systemNotes,
    estimatedPayoutTime: estimatedPayoutTime ? estimatedPayoutTime.toISOString() : null
  });
});

// Approve withdrawal (Admin)
app.patch('/api/admin/withdrawals/:id/approve', verifyToken, requireRole(['admin']), (req, res) => {
  const withdrawal = withdrawRequests.find(w => w.id === req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal request not found' });
  }

  if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PENDING_REVIEW' && withdrawal.status !== 'UNDER_REVIEW') {
    return res.status(400).json({ error: `Cannot approve withdrawal with status: ${withdrawal.status}` });
  }

  // Check web balance
  const balance = getWebBalance(withdrawal.userId);
  const balanceBefore = balance.balance || 0;
  if (balanceBefore < withdrawal.amount) {
    return res.status(400).json({ error: 'User has insufficient web balance' });
  }

  // Debit web balance
  try {
    debitWebBalance(
      withdrawal.userId,
      withdrawal.amount,
      'WITHDRAWAL',
      withdrawal.id,
      `Withdrawal approved: ${withdrawal.amount}`
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const balanceAfter = getWebBalance(withdrawal.userId).balance || 0;
  const oldStatus = withdrawal.status;

  // Update withdrawal
  withdrawal.status = 'APPROVED';
  withdrawal.reviewedAt = new Date().toISOString();
  withdrawal.reviewedBy = req.userId;
  withdrawal.paidAt = new Date().toISOString();
  withdrawal.invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add status history entry
  const statusHistoryEntry = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'APPROVED',
    timestamp: withdrawal.reviewedAt,
    actor: 'ADMIN',
    actorId: req.userId,
    description: 'Withdrawal approved by admin',
    metadata: {
      previousStatus: oldStatus,
      balanceBefore,
      balanceAfter
    }
  };
  withdrawalStatusHistory.push(statusHistoryEntry);

  // Add payout processing status
  const payoutStatusEntry = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'PAYOUT_PROCESSING',
    timestamp: withdrawal.paidAt,
    actor: 'SYSTEM',
    actorId: null,
    description: 'Payout processing initiated',
    metadata: {
      invoiceId: withdrawal.invoiceId
    }
  };
  withdrawalStatusHistory.push(payoutStatusEntry);

  // Add paid status
  const paidStatusEntry = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'PAID',
    timestamp: new Date().toISOString(),
    actor: 'SYSTEM',
    actorId: null,
    description: 'Payout completed',
    metadata: {}
  };
  withdrawalStatusHistory.push(paidStatusEntry);
  withdrawal.status = 'PAID';

  // Add admin action log
  const adminLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    timestamp: withdrawal.reviewedAt,
    adminId: req.userId,
    actionType: 'APPROVE',
    reason: null,
    evidenceReference: null,
    metadata: {
      amount: withdrawal.amount,
      userId: withdrawal.userId,
      invoiceId: withdrawal.invoiceId
    }
  };
  withdrawalAdminLogs.push(adminLogEntry);

  // Audit log
  logAudit(req.userId, 'APPROVE_WITHDRAWAL', {
    withdrawalId: withdrawal.id,
    userId: withdrawal.userId,
    amount: withdrawal.amount
  });

  saveData();

  res.json({
    withdrawal,
    message: 'Withdrawal approved and processed'
  });
});

// Reject withdrawal (Admin)
app.patch('/api/admin/withdrawals/:id/reject', verifyToken, requireRole(['admin']), (req, res) => {
  const { reason } = req.body;
  const withdrawal = withdrawRequests.find(w => w.id === req.params.id);

  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal request not found' });
  }

  if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PENDING_REVIEW' && withdrawal.status !== 'UNDER_REVIEW') {
    return res.status(400).json({ error: `Cannot reject withdrawal with status: ${withdrawal.status}` });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const oldStatus = withdrawal.status;
  withdrawal.status = 'REJECTED';
  withdrawal.reviewedAt = new Date().toISOString();
  withdrawal.reviewedBy = req.userId;
  withdrawal.rejectionReason = reason;

  // Add status history entry
  const statusHistoryEntry = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    status: 'REJECTED',
    timestamp: withdrawal.reviewedAt,
    actor: 'ADMIN',
    actorId: req.userId,
    description: `Withdrawal rejected: ${reason}`,
    metadata: {
      previousStatus: oldStatus,
      reason
    }
  };
  withdrawalStatusHistory.push(statusHistoryEntry);

  // Add admin action log
  const adminLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    timestamp: withdrawal.reviewedAt,
    adminId: req.userId,
    actionType: 'REJECT',
    reason,
    evidenceReference: null,
    metadata: {
      amount: withdrawal.amount,
      userId: withdrawal.userId
    }
  };
  withdrawalAdminLogs.push(adminLogEntry);

  // Audit log
  logAudit(req.userId, 'REJECT_WITHDRAWAL', {
    withdrawalId: withdrawal.id,
    userId: withdrawal.userId,
    amount: withdrawal.amount,
    reason
  });

  saveData();

  res.json({
    withdrawal,
    message: 'Withdrawal rejected'
  });
});

// Flag withdrawal for investigation (Admin)
app.post('/api/admin/withdrawals/:id/flag', verifyToken, requireRole(['admin']), (req, res) => {
  const { reason, evidenceReference } = req.body;
  const withdrawal = withdrawRequests.find(w => w.id === req.params.id);

  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal request not found' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Flag reason is required' });
  }

  // Update status to UNDER_INVESTIGATION if not already
  const oldStatus = withdrawal.status;
  if (withdrawal.status !== 'UNDER_INVESTIGATION') {
    withdrawal.status = 'UNDER_INVESTIGATION';

    // Add status history entry
    const statusHistoryEntry = {
      id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      withdrawalId: withdrawal.id,
      status: 'UNDER_INVESTIGATION',
      timestamp: new Date().toISOString(),
      actor: 'ADMIN',
      actorId: req.userId,
      description: `Withdrawal flagged for investigation: ${reason}`,
      metadata: {
        previousStatus: oldStatus,
        reason
      }
    };
    withdrawalStatusHistory.push(statusHistoryEntry);
  }

  // Add admin action log
  const adminLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    withdrawalId: withdrawal.id,
    timestamp: new Date().toISOString(),
    adminId: req.userId,
    actionType: 'FLAG',
    reason,
    evidenceReference: evidenceReference || null,
    metadata: {
      amount: withdrawal.amount,
      userId: withdrawal.userId
    }
  };
  withdrawalAdminLogs.push(adminLogEntry);

  // Audit log
  logAudit(req.userId, 'FLAG_WITHDRAWAL', {
    withdrawalId: withdrawal.id,
    userId: withdrawal.userId,
    amount: withdrawal.amount,
    reason
  });

  saveData();

  res.json({
    withdrawal,
    message: 'Withdrawal flagged for investigation'
  });
});

// ==================== ADMIN AUDIT LOG ====================

// Get audit logs (Admin only)
app.get('/api/admin/audit-logs', verifyToken, requireRole(['admin']), (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = auditLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map(log => {
      const admin = users.find(u => u.id === log.adminId);
      return {
        ...log,
        adminName: admin?.name || 'Unknown'
      };
    });

  res.json({ logs });
});

// ==================== ADMIN CAMPAIGN MANAGEMENT ====================

// Get campaigns pending admin action
app.get('/api/admin/campaigns/pending', verifyToken, requireRole(['admin']), (req, res) => {
  // Get all campaigns that need admin attention
  const pendingCampaigns = campaigns.map(campaign => {
    const creator = users.find(u => u.id === campaign.createdBy);
    const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
    const totalViews = campaignSubmissions.reduce((sum, s) => sum + (s.views || 0), 0);
    const paidBudget = campaignSubmissions
      .filter(s => s.payoutStatus === 'PAID')
      .reduce((sum, s) => sum + (s.payout || 0), 0);

    return {
      ...campaign,
      creatorName: creator?.name,
      creatorEmail: creator?.email,
      // Add creator budget information
      creatorBudget: creator?.budget || 0,
      creatorLockedBudget: creator?.lockedBudget || 0,
      creatorAvailableBudget: (creator?.budget || 0) - (creator?.lockedBudget || 0),
      submissions: campaignSubmissions.length,
      totalViews,
      paidBudget,
      remainingBudget: campaign.totalBudget ? campaign.totalBudget - paidBudget : null,
      // Computed flags for UI
      needsFinancials: campaign.status === 'PENDING_APPROVAL' && (!campaign.ratePer1kViews || campaign.ratePer1kViews <= 0),
      hasPauseRequest: campaign.pauseRequested === true,
      hasCloseRequest: campaign.closeRequested === true,
    };
  });

  res.json({ campaigns: pendingCampaigns });
});

// Set financial terms for a campaign (Admin only)
app.post('/api/admin/campaigns/:id/set-financials', verifyToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { cpm, ratePer1kViews, minEligibleViews, maxPayableViewsPerClip, totalBudget, minDeposit } = req.body;

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Update financial fields
  // Handle CPM and ratePer1kViews - ensure at least one is always set
  if (cpm !== undefined && cpm !== null && cpm !== '') {
    campaign.cpm = parseFloat(cpm);
    // Auto-calculate ratePer1kViews from CPM if ratePer1kViews is not provided or is null/empty
    if (!ratePer1kViews || ratePer1kViews === null || ratePer1kViews === '') {
      campaign.ratePer1kViews = parseFloat(cpm) * 1000;
    }
  }
  if (ratePer1kViews !== undefined && ratePer1kViews !== null && ratePer1kViews !== '') {
    campaign.ratePer1kViews = parseFloat(ratePer1kViews);
    // Auto-calculate CPM if CPM is not provided or is null/empty
    if (!cpm || cpm === null || cpm === '') {
      campaign.cpm = parseFloat(ratePer1kViews) / 1000;
    }
  }
  if (minEligibleViews !== undefined) campaign.minEligibleViews = parseInt(minEligibleViews);
  if (maxPayableViewsPerClip !== undefined && maxPayableViewsPerClip !== null) {
    campaign.maxPayableViewsPerClip = parseInt(maxPayableViewsPerClip);
  }
  if (totalBudget !== undefined) campaign.totalBudget = parseFloat(totalBudget);
  if (minDeposit !== undefined && minDeposit !== null) campaign.minDeposit = parseFloat(minDeposit);

  campaign.financialsSetAt = new Date().toISOString();
  saveData();

  logAudit(req.userId, 'SET_CAMPAIGN_FINANCIALS', `Set financials for campaign: ${campaign.title}`, {
    campaignId: id,
    cpm: campaign.cpm,
    totalBudget: campaign.totalBudget
  });

  res.json({
    message: 'Financial terms updated',
    campaign
  });
});

// Approve campaign and activate it (Admin only)
app.post('/api/admin/campaigns/:id/approve', verifyToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ error: 'Only pending campaigns can be approved' });
  }

  // BUG FIX: Check both ratePer1kViews and cpm (either can be set)
  // Financial terms are valid if either ratePer1kViews OR cpm is set
  const hasRate = campaign.ratePer1kViews && campaign.ratePer1kViews > 0;
  const hasCpm = campaign.cpm && campaign.cpm > 0;

  if (!hasRate && !hasCpm) {
    return res.status(400).json({ error: 'Please set financial terms (CPM or rate per 1k views) before approving' });
  }

  if (!campaign.totalBudget || campaign.totalBudget <= 0) {
    return res.status(400).json({ error: 'Please set total budget before approving' });
  }

  campaign.status = 'ACTIVE';
  campaign.isPublic = true; // ALWAYS make campaign visible in marketplace when approved
  // Ensure remainingBudget is set correctly
  if (campaign.remainingBudget === undefined || campaign.remainingBudget === null || campaign.remainingBudget <= 0) {
    campaign.remainingBudget = campaign.totalBudget || 0;
  }
  // Ensure autoCloseOnBudgetExhausted is set (default to true if not set)
  if (campaign.autoCloseOnBudgetExhausted === undefined || campaign.autoCloseOnBudgetExhausted === null) {
    campaign.autoCloseOnBudgetExhausted = true;
  }
  campaign.approvedAt = new Date().toISOString();
  campaign.approvedBy = req.userId;
  campaign.updatedAt = new Date().toISOString();

  console.log('APPROVE CAMPAIGN:', {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    isPublic: campaign.isPublic,
    totalBudget: campaign.totalBudget,
    remainingBudget: campaign.remainingBudget,
    autoCloseOnBudgetExhausted: campaign.autoCloseOnBudgetExhausted
  });

  saveData();

  logAudit(req.userId, 'APPROVE_CAMPAIGN', `Approved campaign: ${campaign.title}`, {
    campaignId: id,
    influencerId: campaign.createdBy
  });

  res.json({
    message: 'Campaign approved and activated',
    campaign
  });
});

// Reject campaign (Admin only)
app.post('/api/admin/campaigns/:id/reject', verifyToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  campaign.status = 'REJECTED';
  campaign.rejectionReason = reason;
  campaign.rejectedAt = new Date().toISOString();
  campaign.rejectedBy = req.userId;
  saveData();

  logAudit(req.userId, 'REJECT_CAMPAIGN', `Rejected campaign: ${campaign.title}`, {
    campaignId: id,
    reason,
    influencerId: campaign.createdBy
  });

  res.json({
    message: 'Campaign rejected',
    campaign
  });
});

// Request changes - send campaign back to draft with feedback (Admin only)
app.post('/api/admin/campaigns/:id/request-changes', verifyToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaign.status = 'DRAFT';
  campaign.adminFeedback = feedback || 'Please review and resubmit';
  campaign.submittedAt = null; // Clear submission timestamp
  saveData();

  logAudit(req.userId, 'REQUEST_CAMPAIGN_CHANGES', `Requested changes for campaign: ${campaign.title}`, {
    campaignId: id,
    feedback,
    influencerId: campaign.createdBy
  });

  res.json({
    message: 'Campaign sent back for changes',
    campaign
  });
});

// Pause campaign (Admin only - usually from influencer request)
app.post('/api/admin/campaigns/:id/pause', verifyToken, requireRole(['admin']), (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Only active campaigns can be paused' });
  }

  campaign.status = 'PAUSED';
  campaign.pausedAt = new Date().toISOString();
  campaign.pausedBy = req.userId;
  campaign.pauseRequested = false; // Clear the request flag
  campaign.updatedAt = new Date().toISOString();
  saveData();

  logAudit(req.userId, 'PAUSE_CAMPAIGN', `Paused campaign: ${campaign.title}`, {
    campaignId: req.params.id,
    influencerId: campaign.createdBy
  });

  res.json({
    message: 'Campaign paused',
    campaign
  });
});

// BUG FIX: Resume campaign route (Admin only)
app.post('/api/admin/campaigns/:id/resume', verifyToken, requireRole(['admin']), (req, res) => {
  // OPTIMIZATION: Use Map lookup - O(1) instead of O(n)
  const campaign = campaignsById.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status !== 'PAUSED') {
    return res.status(400).json({ error: 'Only paused campaigns can be resumed' });
  }

  campaign.status = 'ACTIVE';
  campaign.resumedAt = new Date().toISOString();
  campaign.resumedBy = req.userId;
  campaign.updatedAt = new Date().toISOString();
  saveData();

  logAudit(req.userId, 'RESUME_CAMPAIGN', `Resumed campaign: ${campaign.title}`, {
    campaignId: req.params.id,
    influencerId: campaign.createdBy
  });

  res.json({
    message: 'Campaign resumed',
    campaign
  });
});

// Close campaign and refund unused budget (Admin only)
app.post('/api/admin/campaigns/:id/close', verifyToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (!['ACTIVE', 'PAUSED'].includes(campaign.status)) {
    return res.status(400).json({ error: 'Only active or paused campaigns can be closed' });
  }

  // Calculate unused budget
  const campaignSubmissions = submissions.filter(s => s.campaignId === id);
  const paidBudget = campaignSubmissions
    .filter(s => s.payoutStatus === 'PAID')
    .reduce((sum, s) => sum + (s.payout || 0), 0);

  const unusedBudget = (campaign.totalBudget || 0) - paidBudget;

  // Refund unused budget to influencer
  if (unusedBudget > 0 && campaign.createdBy) {
    const influencer = users.find(u => u.id === campaign.createdBy);
    if (influencer) {
      influencer.balance = (influencer.balance || 0) + unusedBudget;

      // Log transaction
      transactions.push({
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: campaign.createdBy,
        type: 'REFUND',
        amount: unusedBudget,
        description: `Refund from closed campaign: ${campaign.title}`,
        relatedCampaignId: id,
        createdAt: new Date().toISOString(),
        status: 'COMPLETED'
      });
    }
  }

  campaign.status = 'CLOSED';
  campaign.closedAt = new Date().toISOString();
  campaign.closedBy = req.userId;
  campaign.closeRequested = false; // Clear the request flag
  campaign.refundedAmount = unusedBudget;
  saveData();

  logAudit(req.userId, 'CLOSE_CAMPAIGN', `Closed campaign: ${campaign.title}`, {
    campaignId: id,
    influencerId: campaign.createdBy,
    refundedAmount: unusedBudget
  });

  res.json({
    message: 'Campaign closed',
    campaign,
    refundedAmount: unusedBudget
  });
});

// ==================== INFLUENCER ENDPOINTS ====================

// Get influencer dashboard stats
app.get('/api/influencer/stats', verifyToken, requireRole(['influencer']), blockClippersFromInfluencerRoutes(), (req, res) => {
  const influencerCampaigns = campaigns.filter(c => c.createdBy === req.userId);
  const activeCampaigns = influencerCampaigns.filter(c => c.status === 'ACTIVE');

  const influencerSubmissions = submissions.filter(s =>
    influencerCampaigns.some(c => c.id === s.campaignId)
  );

  const totalViews = influencerSubmissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + s.views, 0);

  const totalBudget = influencerCampaigns.reduce((sum, c) => sum + (c.totalBudget || c.budget || 0), 0);
  const spentBudget = influencerCampaigns.reduce((sum, c) => sum + (c.paidBudget || c.spentBudget || 0), 0);

  const user = users.find(u => u.id === req.userId);
  const estimatedROI = totalViews > 0 && spentBudget > 0
    ? ((totalViews / 1000) * (influencerCampaigns[0]?.rate || 0) - spentBudget) / spentBudget * 100
    : 0;

  res.json({
    activeCampaigns: activeCampaigns.length,
    totalCampaigns: influencerCampaigns.length,
    totalViews,
    totalBudget,
    spentBudget,
    remainingBudget: user.budget || 0,
    estimatedROI: estimatedROI.toFixed(2),
    totalClips: influencerSubmissions.filter(s => s.status === 'approved').length
  });
});

// Get influencer campaigns
app.get('/api/influencer/campaigns', verifyToken, requireRole(['influencer']), blockClippersFromInfluencerRoutes(), (req, res) => {
  const influencerCampaigns = campaigns.filter(c => c.createdBy === req.userId);
  res.json({ campaigns: influencerCampaigns });
});

// Get influencer's own campaigns with computed permissions
app.get('/api/influencer/campaigns/my', verifyToken, requireRole(['influencer']), blockClippersFromInfluencerRoutes(), (req, res) => {
  try {
    // OPTIMIZATION: Use campaigns array directly (already loaded in memory)
    const influencerCampaigns = campaigns.filter(c => c.createdBy === req.userId);

    // Add computed permission fields for each campaign
    const campaignsWithPermissions = influencerCampaigns.map(campaign => {
      try {
        const financialsSet = campaign.ratePer1kViews && campaign.ratePer1kViews > 0;

        return {
          ...campaign,
          cpm: campaign.ratePer1kViews ? campaign.ratePer1kViews / 1000 : null,
          financialsSet,
          // Permissions - safely handle undefined/null values
          canEdit: campaign.status === 'DRAFT' || campaign.status === 'REJECTED',
          canSubmit: campaign.status === 'DRAFT' && !campaign.rejectionReason,
          canRequestPause: campaign.status === 'ACTIVE' && !(campaign.pauseRequested || false),
          canRequestClose: (campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && !(campaign.closeRequested || false),
          pauseRequested: campaign.pauseRequested || false,
          closeRequested: campaign.closeRequested || false,
        };
      } catch (campaignError) {
        console.error('Error processing campaign:', campaign.id, campaignError);
        // Return campaign with minimal fields if processing fails
        return {
          ...campaign,
          cpm: null,
          financialsSet: false,
          canEdit: false,
          canSubmit: false,
          canRequestPause: false,
          canRequestClose: false,
          pauseRequested: false,
          closeRequested: false,
        };
      }
    });

    res.json({ campaigns: campaignsWithPermissions });
  } catch (error) {
    console.error('Error fetching influencer campaigns:', error);
    res.status(500).json({
      error: 'Internal server error: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get influencer submissions (no clipper info)
app.get('/api/influencer/submissions', verifyToken, requireRole(['influencer']), blockClippersFromInfluencerRoutes(), (req, res) => {
  const influencerCampaigns = campaigns.filter(c => c.createdBy === req.userId);
  const influencerCampaignIds = influencerCampaigns.map(c => c.id);

  const influencerSubmissions = submissions
    .filter(s => influencerCampaignIds.includes(s.campaignId))
    .map(s => {
      const { userId, ...submissionWithoutUserId } = s;
      return submissionWithoutUserId;
    });

  res.json({ submissions: influencerSubmissions });
});

// Request new campaign (Influencer only, no budget required)
app.post('/api/influencer/campaigns/request', verifyToken, requireRole(['influencer']), (req, res) => {
  const {
    title,
    influencerName,
    description,
    allowedPlatforms,
    contentGuidelines,
    captionRequirements,
    hashtagRequirements,
    prohibitedContent,
    clipDuration,
    targetViews,
    startDate,
    endDate,
    isPublic,
    allowUnlimitedClippers,
    maxClippers,
    maxClipsPerUser
  } = req.body;

  // Validation
  if (!title || !influencerName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!allowedPlatforms || !Array.isArray(allowedPlatforms) || allowedPlatforms.length === 0) {
    return res.status(400).json({ error: 'At least one platform must be selected' });
  }

  // Check influencer
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.verified) {
    return res.status(403).json({ error: 'Only verified influencers can request campaigns' });
  }

  try {
    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      influencerName,
      description: description || '',
      thumbnail: null, // Could add upload later
      allowedPlatforms: allowedPlatforms.map(p => p.toLowerCase()),
      // Financials set by Admin later
      ratePer1kViews: 0,
      minEligibleViews: 0,
      maxPayableViewsPerClip: null,
      totalBudget: 0,
      reservedBudget: 0,
      paidBudget: 0,
      remainingBudget: 0,
      // Content Rules
      contentGuidelines: contentGuidelines || '',
      captionRequirements: captionRequirements || '',
      hashtagRequirements: hashtagRequirements || '',
      prohibitedContent: prohibitedContent || '',
      clipDuration: clipDuration || null, // New field
      targetViews: targetViews || 0, // New field (optional target)
      // Timeline
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      // Settings
      autoCloseOnBudgetExhausted: true,
      isPublic: isPublic !== false, // Default true
      allowUnlimitedClippers: allowUnlimitedClippers !== false,
      maxClippers: maxClippers || null,
      maxClipsPerUser: maxClipsPerUser || null,
      // Metadata
      status: 'PENDING_APPROVAL', // Waiting for Admin to set budget and approve
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
      platform: allowedPlatforms[0].toLowerCase(), // Primary platform for icon
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        clippers: 0,
        clips: 0
      }
    };

    campaigns.push(campaign);
    // OPTIMIZATION: Update index when adding campaign
    campaignsById.set(campaign.id, campaign);
    saveData();

    console.log('Campaign request created:', { campaignId: campaign.id, userId: req.userId });

    return res.status(201).json({
      message: 'Campaign request submitted successfully',
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign request:', error);
    res.status(500).json({
      error: `Server Error: ${error.message}`,
      stack: error.stack // Optional: for debugging
    });
  }
});

// Submit campaign for approval (change from DRAFT to PENDING_APPROVAL)
app.post('/api/influencer/campaigns/:id/submit', verifyToken, requireRole(['influencer']), (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'Not authorized to modify this campaign' });
  }

  if (campaign.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Only draft campaigns can be submitted for approval' });
  }

  campaign.status = 'PENDING_APPROVAL';
  campaign.submittedAt = new Date().toISOString();
  saveData();

  res.json({
    message: 'Campaign submitted for approval',
    campaign
  });
});

// Request pause for active campaign
app.post('/api/influencer/campaigns/:id/request-pause', verifyToken, requireRole(['influencer']), (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'Not authorized to modify this campaign' });
  }

  if (campaign.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Only active campaigns can be paused' });
  }

  campaign.pauseRequested = true;
  campaign.pauseRequestedAt = new Date().toISOString();
  saveData();

  res.json({
    message: 'Pause request submitted',
    campaign
  });
});

// Request close for active or paused campaign
app.post('/api/influencer/campaigns/:id/request-close', verifyToken, requireRole(['influencer']), (req, res) => {
  const { id } = req.params;
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'Not authorized to modify this campaign' });
  }

  if (campaign.status !== 'ACTIVE' && campaign.status !== 'PAUSED') {
    return res.status(400).json({ error: 'Only active or paused campaigns can be closed' });
  }

  campaign.closeRequested = true;
  campaign.closeRequestedAt = new Date().toISOString();
  saveData();

  res.json({
    message: 'Close request submitted',
    campaign
  });
});

// Top up budget (Influencer only)
app.post('/api/influencer/topup', verifyToken, requireRole(['influencer']), (req, res) => {
  const { amount } = req.body;

  console.log('Topup request:', { userId: req.userId, amount });

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const user = users.find(u => u.id === req.userId);
  console.log('User found:', user ? { id: user.id, role: user.role, influencerStatus: user.influencerStatus } : 'NOT FOUND');

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'Your user account could not be found. Please try logging in again.',
      userId: req.userId
    });
  }

  // Initialize budget if it doesn't exist
  if (user.budget === undefined || user.budget === null) {
    user.budget = 0;
  }

  user.budget = user.budget + parseFloat(amount);

  // Create transaction record
  const transaction = {
    id: `topup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    type: 'topup',
    amount: parseFloat(amount),
    description: 'Budget Top Up',
    status: 'completed',
    date: new Date().toISOString()
  };

  transactions.push(transaction);
  saveData();

  console.log('Topup successful:', { userId: req.userId, newBudget: user.budget });

  res.json({
    budget: user.budget,
    transaction
  });
});

// Get wallet info (Influencer only)
app.get('/api/influencer/wallet', verifyToken, requireRole(['influencer']), (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize budget if needed
  if (user.budget === undefined || user.budget === null) {
    user.budget = 0;
  }

  // Calculate locked budget (budget reserved for active/pending campaigns)
  const userCampaigns = campaigns.filter(c => c.createdBy === req.userId);
  const lockedBudget = userCampaigns
    .filter(c => c.status === 'ACTIVE' || c.status === 'PENDING_APPROVAL')
    .reduce((sum, c) => sum + (c.totalBudget || 0), 0);

  const availableBudget = user.budget - lockedBudget;

  res.json({
    budget: user.budget,
    lockedBudget: lockedBudget,
    availableBudget: Math.max(0, availableBudget)
  });
});

// Get top up history (Influencer only)
app.get('/api/influencer/topup-history', verifyToken, requireRole(['influencer']), (req, res) => {
  const topupTransactions = transactions
    .filter(t => t.userId === req.userId && t.type === 'topup')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ transactions: topupTransactions });
});

// ==================== INFLUENCER ONBOARDING ====================

// Apply to become influencer
app.post('/api/influencer/apply', verifyToken, (req, res) => {
  const {
    influencerName,
    influencerType,
    platformsOwned,
    primaryPlatform,
    channelUrl,
    followerCount,
    reasonForCampaigns,
    estimatedBudget,
    contactPersonName,
    preferredContactMethod,
    contactDetail,
    analyticsScreenshot,
    mediaKitUrl
  } = req.body;

  // Validation
  if (!influencerName || !channelUrl || !reasonForCampaigns || !contactPersonName || !contactDetail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!platformsOwned || !Array.isArray(platformsOwned) || platformsOwned.length === 0) {
    return res.status(400).json({ error: 'At least one platform must be selected' });
  }

  if (!primaryPlatform) {
    return res.status(400).json({ error: 'Primary platform is required' });
  }

  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user already has a pending or verified application
  const existingProfile = influencerProfiles.find(p => p.userId === req.userId);
  if (existingProfile) {
    if (existingProfile.status === 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'You already have a pending application' });
    }
    if (existingProfile.status === 'VERIFIED') {
      return res.status(400).json({ error: 'You are already a verified influencer' });
    }
    // If rejected, allow reapplication
  }

  const profile = {
    id: `influencer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId,
    influencerName,
    influencerType: influencerType || 'PERSONAL',
    platformsOwned,
    primaryPlatform,
    channelUrl,
    followerCount: followerCount ? parseInt(followerCount) : null,
    reasonForCampaigns,
    estimatedBudget: estimatedBudget || null,
    contactPersonName,
    preferredContactMethod: preferredContactMethod || 'EMAIL',
    contactDetail,
    analyticsScreenshot: analyticsScreenshot || null,
    mediaKitUrl: mediaKitUrl || null,
    status: 'PENDING_REVIEW',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    createdAt: new Date().toISOString()
  };

  // Update or create profile
  if (existingProfile) {
    const index = influencerProfiles.findIndex(p => p.userId === req.userId);
    influencerProfiles[index] = { ...existingProfile, ...profile, id: existingProfile.id };
  } else {
    influencerProfiles.push(profile);
  }

  // Update user influencer status
  user.influencerStatus = 'PENDING_REVIEW';
  // Don't set role yet - wait for approval

  res.status(201).json({ profile });
});

// Get influencer application status
app.get('/api/influencer/status', verifyToken, (req, res) => {
  const profile = influencerProfiles.find(p => p.userId === req.userId);
  const user = users.find(u => u.id === req.userId);

  if (!profile) {
    return res.status(404).json({ error: 'No influencer application found' });
  }

  res.json({
    status: profile.status,
    submittedAt: profile.submittedAt,
    reviewedAt: profile.reviewedAt,
    rejectionReason: profile.rejectionReason,
    profile: {
      influencerName: profile.influencerName,
      influencerType: profile.influencerType,
      primaryPlatform: profile.primaryPlatform,
      channelUrl: profile.channelUrl
    }
  });
});

// Set user role (for clipper selection)
app.post('/api/auth/set-role', verifyToken, (req, res) => {
  const { role } = req.body;

  // Validate role
  if (!['clipper', 'influencer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "clipper" or "influencer".' });
  }

  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // ROLE-LOCK: Prevent role changes if already set
  if (user.role !== null && user.role !== undefined) {
    return res.status(403).json({
      error: 'Role already set',
      message: 'Your role is permanent and cannot be changed.',
      currentRole: user.role,
      lockedAt: user.roleLockedAt
    });
  }

  // Set role permanently
  user.role = role;
  user.roleLockedAt = new Date().toISOString();

  // Initialize role-specific fields
  if (role === 'influencer') {
    user.influencerStatus = 'NOT_APPLIED'; // Will change to PENDING_REVIEW after onboarding
    user.verified = false; // Will become true after admin approval
  } else if (role === 'clipper') {
    user.influencerStatus = 'NOT_APPLIED';
    user.verified = false;
  }

  // Audit log
  logAudit(user.id, 'ROLE_SELECTED', {
    role: role,
    timestamp: user.roleLockedAt,
    userId: user.id
  });

  console.log(`User ${user.email} selected role: ${role} at ${user.roleLockedAt}`);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      influencerStatus: user.influencerStatus,
      verified: user.verified,
      roleLockedAt: user.roleLockedAt
    }
  });
});

// Get campaign performance report (Influencer only)
app.get('/api/influencer/campaigns/:id/report', verifyToken, requireRole(['influencer']), blockClippersFromInfluencerRoutes(), (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.createdBy !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
  const approvedSubmissions = campaignSubmissions.filter(s => s.status === 'approved');

  const performance = {
    campaign: {
      ...campaign,
      // Remove sensitive info
      createdBy: undefined
    },
    totalClips: approvedSubmissions.length,
    totalViews: approvedSubmissions.reduce((sum, s) => sum + s.views, 0),
    totalLikes: approvedSubmissions.reduce((sum, s) => sum + s.likes, 0),
    budgetUsed: campaign.spentBudget,
    budgetRemaining: campaign.budget - campaign.spentBudget,
    clips: approvedSubmissions.map(s => ({
      id: s.id,
      title: s.title,
      thumbnail: s.thumbnail,
      videoUrl: s.videoUrl,
      views: s.views,
      likes: s.likes,
      platform: campaign.platform,
      submittedAt: s.submittedAt
      // NO clipper info
    }))
  };

  res.json({ report: performance });
});

// Initialize with persistent data
if (!loadData()) {
  // If no data loaded (first run), initialize with default data
  if (users.length === 0) {
    console.log('Initializing default data...');

    const adminUser = {
      id: 'admin_1',
      email: 'admin@clipflow.com',
      password: 'admin123', // Change this in production!
      name: 'Admin User',
      role: 'admin',
      balance: 0,
      pendingBalance: 0,
      budget: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);

    // Add a default influencer for testing (verified)
    const influencerUser = {
      id: 'influencer_1',
      email: 'influencer@clipflow.com',
      password: 'influencer123',
      name: 'Influencer User',
      role: 'influencer',
      balance: 0,
      pendingBalance: 0,
      budget: 10000, // Starting budget
      status: 'verified',
      verified: true,
      influencerStatus: 'VERIFIED',
      createdAt: new Date().toISOString()
    };
    users.push(influencerUser);

    // Save initial state
    saveData();
    // OPTIMIZATION: Rebuild indexes after creating default data
    rebuildIndexes();
  }
}

// OPTIMIZATION: Ensure indexes are built even if no data file exists
if (users.length > 0 || campaigns.length > 0 || submissions.length > 0) {
  rebuildIndexes();
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
