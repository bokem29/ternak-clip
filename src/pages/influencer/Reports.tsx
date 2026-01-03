import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Eye,
  DollarSign
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reports = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get('/influencer/campaigns');
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

  const handleExportCSV = async () => {
    try {
      let reportData;
      
      if (selectedCampaign === 'all') {
        // Export all campaigns summary
        const allReports = await Promise.all(
          campaigns.map(c => api.get(`/influencer/campaigns/${c.id}/report`).catch(() => null))
        );

        const csv = [
          ['Campaign Report - All Campaigns'],
          [''],
          ['Campaign', 'Clips', 'Views', 'Likes', 'Budget Used', 'Budget Remaining'],
          ...allReports
            .filter(r => r)
            .map(r => [
              r.report.campaign.title,
              r.report.totalClips,
              r.report.totalViews,
              r.report.totalLikes,
              `$${r.report.budgetUsed.toFixed(2)}`,
              `$${r.report.budgetRemaining.toFixed(2)}`
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-report-all-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const report = await api.get(`/influencer/campaigns/${selectedCampaign}/report`);
        const campaign = report.report.campaign;

        const csv = [
          ['Campaign Report', campaign.title],
          [''],
          ['Metric', 'Value'],
          ['Total Clips', report.report.totalClips],
          ['Total Views', report.report.totalViews],
          ['Total Likes', report.report.totalLikes],
          ['Budget Used', `$${report.report.budgetUsed.toFixed(2)}`],
          ['Budget Remaining', `$${report.report.budgetRemaining.toFixed(2)}`],
          [''],
          ['Clips'],
          ['Title', 'Views', 'Likes', 'Platform', 'Date'],
          ...report.report.clips.map((clip: any) => [
            clip.title,
            clip.views,
            clip.likes,
            clip.platform,
            new Date(clip.submittedAt).toLocaleDateString()
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-report-${campaign.title.replace(/\s+/g, '-')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Report Exported',
        description: 'CSV report telah di-download',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    // For PDF, we'll create a simple text-based report
    // In production, use a library like jsPDF
    toast({
      title: 'PDF Export',
      description: 'PDF export akan segera tersedia. Gunakan CSV untuk saat ini.',
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/influencer">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold mb-1.5">Reports & Export</h1>
        <p className="text-sm text-muted-foreground">Download campaign summary - CSV & PDF</p>
      </div>

      {/* Export Options */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-display">Export Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select Campaign</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns (Summary)</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleExportCSV} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <CampaignSummaryCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No campaigns yet</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

const CampaignSummaryCard = ({ campaign }: { campaign: any }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [campaign.id]);

  const loadReport = async () => {
    try {
      const data = await api.get(`/influencer/campaigns/${campaign.id}/report`);
      setReport(data.report);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base font-display">{campaign.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Clips</p>
            <p className="font-bold">{report?.totalClips || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Views</p>
            <p className="font-bold">{(report?.totalViews || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget Used</p>
            <p className="font-bold">${(report?.budgetUsed || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="font-bold">${(report?.budgetRemaining || 0).toFixed(2)}</p>
          </div>
        </div>
        <Link to={`/influencer/campaigns/${campaign.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default Reports;

