import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Clock,
  User,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Shield,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface Submission {
  id: string;
  userId: string;
  campaignId: string;
  platform: string;
  videoUrl: string;
  videoId: string;
  channelName?: string;
  channelId?: string;
  title?: string;
  thumbnail?: string;
  views: number;
  likes: number;
  comments?: number;
  shares?: number;
  reward: number;
  status: string;
  flagged?: boolean;
  flagReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  clipper?: {
    id: string;
    name: string;
    email: string;
    status: string;
    totalSubmissions: number;
    approvedSubmissions: number;
  };
  campaign?: {
    title: string;
    cpm: number;
  };
  riskScore?: number;
  eligibleViews?: number;
  payoutBreakdown?: {
    grossPayout: number;
    platformFee: number;
    netPayout: number;
  };
  ruleChecks?: {
    durationCheck: boolean;
    hashtagCheck: boolean;
    uploadWindowCheck: boolean;
    creditMentionCheck: boolean;
  };
}

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/submissions/${id}`);
      setSubmission(data.submission);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load submission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this submission? Reward will be credited to clipper.")) return;

    try {
      setProcessing(true);
      await api.patch(`/submissions/${id}/approve`, { status: "approved" });
      toast({
        title: "Success",
        description: "Submission approved successfully",
      });
      loadSubmission();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/submissions/${id}/approve`, {
        status: "rejected",
        reason: rejectReason,
      });
      toast({
        title: "Success",
        description: "Submission rejected",
      });
      setShowRejectModal(false);
      setRejectReason("");
      // BUG FIX: Reload submission to get updated status, then navigate back to list
      await loadSubmission();
      // Navigate back to submission queue after a short delay to show updated status
      setTimeout(() => {
        navigate('/admin/submissions');
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a flag reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/submissions/${id}/flag`, {
        flagged: true,
        reason: flagReason,
      });
      toast({
        title: "Success",
        description: "Submission flagged for review",
      });
      setShowFlagModal(false);
      setFlagReason("");
      loadSubmission();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to flag",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshMetrics = async () => {
    try {
      setProcessing(true);
      toast({
        title: "Refreshing",
        description: "Fetching latest metrics from platform API...",
      });
      // Mock API call - in production, this would fetch real-time data
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Metrics Updated",
        description: "Latest metrics fetched successfully",
      });
      loadSubmission();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh metrics",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Submission Detail" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading submission...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!submission) {
    return (
      <AdminLayout>
        <AdminHeader title="Submission Not Found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Submission not found</p>
            <Link to="/admin/submissions">
              <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all">
                Back to Queue
              </button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
    approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
    rejected: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
  };

  const config = statusConfig[submission.status] || statusConfig.pending;

  const platformLabels: Record<string, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
  };

  const riskLevel = submission.riskScore
    ? submission.riskScore < 30
      ? "LOW"
      : submission.riskScore < 70
        ? "MEDIUM"
        : "HIGH"
    : "UNKNOWN";

  const riskColors: Record<string, { bg: string; text: string }> = {
    LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400" },
    HIGH: { bg: "bg-red-500/10", text: "text-red-400" },
    UNKNOWN: { bg: "bg-zinc-500/10", text: "text-zinc-400" },
  };

  const engagementRate =
    submission.views > 0
      ? ((submission.likes + (submission.comments || 0)) / submission.views) * 100
      : 0;

  return (
    <AdminLayout>
      <AdminHeader title="Submission Detail" />

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin/submissions">
            <button className="text-xs text-zinc-400 hover:text-white mb-4 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Back to Queue
            </button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Submission Review</h1>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} border-${config.text.replace("text-", "")}/20`}
                >
                  {config.label}
                </span>
                {submission.flagged && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-400/20">
                    <Flag className="w-3 h-3 mr-1" />
                    Flagged
                  </span>
                )}
                <span className="text-zinc-500 text-sm">ID: {submission.id}</span>
              </div>
            </div>

            {/* Actions */}
            {submission.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={handleRefreshMetrics}
                  disabled={processing}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setShowFlagModal(true)}
                  disabled={processing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" />
                  Flag
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Info */}
            <div className="glass-panel-v2 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Video Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Platform</label>
                  <p className="text-white font-medium">{platformLabels[submission.platform.toLowerCase()] || submission.platform}</p>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Video ID</label>
                  <p className="text-white text-sm font-mono">{submission.videoId}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-zinc-500 text-xs block mb-1">Video URL</label>
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {submission.videoUrl}
                  </a>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Campaign</label>
                  <p className="text-white">{submission.campaign?.title || "N/A"}</p>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Submitted</label>
                  <p className="text-white text-sm">
                    {format(new Date(submission.submittedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Analytics */}
            <div className="glass-panel-v2 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Live Analytics</h2>
                <span className="text-xs text-zinc-500">Auto-refreshed</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-zinc-500 text-xs">Views</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{(submission.views || 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-zinc-500 text-xs">Likes</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{(submission.likes || 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-zinc-500 text-xs">Comments</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{(submission.comments || 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-500 text-xs">Engagement</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{engagementRate.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Rule Validation */}
            <div className="glass-card-primary rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Campaign Rule Validation</h2>
              <div className="space-y-3">
                {submission.ruleChecks ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Duration Requirement</span>
                      {submission.ruleChecks.durationCheck ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Required Hashtags</span>
                      {submission.ruleChecks.hashtagCheck ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Upload Time Window</span>
                      {submission.ruleChecks.uploadWindowCheck ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Credit Mention</span>
                      {submission.ruleChecks.creditMentionCheck ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500 text-sm">Rule validation pending...</p>
                )}
              </div>
            </div>

            {/* Payout Breakdown */}
            <div className="glass-card-primary rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Payout Calculation</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Campaign CPM</span>
                  <span className="text-white font-medium">
                    {formatCurrency(submission.campaign?.cpm || 50000)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Total Views</span>
                  <span className="text-white">{(submission.views || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Eligible Views</span>
                  <span className="text-emerald-400 font-medium">
                    {(submission.eligibleViews || submission.views || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Gross Payout</span>
                    <span className="text-white font-medium">
                      {formatCurrency(submission.payoutBreakdown?.grossPayout || submission.reward)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Platform Fee (2.5%)</span>
                    <span className="text-red-400">
                      -{formatCurrency(submission.payoutBreakdown?.platformFee || submission.reward * 0.025)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">Net Payout</span>
                    <span className="text-emerald-400 text-lg font-bold">
                      {formatCurrency(submission.payoutBreakdown?.netPayout || submission.reward * 0.975)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Assessment */}
            <div className="glass-card-primary rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risk Assessment
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">Risk Score</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[riskLevel].bg} ${riskColors[riskLevel].text}`}
                    >
                      {riskLevel}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${riskLevel === "LOW"
                        ? "bg-emerald-500"
                        : riskLevel === "MEDIUM"
                          ? "bg-amber-500"
                          : "bg-red-500"
                        }`}
                      style={{ width: `${submission.riskScore || 0}%` }}
                    />
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">Score: {submission.riskScore || 0}/100</p>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <p>• View growth velocity: Normal</p>
                  <p>• Engagement ratio: {engagementRate.toFixed(2)}%</p>
                  <p>• Account verified: Yes</p>
                </div>
              </div>
            </div>

            {/* Clipper Info */}
            {submission.clipper && (
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Clipper Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Name</label>
                    <p className="text-white text-sm">{submission.clipper.name}</p>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Email</label>
                    <p className="text-white text-sm">{submission.clipper.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-zinc-500">Submissions</p>
                      <p className="text-white font-semibold">{submission.clipper.totalSubmissions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Approved</p>
                      <p className="text-emerald-400 font-semibold">{submission.clipper.approvedSubmissions}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Submitted</p>
                    <p className="text-zinc-500 text-xs">
                      {format(new Date(submission.submittedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                {submission.reviewedAt && (
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${submission.status === "approved" ? "bg-emerald-500" : "bg-red-500"
                        }`}
                    />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {submission.status === "approved" ? "Approved" : "Rejected"}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {format(new Date(submission.reviewedAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Flagged Info */}
            {submission.flagged && submission.flagReason && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                <h2 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Flagged for Review
                </h2>
                <p className="text-zinc-300 text-sm">{submission.flagReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <h3 className="text-white font-semibold mb-4">Reject Submission</h3>
            <div className="mb-4">
              <label className="text-zinc-400 text-sm block mb-2">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a detailed reason..."
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Reject Submission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <h3 className="text-white font-semibold mb-4">Flag Submission</h3>
            <div className="mb-4">
              <label className="text-zinc-400 text-sm block mb-2">Flag Reason</label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Fraud suspicion, rule violation, etc..."
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={processing || !flagReason.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                {processing ? "Flagging..." : "Flag Submission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SubmissionDetail;
