import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  Shield,
  X,
  Users as UsersIcon,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "clipper" | "influencer";
  status: "active" | "suspended" | "banned" | "verified";
  balance?: number;
  pendingBalance?: number;
  createdAt: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    userId: string;
    action: "suspend" | "ban" | "activate";
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get("/admin/users");
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.id?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      });
      loadUsers();
      setShowConfirmDialog(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
    verified: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Verified" },
    suspended: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Suspended" },
    banned: { bg: "bg-red-500/10", text: "text-red-400", label: "Banned" },
  };

  const roleConfig: Record<string, { bg: string; text: string; icon: string }> = {
    admin: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "" },
    clipper: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "" },
    influencer: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "" },
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="User Management" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const clippers = users.filter((u) => u.role === "clipper");
  const influencers = users.filter((u) => u.role === "influencer");
  const activeUsers = users.filter((u) => u.status === "active" || u.status === "verified");
  const totalEarnings = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <AdminLayout>
      <AdminHeader title="User Management" />

      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Total Users</p>
                <p className="text-white text-2xl font-bold">{users.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Clippers</p>
                <p className="text-white text-2xl font-bold">{clippers.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Influencers</p>
                <p className="text-white text-2xl font-bold">{influencers.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card-primary rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Active</p>
                <p className="text-white text-2xl font-bold">{activeUsers.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
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
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="clipper">Clipper</option>
                <option value="influencer">Influencer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
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
                onClick={loadUsers}
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
              Users ({filteredUsers.length})
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const statusCfg = statusConfig[user.status] || statusConfig.active;
                    const roleCfg = roleConfig[user.role] || roleConfig.clipper;

                    return (
                      <tr
                        key={user.id}
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-xs text-zinc-500">ID: {user.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{user.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${roleCfg.bg} ${roleCfg.text} border-${roleCfg.text.replace("text-", "")}/20`}
                          >
                            <span>{roleCfg.icon}</span>
                            <span className="capitalize">{user.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusCfg.bg} ${statusCfg.text} border-${statusCfg.text.replace("text-", "")}/20`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {user.createdAt
                            ? format(new Date(user.createdAt), "MMM dd, yyyy")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatCurrency(user.balance || 0)}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            {user.status === "active" || user.status === "verified" ? (
                              <>
                                <button
                                  onClick={() =>
                                    setShowConfirmDialog({ userId: user.id, action: "suspend" })
                                  }
                                  className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-amber-400 transition-colors"
                                  title="Suspend"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setShowConfirmDialog({ userId: user.id, action: "ban" })
                                  }
                                  className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                  title="Ban"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  setShowConfirmDialog({ userId: user.id, action: "activate" })
                                }
                                className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                                title="Activate"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <h3 className="text-white font-semibold mb-4">
              {showConfirmDialog.action === "activate" ? "Activate User" : `${showConfirmDialog.action === "ban" ? "Ban" : "Suspend"} User`}
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to {showConfirmDialog.action} this user?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(showConfirmDialog.userId, showConfirmDialog.action === "activate" ? "active" : showConfirmDialog.action === "ban" ? "blacklisted" : "suspended")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showConfirmDialog.action === "activate"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : showConfirmDialog.action === "ban"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-amber-500 hover:bg-amber-600"
                  } text-white`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagement;
