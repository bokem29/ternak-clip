import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Eye,
  DollarSign,
  Calendar,
  Users,
  Play,
  CheckCircle2,
  AlertCircle,
  Youtube,
  Instagram,
  Facebook,
  Loader2,
  Clock
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const ClipperCampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaign();
      checkJoinStatus();
    }
  }, [id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/campaigns/${id}`);
      setCampaign(data.campaign || data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkJoinStatus = async () => {
    try {
      // Check if user has joined this campaign
      const campaignsData = await api.get('/clipper/campaigns');
      const allCampaigns = [
        ...(campaignsData.active || []),
        ...(campaignsData.endingSoon || []),
        ...(campaignsData.completed || []),
        ...(campaignsData.expired || [])
      ];
      const joined = allCampaigns.some(c => c.id === id);
      setIsJoined(joined);
    } catch (error) {
      console.error('Failed to check join status:', error);
    }
  };

  const handleJoinCampaign = async () => {
    if (!id) return;

    try {
      setJoining(true);
      await api.post(`/campaigns/${id}/join`);
      
      toast({
        title: 'Success!',
        description: 'You have successfully joined this campaign. You can now submit clips!',
      });
      
      setIsJoined(true);
      setShowJoinDialog(false);
      
      // Refresh campaign data
      await loadCampaign();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join campaign',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === 'youtube') return <Youtube className="w-4 h-4 text-red-500" />;
    if (p === 'instagram') return <Instagram className="w-4 h-4 text-pink-500" />;
    if (p === 'facebook') return <Facebook className="w-4 h-4 text-blue-500" />;
    if (p === 'tiktok') return <span className="text-xs font-bold">TT</span>;
    return null;
  };

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return 'No deadline';
    const now = new Date();
    const deadlineDate = new Date(endDate);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Ending today';
    if (diffDays <= 3) return `${diffDays} days left (Ending soon!)`;
    return `${diffDays} days left`;
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

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">Campaign not found</p>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = campaign.status === 'ACTIVE';
  const isPublic = campaign.isPublic !== false;
  const canJoin = isActive && isPublic && !isJoined;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/marketplace')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold mb-2">{campaign.title}</h1>
              <p className="text-sm text-muted-foreground">by {campaign.influencerName}</p>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Campaign Image */}
            {campaign.thumbnail && (
              <Card variant="glass" className="overflow-hidden">
                <img
                  src={campaign.thumbnail}
                  alt={campaign.title}
                  className="w-full h-64 object-cover"
                />
              </Card>
            )}

            {/* Description */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {campaign.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Campaign Rules */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Campaign Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Allowed Platforms */}
                {campaign.allowedPlatforms && campaign.allowedPlatforms.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Allowed Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.allowedPlatforms.map((platform: string) => (
                        <Badge key={platform} variant="outline" className="flex items-center gap-1">
                          {getPlatformIcon(platform)}
                          {platform.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Guidelines */}
                {campaign.contentGuidelines && (
                  <div>
                    <p className="text-xs font-medium mb-2">Content Guidelines:</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {campaign.contentGuidelines}
                    </p>
                  </div>
                )}

                {/* Hashtag Requirements */}
                {campaign.hashtagRequirements && (
                  <div>
                    <p className="text-xs font-medium mb-2">Hashtag Requirements:</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {campaign.hashtagRequirements}
                    </p>
                  </div>
                )}

                {/* Caption Requirements */}
                {campaign.captionRequirements && (
                  <div>
                    <p className="text-xs font-medium mb-2">Caption Requirements:</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {campaign.captionRequirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Campaign Stats */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Rate per 1K Views:
                  </span>
                  <span className="font-medium">{formatCurrency(campaign.ratePer1kViews || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Min Views:
                  </span>
                  <span className="font-medium">{(campaign.minEligibleViews || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Deadline:
                  </span>
                  <span className="font-medium text-xs">{getDaysLeft(campaign.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clippers:
                  </span>
                  <span className="font-medium">{campaign.clippers || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Join Campaign Action */}
            {isJoined ? (
              <Card variant="glass" className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    You're Joined!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      You have joined this campaign. Go to "My Campaigns" in your dashboard to submit clips.
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Go to My Campaigns
                  </Button>
                </CardContent>
              </Card>
            ) : canJoin ? (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-base font-display">Join This Campaign</CardTitle>
                  <CardDescription className="text-xs">
                    Join to start submitting clips and earning rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowJoinDialog(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card variant="glass">
                <CardContent className="p-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {!isActive && 'This campaign is not active.'}
                      {!isPublic && 'This is a private campaign.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Quick Info */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Submit clips that match the campaign requirements</p>
                <p>• Clips will be reviewed before approval</p>
                <p>• Rewards are credited to your web balance upon approval</p>
                <p>• You can withdraw your earnings anytime</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Join Campaign Confirmation Dialog */}
      <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <AlertDialogContent className="bg-[#09090b] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Join Campaign?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to join this campaign?</p>
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/50">
                  <p className="text-xs font-medium mb-2">{campaign.title}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• You will be able to submit clips for this campaign</p>
                    <p>• Campaign will appear in "My Campaigns" section</p>
                    <p>• Make sure you understand the campaign requirements</p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={joining}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinCampaign}
              disabled={joining}
              className="bg-primary text-primary-foreground"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Yes, Join Campaign
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ClipperCampaignDetail;

