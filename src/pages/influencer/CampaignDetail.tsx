import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  DollarSign,
  Video,
  TrendingUp,
  Calendar,
  BarChart3,
  Download
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch basic campaign data from public endpoint
      const campaignData = await api.get(`/campaigns/${id}`);
      setCampaign(campaignData.campaign);

      // Try to fetch report if user is the campaign owner (influencer)
      try {
        const reportData = await api.get(`/influencer/campaigns/${id}/report`);
        setReport(reportData.report);
      } catch (reportError: any) {
        // If report fetch fails (not authorized or not found), create a basic report from campaign data
        const camp = campaignData.campaign;
        const basicReport = {
          totalClips: camp.submissions || 0,
          totalViews: camp.totalViews || 0,
          totalLikes: 0,
          budgetUsed: camp.paidBudget || camp.totalBudget - camp.remainingBudget || 0,
          budgetRemaining: camp.remainingBudget || camp.totalBudget || 0,
          clips: []
        };
        setReport(basicReport);
      }
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

  const handleExportReport = () => {
    // Simple CSV export
    if (!report) return;

    const csv = [
      ['Campaign Report', campaign.title],
      [''],
      ['Metric', 'Value'],
      ['Total Clips', report.totalClips],
      ['Total Views', report.totalViews],
      ['Total Likes', report.totalLikes],
      ['Budget Used', `$${(report.budgetUsed || 0).toFixed(2)}`],
      ['Budget Remaining', `$${(report.budgetRemaining || 0).toFixed(2)}`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-report-${campaign.title.replace(/\s+/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Report Exported',
      description: 'Campaign report telah di-download',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign || !report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Campaign not found</p>
          <Link to="/influencer/campaigns">
            <Button variant="outline" className="mt-4">
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const budgetUsage = campaign.totalBudget > 0
    ? ((campaign.totalBudget - (campaign.remainingBudget || campaign.totalBudget)) / campaign.totalBudget) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/influencer/campaigns">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1.5">{campaign.title}</h1>
            <p className="text-sm text-muted-foreground">{campaign.brand}</p>
          </div>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Video className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">{report.totalClips}</p>
            <p className="text-xs text-muted-foreground">Total Clips</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Eye className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">{report.totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">${(report.budgetUsed || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Budget Terpakai</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              dari ${campaign.totalBudget?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">${(report.budgetRemaining || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Budget Tersisa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Budget Usage */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Budget Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-bold">${(report.budgetUsed || 0).toFixed(2)} / ${campaign.totalBudget?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-emerald-400 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Remaining: ${(report.budgetRemaining || 0).toFixed(2)}</span>
                  <span>{budgetUsage.toFixed(1)}% used</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Description */}
          {campaign.description && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Campaign Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {campaign.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content Requirements */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Content Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Platform(s)</p>
                  <p className="font-medium capitalize">{campaign.allowedPlatforms?.join(', ') || 'Any'}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Minimum Views</p>
                  <p className="font-medium">{(campaign.minEligibleViews || 0).toLocaleString()}</p>
                </div>
                {campaign.hashtagRequirements && (
                  <div className="p-3 rounded-lg bg-secondary/30 sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">Required Hashtags</p>
                    <p className="text-xs">{campaign.hashtagRequirements}</p>
                  </div>
                )}
              </div>
              {campaign.contentGuidelines && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1">Content Guidelines</p>
                  <p className="text-xs">{campaign.contentGuidelines}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Timeline */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Performance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Campaign Start</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Clips Created</p>
                      <p className="text-xs text-muted-foreground">{report.totalClips} approved clips</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total Views</p>
                      <p className="text-xs text-muted-foreground">{report.totalViews.toLocaleString()} views</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Campaign Info */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Campaign Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Influencer</p>
                <p className="font-medium">{campaign.influencerName || campaign.brand || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform(s)</p>
                <p className="font-medium capitalize">{campaign.allowedPlatforms?.join(', ') || 'Any'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate per 1K Views</p>
                <p className="font-medium">${campaign.ratePer1kViews?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min Views Required</p>
                <p className="font-medium">{(campaign.minEligibleViews || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Payable Views</p>
                <p className="font-medium">{(campaign.maxPayableViewsPerClip || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Budget</p>
                <p className="font-medium">${campaign.totalBudget?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="font-medium">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No deadline'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'outline'}>
                  {campaign.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Join Campaign Action */}
          {campaign.status === 'ACTIVE' && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Join This Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Ready to participate? Submit your clip and start earning!
                </p>
                <Link to="/submit">
                  <Button variant="default" size="sm" className="w-full">
                    <Video className="w-3 h-3 mr-2" />
                    Submit Clip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/influencer/clips?campaign=${campaign.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Video className="w-3 h-3 mr-2" />
                  View Clips
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full" onClick={handleExportReport}>
                <Download className="w-3 h-3 mr-2" />
                Export Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CampaignDetail;

