import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNavigate, Link } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { SubmissionCard } from "@/components/dashboard/SubmissionCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Eye,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Shield,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CampaignTracking } from "@/components/dashboard/CampaignTracking";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClips: 0,
    totalViews: 0,
    totalEarnings: 0,
    approvalRate: 0,
  });
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0 });
  const [webBalance, setWebBalance] = useState({ balance: 0 });
  const [trustScore, setTrustScore] = useState({ score: 0, tier: 'MEDIUM' });
  const [loading, setLoading] = useState(true);
  const [campaignsData, setCampaignsData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  // Check for campaign expiry notifications (H-3, H-1)
  useEffect(() => {
    if (!campaignsData) return;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Check ending soon campaigns
    const endingSoon = campaignsData.endingSoon || [];
    endingSoon.forEach((campaign: any) => {
      if (!campaign.endDate) return;

      const endDate = new Date(campaign.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // H-3 notification (3 days before)
      if (daysLeft === 3 && endDate <= threeDaysFromNow && endDate > oneDayFromNow) {
        toast({
          title: "⏰ Campaign Ending Soon",
          description: `"${campaign.title}" akan berakhir dalam 3 hari. Submit clip Anda sekarang!`,
          duration: 8000,
        });
      }

      // H-1 notification (1 day before)
      if (daysLeft === 1 && endDate <= oneDayFromNow && endDate > now) {
        toast({
          title: "🚨 Campaign Ending Tomorrow",
          description: `"${campaign.title}" akan berakhir besok! Jangan lewatkan kesempatan ini.`,
          variant: "destructive",
          duration: 10000,
        });
      }
    });
  }, [campaignsData, toast]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [submissionsData, campaignsData, walletData, webBalanceData, trustScoreData] = await Promise.all([
        api.get('/submissions'),
        api.get('/campaigns?marketplace=true'),
        api.get('/wallet'),
        api.get('/clipper/web-balance').catch(() => ({ balance: 0 })),
        api.get('/clipper/trust-score').catch(() => ({ trustScore: { score: 50, tier: 'MEDIUM' } })),
      ]);

      const submissions = submissionsData.submissions || [];
      const approved = submissions.filter((s: any) => s.status === 'approved').length;
      const total = submissions.length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      const totalViews = submissions.reduce((sum: number, s: any) => sum + (s.views || 0), 0);

      setStats({
        totalClips: total,
        totalViews,
        totalEarnings: walletData.totalEarned || 0,
        approvalRate,
      });

      setActiveCampaigns((campaignsData.campaigns || []).slice(0, 2).map((c: any) => ({
        ...c,
        status: c.status || 'active',
        brand: c.influencerName || 'Unknown',
        deadline: getDaysLeft(c.endDate),
        clippers: c.clippers || c.submissions || 0,
        minViews: c.minEligibleViews || 0,
        reward: ((c.ratePer1kViews || 0) * (c.minEligibleViews || 0)) / 1000,
      })));

      setRecentSubmissions(submissions.slice(0, 3).map((s: any) => ({
        ...s,
        campaign: getCampaignName(s.campaignId, campaignsData.campaigns || []),
        submittedAt: formatDate(s.submittedAt),
        earnings: s.status === 'approved' ? s.reward : undefined,
      })));

      setWallet({
        balance: walletData.balance || 0,
        pendingBalance: walletData.pendingBalance || 0,
      });

      setWebBalance({
        balance: webBalanceData.balance || 0,
      });

      setTrustScore({
        score: trustScoreData.trustScore?.score || 50,
        tier: trustScoreData.trustScore?.tier || 'MEDIUM',
      });

      // Load clipper campaigns for notifications
      try {
        const clipperCampaigns = await api.get('/clipper/campaigns').catch(() => null);
        if (clipperCampaigns) {
          setCampaignsData(clipperCampaigns);
        }
      } catch (err) {
        // Silently fail if not a clipper
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} hari tersisa` : 'Kedaluwarsa';
  };

  const getCampaignName = (campaignId: string, campaigns: any[]) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.title || 'Campaign Tidak Dikenal';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return `${diffDays} hari yang lalu`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const displayStats = [
    { title: "Total Clip", value: stats.totalClips, change: 0, icon: <Play className="w-4 h-4" /> },
    { title: "Total Views", value: formatViews(stats.totalViews), change: 0, icon: <Eye className="w-4 h-4" /> },
    { title: "Total Pendapatan", value: formatCurrency(stats.totalEarnings), change: 0, icon: <DollarSign className="w-4 h-4" /> },
    { title: "Tingkat Persetujuan", value: `${stats.approvalRate}%`, change: 0, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-green-950/20 rounded-xl m-4 border border-green-500/30">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-green-400 font-medium">Loading Dashboard Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Selamat datang kembali! Berikut ringkasan Anda.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {displayStats.map((stat, index) => (
          <div
            key={index}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left Column - Campaigns & Submissions */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {/* Campaign Tracking - NEW SYSTEM */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-display">My Campaigns</CardTitle>
              <Link to="/marketplace">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <CampaignTracking />
            </CardContent>
          </Card>

          {/* Active Campaigns - Legacy (keep for backward compatibility) */}
          <Card variant="glass" className="hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-display">Campaign Aktif</CardTitle>
              <Link to="/marketplace">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada campaign aktif
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeCampaigns.map((campaign, index) => (
                    <CampaignCard key={campaign.id || index} {...campaign} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-display">Pengajuan Terbaru</CardTitle>
              <Link to="/submissions">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada pengajuan
                </p>
              ) : (
                recentSubmissions.map((submission, index) => (
                  <SubmissionCard key={submission.id || index} {...submission} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Wallet, Trust Score, Web Balance */}
        <div className="space-y-3 sm:space-y-4">
          {/* Trust Score Card */}
          <Card variant="glass">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold">{trustScore.score}</div>
                  <Badge
                    variant={
                      trustScore.tier === 'VERIFIED' ? 'default' :
                        trustScore.tier === 'HIGH' ? 'default' :
                          trustScore.tier === 'MEDIUM' ? 'secondary' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {trustScore.tier}
                  </Badge>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `conic-gradient(from 0deg, hsl(${trustScore.score * 1.2}, 70%, 50%) 0%, hsl(${trustScore.score * 1.2}, 70%, 50%) ${trustScore.score}%, hsl(0, 0%, 20%) ${trustScore.score}%)`
                    }}
                  >
                    <div className="w-[90%] h-[90%] rounded-full bg-background flex items-center justify-center">
                      {trustScore.score}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {trustScore.tier === 'VERIFIED' && 'Auto-approval enabled. Fastest payout speed.'}
                {trustScore.tier === 'HIGH' && 'Auto-approval enabled. Fast payout speed.'}
                {trustScore.tier === 'MEDIUM' && 'Manual review required. Standard payout speed.'}
                {trustScore.tier === 'LOW' && 'Enhanced review required. Slower payout speed.'}
              </p>
            </CardContent>
          </Card>

          {/* Web Balance Card */}
          <Card variant="glass">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Web Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3">
                <div className="text-2xl font-bold">{formatCurrency(webBalance.balance)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available for withdrawal
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate('/wallet/withdraw')}
                  disabled={webBalance.balance <= 0}
                >
                  Withdraw
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/wallet/history')}
                >
                  History
                </Button>
              </div>
            </CardContent>
          </Card>

          <WalletCard
            balance={wallet.balance}
            pendingBalance={wallet.pendingBalance}
            onWithdraw={() => navigate('/wallet/withdraw')}
            onHistory={() => navigate('/wallet/history')}
          />

          {/* Quick Tips */}
          <Card variant="glass">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-display">Tips Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs font-medium">Tips Pro</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Kirim clip lebih awal dalam campaign untuk visibilitas lebih tinggi dan tingkat persetujuan lebih baik.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs font-medium">Persyaratan Minimum</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Sebagian besar campaign memerlukan minimal 10K views untuk mendapatkan reward.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout >
  );
};

export default Dashboard;
