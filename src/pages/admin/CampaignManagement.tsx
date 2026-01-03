import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import {
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  Megaphone,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  influencerName?: string;
  allowedPlatforms?: string[];
  ratePer1kViews?: number;
  totalBudget?: number;
  paidBudget?: number;
  remainingBudget?: number;
  totalViews: number;
  status: string;
  createdAt: string;
  createdBy?: string;
  endDate?: string;
}

const CampaignList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchQuery, statusFilter, platformFilter, dateRange]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get("/campaigns");
      setCampaigns(data.campaigns || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(query) ||
          c.influencerName?.toLowerCase().includes(query) ||
          c.id?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.status?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((c) =>
        c.allowedPlatforms?.some(
          (p) => p.toLowerCase() === platformFilter.toLowerCase()
        )
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter((c) => {
        const createdDate = new Date(c.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    setFilteredCampaigns(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setDateRange({ start: "", end: "" });
  };

  const handleStatusChange = async (
    campaignId: string,
    action: "pause" | "resume" | "close"
  ) => {
    try {
      await api.post(`/admin/campaigns/${campaignId}/${action}`);
      toast({
        title: "Success",
        description: `Campaign ${action}d successfully`,
      });
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} campaign`,
        variant: "destructive",
      });
    }
  };

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    DRAFT: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Draft" },
    PENDING_APPROVAL: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      label: "Pending Approval",
    },
    ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
    PAUSED: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Paused" },
    CLOSED: { bg: "bg-red-500/10", text: "text-red-400", label: "Closed" },
  };

  const platformIcons: Record<string, string> = {
    youtube: "🎬",
    tiktok: "💃",
    instagram: "📷",
    facebook: "👥",
  };

  const platformLabels: Record<string, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Campaign Management" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading campaigns...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Campaign Management" />

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Filters */}
        <div className="glass-panel-v2 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X className="w-3 h-3 inline mr-1" />
                Clear
              </button>
              <button
                onClick={loadCampaigns}
                className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel-v2 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-white">
                Campaigns ({filteredCampaigns.length})
              </h2>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Influencer
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    CPM
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-zinc-500"
                    >
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const config =
                      statusConfig[campaign.status] ||
                      statusConfig.DRAFT;
                    const budgetUsed =
                      campaign.totalBudget && campaign.totalBudget > 0
                        ? ((campaign.paidBudget || 0) /
                          campaign.totalBudget) *
                        100
                        : 0;

                    const getPlatformIcon = (platform: string) => {
                      const platformLower = platform.toLowerCase();
                      if (platformLower.includes('youtube')) return '📺';
                      if (platformLower.includes('instagram')) return '📷';
                      if (platformLower.includes('tiktok')) return '🎵';
                      if (platformLower.includes('facebook')) return '👥';
                      return '🌐';
                    };

                    return (
                      <tr
                        key={campaign.id}
                        onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                        className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} border-${config.text.replace("text-", "")}/20`}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white max-w-xs truncate">
                            {campaign.title}
                          </div>
                          <div className="text-xs text-zinc-500">
                            ID: {campaign.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {campaign.influencerName || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {campaign.allowedPlatforms?.map((platform) => (
                              <span
                                key={platform}
                                className="text-xl"
                                title={platformLabels[platform.toLowerCase()] || platform}
                              >
                                {getPlatformIcon(platform)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatCurrency(campaign.ratePer1kViews || 0)}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatCurrency(campaign.totalBudget || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 text-xs">
                              {budgetUsed.toFixed(0)}%
                            </span>
                            <div className="w-12 bg-zinc-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full"
                                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {(campaign.totalViews || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex justify-center">
            <span className="text-xs text-zinc-500">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CampaignList;
