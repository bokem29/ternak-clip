import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Eye,
  DollarSign,
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  FileText,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Campaign {
  id: string;
  title: string;
  influencerName: string;
  status: string;
  submissions: number;
  totalViews: number;
  totalBudget: number | null;
  paidBudget: number;
  remainingBudget: number;
  cpm: number | null;
  endDate: string | null;
  canEdit: boolean;
  canSubmit: boolean;
  canRequestPause: boolean;
  canRequestClose: boolean;
  financialsSet: boolean;
  pauseRequested: boolean;
  closeRequested: boolean;
  rejectionReason?: string;
  adminFeedback?: string;
}

const CampaignsList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // Use the new endpoint that returns campaigns with computed fields
      const data = await api.get('/influencer/campaigns/my');
      setCampaigns(data.campaigns || []);
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

  const handleSubmitForApproval = async (campaignId: string) => {
    try {
      setProcessing(campaignId);
      await api.post(`/influencer/campaigns/${campaignId}/submit`, {});
      toast({
        title: 'Submitted for Approval',
        description: 'Your campaign has been sent to admin for review.',
      });
      await loadCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit campaign',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestPause = async (campaignId: string) => {
    try {
      setProcessing(campaignId);
      await api.post(`/influencer/campaigns/${campaignId}/request-pause`, {});
      toast({
        title: 'Pause Requested',
        description: 'Your pause request has been sent to admin.',
      });
      await loadCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request pause',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestClose = async (campaignId: string) => {
    if (!confirm('Are you sure you want to request closing this campaign?')) return;

    try {
      setProcessing(campaignId);
      await api.post(`/influencer/campaigns/${campaignId}/request-close`, {});
      toast({
        title: 'Close Requested',
        description: 'Your close request has been sent to admin.',
      });
      await loadCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request close',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  // Filter campaigns by status
  const draftCampaigns = campaigns.filter(c => c.status === 'DRAFT');
  const pendingCampaigns = campaigns.filter(c => c.status === 'PENDING_APPROVAL');
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED');
  const closedCampaigns = campaigns.filter(c => ['CLOSED', 'REJECTED'].includes(c.status));

  const getDaysLeft = (endDate: string | null) => {
    if (!endDate) return 'No deadline';
    const now = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Expired';
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: any }> = {
      DRAFT: { color: "bg-gray-500/20 text-gray-400", label: "Draft", icon: FileText },
      PENDING_APPROVAL: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending Review", icon: Clock },
      ACTIVE: { color: "bg-emerald-500/20 text-emerald-400", label: "Active", icon: CheckCircle2 },
      PAUSED: { color: "bg-blue-500/20 text-blue-400", label: "Paused", icon: Pause },
      CLOSED: { color: "bg-gray-500/20 text-gray-400", label: "Closed", icon: XCircle },
      REJECTED: { color: "bg-red-500/20 text-red-400", label: "Rejected", icon: XCircle },
    };
    const statusConfig = config[status] || { color: "bg-gray-500/20", label: status, icon: null };
    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/influencer">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1.5">My Campaigns</h1>
            <p className="text-sm text-muted-foreground">Monitor semua campaign Anda</p>
          </div>
          <Link to="/influencer/campaigns/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({draftCampaigns.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCampaigns.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({pausedCampaigns.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedCampaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {campaigns.length === 0 ? (
            <Card variant="glass">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Link to="/influencer/campaigns/create">
                  <Button>Create Your First Campaign</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            campaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                getDaysLeft={getDaysLeft}
                getStatusBadge={getStatusBadge}
                processing={processing}
                onSubmit={handleSubmitForApproval}
                onRequestPause={handleRequestPause}
                onRequestClose={handleRequestClose}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-3">
          {draftCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getDaysLeft={getDaysLeft}
              getStatusBadge={getStatusBadge}
              processing={processing}
              onSubmit={handleSubmitForApproval}
              onRequestPause={handleRequestPause}
              onRequestClose={handleRequestClose}
            />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getDaysLeft={getDaysLeft}
              getStatusBadge={getStatusBadge}
              processing={processing}
              onSubmit={handleSubmitForApproval}
              onRequestPause={handleRequestPause}
              onRequestClose={handleRequestClose}
            />
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-3">
          {activeCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getDaysLeft={getDaysLeft}
              getStatusBadge={getStatusBadge}
              processing={processing}
              onSubmit={handleSubmitForApproval}
              onRequestPause={handleRequestPause}
              onRequestClose={handleRequestClose}
            />
          ))}
        </TabsContent>

        <TabsContent value="paused" className="space-y-3">
          {pausedCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getDaysLeft={getDaysLeft}
              getStatusBadge={getStatusBadge}
              processing={processing}
              onSubmit={handleSubmitForApproval}
              onRequestPause={handleRequestPause}
              onRequestClose={handleRequestClose}
            />
          ))}
        </TabsContent>

        <TabsContent value="closed" className="space-y-3">
          {closedCampaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getDaysLeft={getDaysLeft}
              getStatusBadge={getStatusBadge}
              processing={processing}
              onSubmit={handleSubmitForApproval}
              onRequestPause={handleRequestPause}
              onRequestClose={handleRequestClose}
            />
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

interface CampaignCardProps {
  campaign: Campaign;
  getDaysLeft: (d: string | null) => string;
  getStatusBadge: (status: string) => JSX.Element;
  processing: string | null;
  onSubmit: (id: string) => void;
  onRequestPause: (id: string) => void;
  onRequestClose: (id: string) => void;
}

const CampaignCard = ({
  campaign,
  getDaysLeft,
  getStatusBadge,
  processing,
  onSubmit,
  onRequestPause,
  onRequestClose
}: CampaignCardProps) => {
  const navigate = useNavigate();
  const budgetUsage = campaign.totalBudget && campaign.totalBudget > 0
    ? ((campaign.paidBudget || 0) / campaign.totalBudget) * 100
    : 0;

  return (
    <Card variant="glass" className="hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/influencer/campaigns/${campaign.id}`}>
                <h3 className="font-medium text-base hover:underline">{campaign.title}</h3>
              </Link>
              {getStatusBadge(campaign.status)}
              {campaign.pauseRequested && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
                  Pause Requested
                </Badge>
              )}
              {campaign.closeRequested && (
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30">
                  Close Requested
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{campaign.influencerName}</p>

            {/* Show rejection reason or admin feedback */}
            {campaign.status === 'REJECTED' && campaign.rejectionReason && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Rejected:</strong> {campaign.rejectionReason}
                </AlertDescription>
              </Alert>
            )}
            {campaign.status === 'DRAFT' && campaign.adminFeedback && (
              <Alert className="mb-3 border-yellow-500/30 bg-yellow-500/5">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-sm">
                  <strong>Admin Feedback:</strong> {campaign.adminFeedback}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Clips</p>
                <p className="font-medium">{campaign.submissions || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Views</p>
                <p className="font-medium">{(campaign.totalViews || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {campaign.totalBudget
                    ? `$${(campaign.paidBudget || 0).toFixed(2)} / $${campaign.totalBudget.toFixed(2)}`
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">CPM</p>
                <p className="font-medium">
                  {campaign.cpm ? `$${campaign.cpm.toFixed(2)}` : 'Pending'}
                </p>
              </div>
            </div>

            {campaign.totalBudget && campaign.totalBudget > 0 && (
              <div className="mt-3">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-emerald-400 h-2 rounded-full"
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons based on campaign state */}
        <div className="flex gap-2 flex-wrap">
          {campaign.canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/influencer/campaigns/${campaign.id}`)}
            >
              <FileText className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
          {campaign.canSubmit && (
            <Button
              size="sm"
              onClick={() => onSubmit(campaign.id)}
              disabled={processing === campaign.id}
            >
              {processing === campaign.id ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              Submit for Approval
            </Button>
          )}
          {campaign.canRequestPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestPause(campaign.id)}
              disabled={processing === campaign.id}
            >
              <Pause className="w-3 h-3 mr-1" />
              Request Pause
            </Button>
          )}
          {campaign.canRequestClose && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRequestClose(campaign.id)}
              disabled={processing === campaign.id}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Request Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignsList;
