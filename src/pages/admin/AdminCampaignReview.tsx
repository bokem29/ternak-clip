import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Pause,
    Play,
    X,
    ArrowLeft,
    AlertCircle,
    FileText,
    Wallet,
    Megaphone,
    Filter,
    RefreshCw
} from "lucide-react";

// V2 Admin Components
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface Campaign {
    id: string;
    title: string;
    influencerName: string;
    description: string;
    allowedPlatforms: string[];
    status: string;
    cpm: number | null;
    ratePer1kViews: number | null;
    totalBUDGET: number | null;
    minDeposit: number | null;
    minEligibleViews: number | null;
    maxPayableViewsPerClip: number | null;
    contentGuidelines: string;
    clipDuration: string | null;
    targetViews: number | null;
    submittedForApprovalAt: string | null;
    createdAt: string;
    creatorName?: string;
    creatorEmail?: string;
    creatorBudget?: number;
    creatorLockedBudget?: number;
    creatorAvailableBudget?: number;
    needsFinancials?: boolean;
    hasPauseRequest?: boolean;
    hasCloseRequest?: boolean;
}

const AdminCampaignReview = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'PENDING_APPROVAL' | 'DRAFT' | 'requests'>('all');

    // Financial form state
    const [financials, setFinancials] = useState({
        cpm: '',
        ratePer1kViews: '',
        minEligibleViews: '1000',
        maxPayableViewsPerClip: '',
        totalBudget: '',
        minDeposit: ''
    });

    const [rejectionReason, setRejectionReason] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        loadCampaigns();
    }, [filter]);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/campaigns/pending');
            let filtered = data.campaigns || [];

            if (filter === 'PENDING_APPROVAL') {
                filtered = filtered.filter((c: Campaign) => c.status === 'PENDING_APPROVAL');
            } else if (filter === 'DRAFT') {
                filtered = filtered.filter((c: Campaign) => c.status === 'DRAFT');
            } else if (filter === 'requests') {
                filtered = filtered.filter((c: Campaign) => c.hasPauseRequest || c.hasCloseRequest);
            }

            setCampaigns(filtered);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load campaigns',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSetFinancials = async () => {
        if (!selectedCampaign) return;

        if (!financials.cpm && !financials.ratePer1kViews) {
            toast({
                title: 'CPM Required',
                description: 'Please set CPM or rate per 1k views',
                variant: 'destructive',
            });
            return;
        }

        if (!financials.totalBudget || parseFloat(financials.totalBudget) <= 0) {
            toast({
                title: 'Budget Required',
                description: 'Please set a valid total budget',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${selectedCampaign.id}/set-financials`, {
                cpm: financials.cpm ? parseFloat(financials.cpm) : null,
                ratePer1kViews: financials.ratePer1kViews ? parseFloat(financials.ratePer1kViews) : null,
                minEligibleViews: financials.minEligibleViews ? parseInt(financials.minEligibleViews) : 1000,
                maxPayableViewsPerClip: financials.maxPayableViewsPerClip ? parseInt(financials.maxPayableViewsPerClip) : null,
                totalBudget: parseFloat(financials.totalBudget),
                minDeposit: financials.minDeposit ? parseFloat(financials.minDeposit) : null
            });

            toast({ title: 'Financial fields updated' });
            // BUG FIX: Reload campaigns first, then find and update selected campaign
            await loadCampaigns();
            // Get fresh campaign data from API to ensure we have the latest financial terms
            try {
                const campaignData = await api.get(`/campaigns/${selectedCampaign.id}`);
                if (campaignData.campaign) {
                    setSelectedCampaign(campaignData.campaign);
                    // Update financials form with saved values
                    setFinancials({
                        cpm: campaignData.campaign.cpm?.toString() || '',
                        ratePer1kViews: campaignData.campaign.ratePer1kViews?.toString() || '',
                        minEligibleViews: campaignData.campaign.minEligibleViews?.toString() || '1000',
                        maxPayableViewsPerClip: campaignData.campaign.maxPayableViewsPerClip?.toString() || '',
                        totalBudget: campaignData.campaign.totalBudget?.toString() || '',
                        minDeposit: campaignData.campaign.minDeposit?.toString() || ''
                    });
                }
            } catch (err) {
                // Fallback to finding from campaigns list
                const updated = campaigns.find(c => c.id === selectedCampaign.id);
                if (updated) setSelectedCampaign(updated);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to set financials',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedCampaign) return;
        if (!confirm('Are you sure you want to approve and activate this campaign?')) return;

        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${selectedCampaign.id}/approve`);
            toast({
                title: 'Campaign Approved',
                description: 'Campaign is now active and visible in the marketplace',
            });
            await loadCampaigns();
            setSelectedCampaign(null);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to approve campaign',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedCampaign) return;
        if (!rejectionReason.trim()) {
            toast({
                title: 'Reason Required',
                description: 'Please provide a rejection reason',
                variant: 'destructive',
            });
            return;
        }
        if (!confirm('Are you sure you want to reject this campaign?')) return;

        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${selectedCampaign.id}/reject`, { reason: rejectionReason });
            toast({ title: 'Campaign Rejected' });
            setRejectionReason('');
            await loadCampaigns();
            setSelectedCampaign(null);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reject campaign',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!selectedCampaign) return;

        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${selectedCampaign.id}/request-changes`, { feedback });
            toast({ title: 'Sent back for changes' });
            setFeedback('');
            await loadCampaigns();
            setSelectedCampaign(null);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to request changes',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handlePause = async (campaignId: string) => {
        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${campaignId}/pause`);
            toast({ title: 'Campaign Paused' });
            await loadCampaigns();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = async (campaignId: string) => {
        if (!confirm('Are you sure? This will close the campaign and refund unused budget.')) return;

        try {
            setProcessing(true);
            await api.post(`/admin/campaigns/${campaignId}/close`);
            toast({ title: 'Campaign Closed', description: 'Unused budget refunded to influencer' });
            await loadCampaigns();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
            DRAFT: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: 'Draft', icon: FileText },
            PENDING_APPROVAL: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Pending Approval', icon: Clock },
            ACTIVE: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Active', icon: CheckCircle2 },
            PAUSED: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Paused', icon: Pause },
            REJECTED: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rejected', icon: XCircle },
            CLOSED: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: 'Closed', icon: X },
        };
        const config = statusConfig[status] || { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: status, icon: null };
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
                {Icon && <Icon className="w-3 h-3" />}
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminHeader title="Campaign Review" subtitle="Review and approve influencer campaign requests" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Campaign List - Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Filter Tabs */}
                        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-2

 grid grid-cols-2 gap-2">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'PENDING_APPROVAL', label: 'Pending' },
                                { value: 'DRAFT', label: 'Drafts' },
                                { value: 'requests', label: 'Requests' },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setFilter(tab.value as any)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === tab.value
                                            ? 'bg-white text-black'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Campaigns List */}
                        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {campaigns.length === 0 ? (
                                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
                                    <p className="text-sm text-zinc-500">No campaigns found</p>
                                </div>
                            ) : (
                                campaigns.map((campaign) => (
                                    <div
                                        key={campaign.id}
                                        onClick={() => {
                                            setSelectedCampaign(campaign);
                                            setFinancials({
                                                cpm: campaign.cpm?.toString() || '',
                                                ratePer1kViews: campaign.ratePer1kViews?.toString() || '',
                                                minEligibleViews: campaign.minEligibleViews?.toString() || '1000',
                                                maxPayableViewsPerClip: campaign.maxPayableViewsPerClip?.toString() || '',
                                                totalBudget: campaign.totalBudget?.toString() || '',
                                                minDeposit: campaign.minDeposit?.toString() || ''
                                            });
                                        }}
                                        className={`bg-white/[0.03] backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all hover:border-white/30 ${selectedCampaign?.id === campaign.id
                                                ? 'border-white/50 bg-white/[0.08]'
                                                : 'border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-sm text-white line-clamp-1">{campaign.title}</h3>
                                            {getStatusBadge(campaign.status)}
                                        </div>
                                        <p className="text-xs text-zinc-500 mb-2">{campaign.creatorName || campaign.influencerName}</p>
                                        {campaign.needsFinancials && (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                <DollarSign className="w-3 h-3" />
                                                Needs Pricing
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Campaign Detail */}
                    <div className="lg:col-span-3">
                        {selectedCampaign ? (
                            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-white/10">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-2">{selectedCampaign.title}</h2>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(selectedCampaign.status)}
                                                <span className="text-sm text-zinc-400">
                                                    by {selectedCampaign.creatorName || selectedCampaign.influencerName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                    {/* Campaign Description */}
                                    {selectedCampaign.description && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-white mb-2">Campaign Description</h3>
                                            <p className="text-sm text-zinc-400 whitespace-pre-line">{selectedCampaign.description}</p>
                                        </div>
                                    )}

                                    {/* Budget Info - V2 Style */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            Influencer Budget Status
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Balance</span>
                                                <p className="text-lg font-bold text-white mt-1">
                                                    ${selectedCampaign.creatorBudget?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Available</span>
                                                <p className="text-lg font-bold text-emerald-400 mt-1">
                                                    ${selectedCampaign.creatorAvailableBudget?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Locked</span>
                                                <p className="text-lg font-bold text-blue-400 mt-1">
                                                    ${selectedCampaign.creatorLockedBudget?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Insufficient Budget Warning */}
                                        {selectedCampaign.totalBudget && selectedCampaign.creatorAvailableBudget !== undefined &&
                                            selectedCampaign.creatorAvailableBudget < selectedCampaign.totalBudget && (
                                                <div className="mt-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
                                                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                    <div className="text-xs text-yellow-500">
                                                        <strong>Warning:</strong> Influencer's available budget (${selectedCampaign.creatorAvailableBudget?.toFixed(2)})
                                                        is less than campaign budget (${selectedCampaign.totalBudget?.toFixed(2)})
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    {/* Financial Terms Form - V2 Style */}
                                    {['DRAFT', 'PENDING_APPROVAL'].includes(selectedCampaign.status) && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" />
                                                Set Financial Terms
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block">CPM (Cost Per Mille)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="e.g., 12.50"
                                                        value={financials.cpm}
                                                        onChange={(e) => setFinancials({ ...financials, cpm: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block">Total Budget ($)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="e.g., 5000"
                                                        value={financials.totalBudget}
                                                        onChange={(e) => setFinancials({ ...financials, totalBudget: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block">Min Eligible Views</label>
                                                    <input
                                                        type="number"
                                                        placeholder="1000"
                                                        value={financials.minEligibleViews}
                                                        onChange={(e) => setFinancials({ ...financials, minEligibleViews: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1.5 block">Min Deposit (Optional)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Same as budget"
                                                        value={financials.minDeposit}
                                                        onChange={(e) => setFinancials({ ...financials, minDeposit: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSetFinancials}
                                                disabled={processing}
                                                className="mt-4 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                            >
                                                {processing ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                                                Save Financial Terms
                                            </button>
                                        </div>
                                    )}

                                    {/* Show Current Financials if Set */}
                                    {selectedCampaign.cpm !== null && (
                                        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Financial Terms Set</h4>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-zinc-500 text-xs">CPM:</span>
                                                    <p className="text-white font-medium">${selectedCampaign.cpm}</p>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 text-xs">Budget:</span>
                                                    <p className="text-white font-medium">${selectedCampaign.totalBudget}</p>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 text-xs">Min Views:</span>
                                                    <p className="text-white font-medium">{selectedCampaign.minEligibleViews?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions - V2 Style */}
                                    {selectedCampaign.status === 'PENDING_APPROVAL' && (
                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={processing || selectedCampaign.cpm === null}
                                                    className="flex-1 bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    Approve & Activate
                                                </button>
                                                <button
                                                    onClick={handleRequestChanges}
                                                    disabled={processing}
                                                    className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                                                >
                                                    Request Changes
                                                </button>
                                            </div>

                                            {/* Rejection Section */}
                                            <div>
                                                <label className="text-xs text-zinc-400 mb-1.5 block">Rejection Reason (if rejecting)</label>
                                                <textarea
                                                    placeholder="Provide a reason for rejection..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none"
                                                />
                                                <button
                                                    onClick={handleReject}
                                                    disabled={processing || !rejectionReason.trim()}
                                                    className="mt-2 w-full bg-red-900/20 border border-red-500/30 hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject Campaign
                                                </button>
                                            </div>

                                            {selectedCampaign.cpm === null && (
                                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-3">
                                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-amber-500">
                                                        Set financial terms before approving this campaign.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pause/Close Requests */}
                                    {(selectedCampaign.hasPauseRequest || selectedCampaign.hasCloseRequest) && (
                                        <div className="space-y-3 pt-6 border-t border-white/10">
                                            <h3 className="text-sm font-semibold text-white">Pending Requests</h3>
                                            {selectedCampaign.hasPauseRequest && (
                                                <button
                                                    onClick={() => handlePause(selectedCampaign.id)}
                                                    disabled={processing}
                                                    className="w-full bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Approve Pause Request
                                                </button>
                                            )}
                                            {selectedCampaign.hasCloseRequest && (
                                                <button
                                                    onClick={() => handleClose(selectedCampaign.id)}
                                                    disabled={processing}
                                                    className="w-full bg-red-900/20 border border-red-500/30 hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Approve Close Request
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
                                <Megaphone className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-500">Select a campaign to review</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCampaignReview;
