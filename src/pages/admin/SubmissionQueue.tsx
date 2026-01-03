import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Flag,
  ExternalLink,
  X,
} from "lucide-react";

interface Submission {
  id: string;
  userId: string;
  user?: { name?: string; email?: string };
  campaignId: string;
  campaign?: { title?: string };
  title?: string;
  platform?: string;
  contentUrl?: string;
  views: number;
  status: string;
  flagged?: boolean;
  flagReason?: string;
  submittedAt: string;
  reward?: number;
}

const SubmissionList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewsRange, setViewsRange] = useState({ min: "", max: "" });

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter, platformFilter, viewsRange]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.get("/submissions");
      setSubmissions(data.submissions || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.id?.toLowerCase().includes(query) ||
          s.title?.toLowerCase().includes(query) ||
          s.user?.name?.toLowerCase().includes(query) ||
          s.campaign?.title?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((s) => s.platform?.toLowerCase() === platformFilter.toLowerCase());
    }

    // Views range filter
    if (viewsRange.min || viewsRange.max) {
      const min = parseInt(viewsRange.min) || 0;
      const max = parseInt(viewsRange.max) || Number.MAX_SAFE_INTEGER;
      filtered = filtered.filter((s) => s.views >= min && s.views <= max);
    }

    setFilteredSubmissions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setViewsRange({ min: "", max: "" });
  };

  const handleQuickAction = async (submissionId: string, action: "approve" | "reject" | "flag") => {
    try {
      if (action === "approve") {
        await api.patch(`/submissions/${submissionId}/approve`, { status: "approved" });
      } else if (action === "flag") {
        await api.patch(`/submissions/${submissionId}/flag`, { flagged: true, reason: "Manual flag" });
      }

      toast({
        title: "Success",
        description: `Submission ${action}ed successfully`,
      });
      loadSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} submission`,
        variant: "destructive",
      });
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Pending" },
    submitted: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Submitted" },
    auto_checking: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Checking" },
    under_admin_review: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Under Review" },
    approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
    rejected: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
    flagged: { bg: "bg-red-500/10", text: "text-red-400", label: "Flagged" },
    flagged_auto: { bg: "bg-red-500/10", text: "text-red-400", label: "Auto-Flagged" },
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
        <AdminHeader title="Submission Queue" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading submissions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const flaggedCount = submissions.filter((s) => s.flagged).length;

  return (
    <AdminLayout>
      <AdminHeader title="Submission Queue" />

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Stats Banner */}
        {(pendingCount > 0 || flaggedCount > 0) && (
          <div className="bg-amber-900/20 border-b border-amber-500/20 px-6 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Flag className="w-4 h-4" />
              <span className="font-medium text-sm">
                {pendingCount} Pending · {flaggedCount} Flagged
              </span>
            </div>
            <button
              onClick={() => setStatusFilter("pending")}
              className="text-xs text-amber-300 hover:text-amber-100 font-semibold"
            >
              View Priority Queue →
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="glass-panel-v2 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Stats Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
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
                onClick={loadSubmissions}
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
                Submissions ({filteredSubmissions.length})
              </h2>
              {statusFilter === "pending" && pendingCount > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                  {pendingCount} High Priority
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium uppercase tracking-wider w-8">#</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">User / Campaign</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => {
                    // Normalize status to lowercase with underscores for consistent lookup
                    const normalizedStatus = submission.status?.toLowerCase().replace(/\s+/g, '_') || 'pending';
                    const config = statusConfig[normalizedStatus] || statusConfig.pending;
                    const priority = submission.status === "pending" || submission.flagged;

                    // Get status dot color (3 colors only: yellow=pending, green=approved, red=rejected)
                    const getStatusDotColor = (status: string) => {
                      const statusLower = status.toLowerCase().replace(/_/g, '_');
                      if (statusLower === 'approved' || statusLower === 'approve') {
                        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
                      } else if (statusLower === 'pending' || statusLower === 'submitted' || statusLower === 'under_admin_review' || statusLower === 'auto_checking') {
                        return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
                      } else if (statusLower === 'rejected' || statusLower === 'reject' || statusLower === 'flagged' || statusLower === 'flagged_auto') {
                        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
                      }
                      return 'bg-zinc-600';
                    };

                    return (
                      <tr
                        key={submission.id}
                        onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                        className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`w-2 h-2 rounded-full block ${getStatusDotColor(submission.status)}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <span className="text-lg">
                              {platformIcons[submission.platform?.toLowerCase() || ""] || "📹"}
                            </span>
                            <span className="capitalize">
                              {platformLabels[submission.platform?.toLowerCase() || ""] || submission.platform || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white max-w-xs truncate">
                            {submission.user?.name || submission.user?.email || "Unknown"}
                          </div>
                          <div className="text-xs text-zinc-500 truncate" title={submission.campaign?.title}>
                            {submission.campaign?.title || `Campaign: ${submission.campaignId}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {submission.contentUrl ? (
                            <a
                              href={submission.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-xs">View Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {(submission.views || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${getStatusDotColor(submission.status)}`}
                            />
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} border-${config.text.replace("text-", "")}/20`}
                            >
                              {config.label}
                            </span>
                            {submission.flagged && (
                              <Flag className="w-3 h-3 text-red-400 inline ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {submission.submittedAt
                            ? format(new Date(submission.submittedAt), "MMM dd, HH:mm")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex justify-between items-center">
            <span className="text-xs text-zinc-500">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </span>
            {filteredSubmissions.length > 0 && (
              <button
                className="text-xs text-zinc-500 hover:text-white transition-colors"
                onClick={() => navigate(`/admin/submissions?status=all`)}
              >
                View full queue ({submissions.length} items)
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubmissionList;
