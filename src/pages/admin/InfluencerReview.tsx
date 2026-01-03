import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  Clock,
  UserCheck,
  Users as UsersIcon,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const InfluencerReview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'>('all');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [influencerToApprove, setInfluencerToApprove] = useState<any>(null);

  useEffect(() => {
    loadInfluencers();
  }, [filter]);

  const loadInfluencers = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api.get(`/admin/influencers${params}`);
      setInfluencers(data.influencers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load influencer applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (influencer: any) => {
    setInfluencerToApprove(influencer);
    setShowApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (!influencerToApprove) return;

    try {
      setProcessing(true);
      await api.post(`/admin/influencers/${influencerToApprove.id}/approve`, {});
      toast({
        title: 'Application Approved',
        description: 'The influencer has been verified and can now create campaigns.',
      });
      await loadInfluencers();
      if (selectedInfluencer?.id === influencerToApprove.id) {
        setSelectedInfluencer(null);
      }
      setShowApprovalDialog(false);
      setInfluencerToApprove(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve application',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to reject this influencer application?')) {
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/admin/influencers/${id}/reject`, { reason: rejectionReason });
      toast({
        title: 'Application Rejected',
        description: 'The influencer has been notified of the rejection.',
      });
      setRejectionReason('');
      await loadInfluencers();
      if (selectedInfluencer?.id === id) {
        setSelectedInfluencer(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: any }> = {
      PENDING_REVIEW: {
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        label: 'Pending Review',
        icon: Clock
      },
      VERIFIED: {
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        label: 'Verified',
        icon: CheckCircle2
      },
      REJECTED: {
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
        label: 'Rejected',
        icon: XCircle
      },
    };
    const config = variants[status] || {
      className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
      label: status,
      icon: null
    };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'TELEGRAM':
        return <Send className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  // Calculate stats
  const stats = {
    total: influencers.length,
    pending: influencers.filter(i => i.status === 'PENDING_REVIEW').length,
    verified: influencers.filter(i => i.status === 'VERIFIED').length,
    rejected: influencers.filter(i => i.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Influencer Applications" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading influencer applications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Influencer Applications" subtitle="Review and approve influencer onboarding submissions" />
      
      <div className="flex-1 overflow-y-auto p-6 pb-20">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Applications */}
          <div className="glass-card-primary p-5 rounded-xl group hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <UsersIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
            <div className="flex justify-between items-end">
              <span className="text-zinc-400 text-xs">All Applications</span>
            </div>
          </div>

          {/* Pending Review */}
          <div className={`glass-card-primary p-5 rounded-xl transition-all cursor-pointer relative overflow-hidden ${stats.pending > 0 ? 'border-amber-500/20 group hover:border-amber-500/50' : 'border-white/5 group hover:border-amber-500/30'
            }`}>
            {stats.pending > 0 && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full -mr-8 -mt-8" />
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              {stats.pending > 0 && (
                <span className="text-[10px] text-amber-500 uppercase font-semibold tracking-wider animate-pulse">Action Required</span>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.pending}</div>
            <div className="flex justify-between items-end">
              <span className="text-zinc-400 text-xs">Pending Review</span>
            </div>
          </div>

          {/* Verified */}
          <div className="glass-card-primary p-5 rounded-xl group hover:border-emerald-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Approved</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.verified}</div>
            <div className="flex justify-between items-end">
              <span className="text-zinc-400 text-xs">Verified Influencers</span>
              {stats.verified > 0 && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                  <TrendingUp className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>

          {/* Rejected */}
          <div className="glass-card-primary p-5 rounded-xl group hover:border-red-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Declined</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.rejected}</div>
            <div className="flex justify-between items-end">
              <span className="text-zinc-400 text-xs">Rejected Applications</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-panel-v2 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'all'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white'
                }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('PENDING_REVIEW')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'PENDING_REVIEW'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'VERIFIED'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                }`}
            >
              Verified ({stats.verified})
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'REJECTED'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-0">
            {/* List */}
            <div className="lg:col-span-1 border-r border-white/5 p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {influencers.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No applications found
                </div>
              ) : (
                influencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${selectedInfluencer?.id === influencer.id
                      ? 'border-white/50 bg-white/5'
                      : 'border-white/5 glass-card-primary hover:border-white/30'
                      }`}
                    onClick={() => setSelectedInfluencer(influencer)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-white mb-1">{influencer.influencerName}</h3>
                        <p className="text-xs text-zinc-500">{influencer.user?.email}</p>
                      </div>
                      {getStatusBadge(influencer.status)}
                    </div>
                    <div className="text-xs text-zinc-400 mt-2 space-y-0.5">
                      <p>Type: <span className="text-zinc-300">{influencer.influencerType}</span></p>
                      <p>Primary: <span className="text-zinc-300">{influencer.primaryPlatform}</span></p>
                      <p className="mt-1 text-zinc-600">
                        {new Date(influencer.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2 p-6 max-h-[600px] overflow-y-auto">
            {selectedInfluencer ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-semibold text-white">{selectedInfluencer.influencerName}</h2>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedInfluencer.status)}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        {selectedInfluencer.influencerType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">User Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-zinc-400">Email: <span className="text-white">{selectedInfluencer.user?.email}</span></p>
                    <p className="text-zinc-400">Name: <span className="text-white">{selectedInfluencer.user?.name}</span></p>
                    <p className="text-zinc-400">Joined: <span className="text-white">{new Date(selectedInfluencer.user?.createdAt).toLocaleDateString()}</span></p>
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Platform Info */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Platform Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-zinc-400">Platforms: </span>
                      {selectedInfluencer.platformsOwned && Array.isArray(selectedInfluencer.platformsOwned) ? (
                        selectedInfluencer.platformsOwned.map((p: string) => (
                          <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-1">
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-xs">Not specified</span>
                      )}
                    </div>
                    <p className="text-zinc-400">Primary: <span className="text-white">{selectedInfluencer.primaryPlatform}</span></p>
                    <p className="text-zinc-400">
                      Channel URL:{' '}
                      <a
                        href={selectedInfluencer.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedInfluencer.channelUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                    {selectedInfluencer.followerCount && (
                      <p className="text-zinc-400">Followers: <span className="text-white">{selectedInfluencer.followerCount.toLocaleString()}</span></p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Intent */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Reason for Creating Campaigns</h3>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {selectedInfluencer.reasonForCampaigns}
                  </p>
                </div>

                {selectedInfluencer.estimatedBudget && (
                  <>
                    <div className="border-t border-white/5" />
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Estimated Budget</h3>
                      <p className="text-sm text-white">{selectedInfluencer.estimatedBudget}</p>
                    </div>
                  </>
                )}

                <div className="border-t border-white/5" />

                {/* Contact */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-zinc-400">Contact Person: <span className="text-white">{selectedInfluencer.contactPersonName}</span></p>
                    <p className="flex items-center gap-2 text-zinc-400">
                      Contact Method:
                      <span className="flex items-center gap-1 text-white">
                        {getContactIcon(selectedInfluencer.preferredContactMethod)}
                        {selectedInfluencer.preferredContactMethod}
                      </span>
                    </p>
                    <p className="text-zinc-400">Contact Detail: <span className="text-white">{selectedInfluencer.contactDetail}</span></p>
                  </div>
                </div>

                {/* Optional Proof */}
                {(selectedInfluencer.analyticsScreenshot || selectedInfluencer.mediaKitUrl) && (
                  <>
                    <div className="border-t border-white/5" />
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Proof / Additional Info</h3>
                      <div className="space-y-2 text-sm">
                        {selectedInfluencer.analyticsScreenshot && (
                          <p className="text-zinc-400">
                            Analytics:{' '}
                            <a
                              href={selectedInfluencer.analyticsScreenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                            >
                              View Screenshot
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        )}
                        {selectedInfluencer.mediaKitUrl && (
                          <p className="text-zinc-400">
                            Media Kit:{' '}
                            <a
                              href={selectedInfluencer.mediaKitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                            >
                              View Media Kit
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Rejection Reason if rejected */}
                {selectedInfluencer.status === 'REJECTED' && selectedInfluencer.rejectionReason && (
                  <>
                    <div className="border-t border-white/5" />
                    <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rejection Reason:</strong> {selectedInfluencer.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {/* Actions */}
                {selectedInfluencer.status === 'PENDING_REVIEW' && (
                  <>
                    <div className="border-t border-white/5" />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Rejection Reason (if rejecting)
                        </Label>
                        <Textarea
                          id="rejectionReason"
                          placeholder="Provide a clear reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(selectedInfluencer)}
                          disabled={processing}
                          className="flex-1 bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(selectedInfluencer.id)}
                          disabled={processing || !rejectionReason.trim()}
                          variant="destructive"
                          className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                Select an application to view details
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="bg-[#09090b] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Approve Influencer Application
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You are about to approve the following influencer application. This action will verify their account and grant them permission to create campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {influencerToApprove && (
            <div className="py-4 space-y-3 border-t border-b border-white/5">
              <div className="p-4 rounded-lg bg-gradient-to-br from-[rgba(39,39,42,0.4)] to-[rgba(24,24,27,0.4)] backdrop-blur-[8px] border border-white/5">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-500">Influencer Name:</span>
                    <p className="text-white font-semibold">{influencerToApprove.influencerName}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Email:</span>
                    <p className="text-white">{influencerToApprove.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Type:</span>
                    <p className="text-white">{influencerToApprove.influencerType}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Primary Platform:</span>
                    <p className="text-white">{influencerToApprove.primaryPlatform}</p>
                  </div>
                  {influencerToApprove.followerCount && (
                    <div>
                      <span className="text-zinc-500">Followers:</span>
                      <p className="text-white">{influencerToApprove.followerCount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              <Alert className="bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-400">
                  Once approved, this influencer will be able to create and manage campaigns immediately.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white"
              disabled={processing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              disabled={processing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default InfluencerReview;
