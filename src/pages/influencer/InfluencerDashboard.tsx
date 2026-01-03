import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Eye,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Video
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface InfluencerStats {
  activeCampaigns: number;
  totalCampaigns: number;
  totalViews: number;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  estimatedROI: string;
  totalClips: number;
}

const InfluencerDashboard = () => {
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, campaignsData] = await Promise.all([
        api.get('/influencer/stats'),
        api.get('/influencer/campaigns')
      ]);

      setStats(statsData);
      setCampaigns((campaignsData.campaigns || []).slice(0, 3));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  const budgetUsage = stats && stats.totalBudget > 0
    ? (stats.spentBudget / stats.totalBudget) * 100
    : 0;

  const isHealthy = parseFloat(stats?.estimatedROI || '0') >= 0 && budgetUsage < 80;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-1.5">Influencer Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Monitor performa campaign & ROI</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/influencer/campaigns/create">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
          <Link to="/influencer/wallet">
            <Button variant="outline" className="w-full sm:w-auto">
              <DollarSign className="w-4 h-4 mr-2" />
              Wallet
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Status */}
      <Card variant="glass" className={`mb-6 ${isHealthy ? 'border-emerald-500/30' : 'border-yellow-500/30'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-base mb-1">
                Campaign Status: {isHealthy ? '✅ Sehat' : '⚠️ Perlu Perhatian'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isHealthy
                  ? 'Campaign berjalan dengan baik. Budget usage optimal dan ROI positif.'
                  : 'Perlu review campaign. Budget usage tinggi atau ROI negatif.'
                }
              </p>
            </div>
            <Badge variant={isHealthy ? 'default' : 'outline'} className="text-sm">
              {parseFloat(stats?.estimatedROI || '0').toFixed(1)}% ROI
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">{stats?.activeCampaigns || 0}</p>
            <p className="text-xs text-muted-foreground">Campaign Aktif</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Eye className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-xl font-display font-bold">{(stats?.totalViews || 0).toLocaleString()}</p>
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
            <p className="text-xl font-display font-bold">${(stats?.spentBudget || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Budget Terpakai</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              dari ${(stats?.totalBudget || 0).toFixed(2)}
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
            <p className="text-xl font-display font-bold">{stats?.estimatedROI || '0'}%</p>
            <p className="text-xs text-muted-foreground">Estimasi ROI</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-display">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining Budget</span>
              <span className="font-bold text-lg">${(stats?.remainingBudget || 0).toFixed(2)}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-emerald-400 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>${(stats?.spentBudget || 0).toFixed(2)} used</span>
              <span>{budgetUsage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Link to="/influencer/campaigns">
          <Card variant="glass" className="hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">My Campaigns</h3>
                  <p className="text-xs text-muted-foreground">Lihat semua campaign</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/influencer/clips">
          <Card variant="glass" className="hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Clip Gallery</h3>
                  <p className="text-xs text-muted-foreground">Lihat semua clip hasil</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/influencer/reports">
          <Card variant="glass" className="hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Reports</h3>
                  <p className="text-xs text-muted-foreground">Download CSV/PDF</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Campaigns */}
      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base font-display">Recent Campaigns</CardTitle>
          <Link to="/influencer/campaigns">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No campaigns yet. Create your first campaign!
            </p>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-sm">{campaign.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaign.submissions || 0} clips • {(campaign.totalViews || 0).toLocaleString()} views
                  </p>
                </div>
                <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                  {campaign.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default InfluencerDashboard;

