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
    Calendar,
    DollarSign,
    Eye,
    FileText,
    Flag,
    Hash,
    MapPin,
    Megaphone,
    Pause,
    Play,
    TrendingUp,
    User,
    X,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";

interface Campaign {
    id: string;
    title: string;
    description?: string;
    influencerName?: string;
    allowedPlatforms?: string[];
    ratePer1kViews?: number;
    cpm?: number;
    minEligibleViews?: number;
    maxPayableViewsPerClip?: number;
    totalBudget?: number;
    paidBudget?: number;
    remainingBudget?: number;
    reservedBudget?: number;
    totalViews: number;
    status: string;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    createdBy?: string;
    rules?: {
        clipFormat?: string;
        cta?: string;
        requiredHashtags?: string[];
        prohibitedContent?: string[];
    };
    submissions?: number;
}

const CampaignDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showFinancialModal, setShowFinancialModal] = useState(false);
    const [financials, setFinancials] = useState({
        cpm: "",
        ratePer1kViews: "",
        minEligibleViews: "",
        maxPayableViewsPerClip: "",
        totalBudget: "",
    });
    const [savingFinancials, setSavingFinancials] = useState(false);

    useEffect(() => {
        if (id) {
            loadCampaign();
        }
    }, [id]);

    const loadCampaign = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/campaigns/${id}`);
            const campaignData = data.campaign || data;
            setCampaign(campaignData);
            // Pre-fill financials form
            setFinancials({
                cpm: campaignData.cpm?.toString() || "",
                ratePer1kViews: campaignData.ratePer1kViews?.toString() || "",
                minEligibleViews: campaignData.minEligibleViews?.toString() || "",
                maxPayableViewsPerClip: campaignData.maxPayableViewsPerClip?.toString() || "",
                totalBudget: campaignData.totalBudget?.toString() || "",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load campaign",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFinancials = async () => {
        try {
            setSavingFinancials(true);
            await api.post(`/admin/campaigns/${id}/set-financials`, financials);
            toast({
                title: "Success",
                description: "Financial terms updated successfully",
            });
            setShowFinancialModal(false);
            loadCampaign();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update financial terms",
                variant: "destructive",
            });
        } finally {
            setSavingFinancials(false);
        }
    };

    const handleAction = async (action: string, payload?: any) => {
        try {
            await api.post(`/admin/campaigns/${id}/${action}`, payload);
            toast({
                title: "Success",
                description: `Campaign ${action}d successfully`,
            });
            loadCampaign();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${action} campaign`,
                variant: "destructive",
            });
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection",
                variant: "destructive",
            });
            return;
        }

        await handleAction("reject", { reason: rejectReason });
        setShowRejectModal(false);
        setRejectReason("");
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminHeader title="Campaign Detail" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading campaign...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!campaign) {
        return (
            <AdminLayout>
                <AdminHeader title="Campaign Not Found" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-zinc-400">Campaign not found</p>
                        <Link
                            to="/admin/campaigns"
                            className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block"
                        >
                            ← Back to Campaigns
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        DRAFT: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Draft" },
        PENDING_APPROVAL: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending Approval" },
        ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
        PAUSED: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Paused" },
        CLOSED: { bg: "bg-red-500/10", text: "text-red-400", label: "Closed" },
    };

    const config = statusConfig[campaign.status] || statusConfig.DRAFT;
    const budgetUsed = campaign.totalBudget && campaign.totalBudget > 0
        ? ((campaign.paidBudget || 0) / campaign.totalBudget) * 100
        : 0;

    return (
        <AdminLayout>
            <AdminHeader title={campaign.title} />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Header */}
                <div className="mb-6">
                    <Link to="/admin/campaigns">
                        <button className="text-xs text-zinc-400 hover:text-white mb-4 flex items-center gap-1 transition-colors">
                            <ArrowLeft className="w-3 h-3" />
                            Back to Campaigns
                        </button>
                    </Link>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{campaign.title}</h1>
                            <div className="flex items-center gap-3 text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} border-${config.text.replace("text-", "")}/20`}>
                                    {config.label}
                                </span>
                                <span className="text-zinc-500">ID: {campaign.id}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {campaign.status === "PENDING_APPROVAL" && (
                                <>
                                    <button
                                        onClick={() => handleAction("approve")}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </>
                            )}
                            {campaign.status === "ACTIVE" && (
                                <button
                                    onClick={() => handleAction("pause")}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                >
                                    <Pause className="w-4 h-4" />
                                    Pause
                                </button>
                            )}
                            {campaign.status === "PAUSED" && (
                                <button
                                    onClick={() => handleAction("resume")}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Resume
                                </button>
                            )}
                            {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
                                <button
                                    onClick={() => handleAction("close")}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* General Information */}
                        <div className="glass-panel-v2 rounded-xl p-6">
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Megaphone className="w-4 h-4" />
                                General Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Campaign Name</label>
                                    <p className="text-white">{campaign.title}</p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Description</label>
                                    <p className="text-zinc-300 text-sm">{campaign.description || "No description"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-500 text-xs block mb-1">Influencer</label>
                                        <p className="text-white">{campaign.influencerName || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-xs block mb-1">Platforms</label>
                                        <div className="flex gap-2">
                                            {campaign.allowedPlatforms?.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-500 text-xs block mb-1">Start Date</label>
                                        <p className="text-zinc-300 text-sm">
                                            {campaign.startDate ? format(new Date(campaign.startDate), "MMM dd, yyyy") : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-xs block mb-1">End Date</label>
                                        <p className="text-zinc-300 text-sm">
                                            {campaign.endDate ? format(new Date(campaign.endDate), "MMM dd, yyyy") : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Details (Admin Only) */}
                        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-semibold flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Financial Details
                            </h2>
                                <button
                                    onClick={() => setShowFinancialModal(true)}
                                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-all"
                                >
                                    Edit Financials
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">CPM (Cost Per Mille)</label>
                                    <p className="text-white text-lg font-bold">
                                        {campaign.cpm ? formatCurrency(campaign.cpm) : "Not set"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Rate per 1K Views</label>
                                    <p className="text-white text-lg font-bold">
                                        {formatCurrency(campaign.ratePer1kViews || 0)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Min Views</label>
                                    <p className="text-white text-lg font-bold">
                                        {(campaign.minEligibleViews || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Max Payable Views</label>
                                    <p className="text-white text-lg font-bold">
                                        {(campaign.maxPayableViewsPerClip || 0).toLocaleString() || "Unlimited"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Total Budget</label>
                                    <p className="text-white text-lg font-bold">
                                        {formatCurrency(campaign.totalBudget || 0)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Remaining Budget</label>
                                    <p className="text-emerald-400 text-lg font-bold">
                                        {formatCurrency(campaign.remainingBudget || 0)}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-zinc-500 text-xs block mb-2">Budget Usage</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full transition-all"
                                                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-white text-sm font-medium">{budgetUsed.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                        <span>Used: {formatCurrency(campaign.paidBudget || 0)}</span>
                                        <span>Total: {formatCurrency(campaign.totalBudget || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rules & Brief */}
                        {campaign.rules && (
                            <div className="glass-panel-v2 rounded-xl p-6">
                                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Rules & Brief
                                </h2>
                                <div className="space-y-4">
                                    {campaign.rules.clipFormat && (
                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Clip Format</label>
                                            <p className="text-zinc-300 text-sm">{campaign.rules.clipFormat}</p>
                                        </div>
                                    )}
                                    {campaign.rules.cta && (
                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Call to Action</label>
                                            <p className="text-zinc-300 text-sm">{campaign.rules.cta}</p>
                                        </div>
                                    )}
                                    {campaign.rules.requiredHashtags && campaign.rules.requiredHashtags.length > 0 && (
                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-2">Required Hashtags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.rules.requiredHashtags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-xs"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {campaign.rules.prohibitedContent && campaign.rules.prohibitedContent.length > 0 && (
                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-2">Prohibited Content</label>
                                            <div className="flex flex-wrap gap-2">
                                                {campaign.rules.prohibitedContent.map((item, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Stats & Performance */}
                    <div className="space-y-6">
                        {/* Performance Stats */}
                        <div className="glass-card-primary rounded-xl p-6">
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Performance
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                                    <div className="text-zinc-400 text-xs mb-1">Total Views</div>
                                    <div className="text-white text-2xl font-bold">
                                        {(campaign.totalViews || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                    <div className="text-zinc-400 text-xs mb-1">Submissions</div>
                                    <div className="text-white text-2xl font-bold">
                                        {campaign.submissions || 0}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-900/50 rounded-lg p-3">
                                        <div className="text-zinc-500 text-[10px] mb-1">Approved</div>
                                        <div className="text-emerald-400 font-bold">0</div>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-lg p-3">
                                        <div className="text-zinc-500 text-[10px] mb-1">Pending</div>
                                        <div className="text-amber-400 font-bold">0</div>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-lg p-3">
                                        <div className="text-zinc-500 text-[10px] mb-1">Rejected</div>
                                        <div className="text-red-400 font-bold">0</div>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-lg p-3">
                                        <div className="text-zinc-500 text-[10px] mb-1">Est. Cost</div>
                                        <div className="text-zinc-300 font-bold text-xs">
                                            {formatCurrency((campaign.totalViews || 0) * (campaign.ratePer1kViews || 0) / 1000)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="glass-card-primary rounded-xl p-6">
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Meta Information
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Created At</label>
                                    <p className="text-zinc-300">
                                        {format(new Date(campaign.createdAt), "MMM dd, yyyy HH:mm")}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">Created By</label>
                                    <p className="text-zinc-300">{campaign.createdBy || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-white font-semibold mb-4">Reject Campaign</h3>
                        <div className="mb-4">
                            <label className="text-zinc-400 text-sm block mb-2">Reason for Rejection</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Please provide a detailed reason..."
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 min-h-[100px]"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className=" px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                                Reject Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Settings Modal */}
            {showFinancialModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Set Financial Terms
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">CPM (Cost Per Mille)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g., 12.50"
                                        value={financials.cpm}
                                        onChange={(e) => {
                                            const cpm = e.target.value;
                                            setFinancials({ ...financials, cpm });
                                            // Auto-calculate ratePer1kViews if not set
                                            if (cpm && !financials.ratePer1kViews) {
                                                setFinancials(prev => ({ ...prev, cpm, ratePer1kViews: (parseFloat(cpm) * 1000).toString() }));
                                            }
                                        }}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Cost per 1,000 views</p>
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Rate per 1K Views</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g., 12500"
                                        value={financials.ratePer1kViews}
                                        onChange={(e) => {
                                            const rate = e.target.value;
                                            setFinancials({ ...financials, ratePer1kViews: rate });
                                            // Auto-calculate CPM if not set
                                            if (rate && !financials.cpm) {
                                                setFinancials(prev => ({ ...prev, ratePer1kViews: rate, cpm: (parseFloat(rate) / 1000).toString() }));
                                            }
                                        }}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Rate per 1,000 views</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Min Eligible Views</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 1000"
                                        value={financials.minEligibleViews}
                                        onChange={(e) => setFinancials({ ...financials, minEligibleViews: e.target.value })}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Max Payable Views per Clip</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 10000 (optional)"
                                        value={financials.maxPayableViewsPerClip}
                                        onChange={(e) => setFinancials({ ...financials, maxPayableViewsPerClip: e.target.value })}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm block mb-2">Total Budget</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 1000000"
                                    value={financials.totalBudget}
                                    onChange={(e) => setFinancials({ ...financials, totalBudget: e.target.value })}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowFinancialModal(false)}
                                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFinancials}
                                disabled={savingFinancials}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                {savingFinancials ? "Saving..." : "Save Financials"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CampaignDetail;
