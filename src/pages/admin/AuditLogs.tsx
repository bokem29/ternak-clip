import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  User,
  FileText,
} from "lucide-react";

interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  details: any;
  timestamp: string;
}

const AuditLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionFilter, adminFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/audit-logs?limit=500");
      setLogs(data.logs || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(query) ||
          log.adminName?.toLowerCase().includes(query) ||
          JSON.stringify(log.details).toLowerCase().includes(query)
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Admin filter
    if (adminFilter !== "all") {
      filtered = filtered.filter((log) => log.adminId === adminFilter);
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setAdminFilter("all");
  };

  // Get unique admins and actions for filters
  const uniqueAdmins = Array.from(new Set(logs.map((l) => l.adminId)));
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const actionConfig: Record<string, { icon: string; color: string }> = {
    CREATE_CAMPAIGN: { icon: "➕", color: "text-emerald-400" },
    UPDATE_CAMPAIGN: { icon: "✏️", color: "text-blue-400" },
    DELETE_CAMPAIGN: { icon: "🗑️", color: "text-red-400" },
    APPROVE_CAMPAIGN: { icon: "✅", color: "text-emerald-400" },
    REJECT_CAMPAIGN: { icon: "❌", color: "text-red-400" },
    APPROVE_SUBMISSION: { icon: "✅", color: "text-emerald-400" },
    REJECT_SUBMISSION: { icon: "❌", color: "text-red-400" },
    APPROVE_WITHDRAW: { icon: "💰", color: "text-emerald-400" },
    REJECT_WITHDRAW: { icon: "🚫", color: "text-red-400" },
    MARK_WITHDRAW_PAID: { icon: "💵", color: "text-blue-400" },
    UPDATE_USER_STATUS: { icon: "👤", color: "text-blue-400" },
    ADMIN_WALLET_ADJUSTMENT: { icon: "⚙️", color: "text-amber-400" },
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Audit Logs" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading audit logs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Audit Logs" />

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Total Events</p>
                <p className="text-white text-2xl font-bold">{logs.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Unique Actions</p>
                <p className="text-white text-2xl font-bold">{uniqueActions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Active Admins</p>
                <p className="text-white text-2xl font-bold">{uniqueAdmins.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel-v2 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Actions</option>
                {uniqueActions.slice(0, 20).map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Filter */}
            <div>
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Admins</option>
                {uniqueAdmins.map((adminId) => {
                  const log = logs.find((l) => l.adminId === adminId);
                  return (
                    <option key={adminId} value={adminId}>
                      {log?.adminName || adminId.slice(0, 8)}
                    </option>
                  );
                })}
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
                onClick={loadLogs}
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
            <h2 className="font-semibold text-white">
              Audit Trail ({filteredLogs.length})
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Target Entity</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const config = actionConfig[log.action] || { icon: "📝", color: "text-zinc-400" };

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-white/[0.02] group transition-colors"
                      >
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">
                            {log.adminName || "Unknown"}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {log.adminId.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config.icon}</span>
                            <span className={`text-xs font-medium ${config.color}`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 text-xs">
                          {log.details?.campaignId && (
                            <div>Campaign: {log.details.campaignId.slice(0, 10)}...</div>
                          )}
                          {log.details?.submissionId && (
                            <div>Submission: {log.details.submissionId.slice(0, 10)}...</div>
                          )}
                          {log.details?.userId && (
                            <div>User: {log.details.userId.slice(0, 10)}...</div>
                          )}
                          {!log.details?.campaignId && !log.details?.submissionId && !log.details?.userId && (
                            <div className="text-zinc-500">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              // Show details modal or navigate to detail page
                              toast({
                                title: "Audit Log Details",
                                description: JSON.stringify(log.details, null, 2),
                              });
                            }}
                            className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
              Showing {filteredLogs.length} of {logs.length} audit logs
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
