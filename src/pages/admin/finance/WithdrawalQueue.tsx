import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    X,
    Clock,
    CheckCircle,
    Ban,
    Flag,
} from "lucide-react";

interface WithdrawRequest {
    id: string;
    userId: string;
    user?: { name?: string; email?: string; status?: string };
    amount: number;
    paymentMethod?: {
        type: string;
        label?: string;
        bankName?: string;
        ewalletType?: string;
    };
    status: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
}

const WithdrawalQueue = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
    const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");

    useEffect(() => {
        loadWithdrawals();
    }, []);

    useEffect(() => {
        filterWithdrawals();
    }, [withdrawals, searchQuery, statusFilter, methodFilter]);

    const loadWithdrawals = async () => {
        try {
            setLoading(true);
            const data = await api.get("/admin/withdrawals");
            setWithdrawals(data.withdrawals || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load withdrawals",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filterWithdrawals = () => {
        let filtered = withdrawals;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (w) =>
                    w.id?.toLowerCase().includes(query) ||
                    w.user?.name?.toLowerCase().includes(query) ||
                    w.user?.email?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((w) => w.status === statusFilter);
        }

        // Method filter
        if (methodFilter !== "all") {
            filtered = filtered.filter((w) => w.paymentMethod?.type === methodFilter);
        }

        setFilteredWithdrawals(filtered);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setMethodFilter("all");
    };

    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
        PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending", icon: Clock },
        APPROVED: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Approved", icon: CheckCircle },
        PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Paid", icon: CheckCircle },
        REJECTED: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected", icon: Ban },
    };

    const methodIcons: Record<string, string> = {
        BANK: "🏦",
        EWALLET: "📱",
        DANA: "📱",
        GOPAY: "📱",
        OVO: "📱",
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminHeader title="Withdrawal Queue" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading withdrawals...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;
    const totalPending = withdrawals
        .filter((w) => w.status === "PENDING")
        .reduce((sum, w) => sum + w.amount, 0);

    return (
        <AdminLayout>
            <AdminHeader title="Withdrawal Queue" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Alert Banner */}
                {pendingCount > 0 && (
                    <div className="bg-amber-900/20 border-b border-amber-500/20 px-6 py-3 rounded-lg mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Flag className="w-4 h-4" />
                            <span className="font-medium text-sm">
                                {pendingCount} Pending Withdrawals · {formatCurrency(totalPending)} Total
                            </span>
                        </div>
                        <button
                            onClick={() => setStatusFilter("PENDING")}
                            className="text-xs text-amber-300 hover:text-amber-100 font-semibold"
                        >
                            View Pending Only →
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {["PENDING", "APPROVED", "PAID", "REJECTED"].map((status) => {
                        const count = withdrawals.filter((w) => w.status === status).length;
                        const config = statusConfig[status];
                        const Icon = config.icon;

                        return (
                            <div
                                key={status}
                                className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-zinc-500 text-xs mb-1">{config.label}</p>
                                        <p className="text-white text-2xl font-bold">{count}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${config.text}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                                    placeholder="Search withdrawals..."
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
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PAID">Paid</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {/* Method Filter */}
                        <div>
                            <select
                                value={methodFilter}
                                onChange={(e) => setMethodFilter(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="all">All Methods</option>
                                <option value="BANK">Bank</option>
                                <option value="EWALLET">E-Wallet</option>
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
                                onClick={loadWithdrawals}
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
                            Withdrawals ({filteredWithdrawals.length})
                        </h2>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Request ID</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Clipper</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Requested</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {filteredWithdrawals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                                            No withdrawal requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWithdrawals.map((withdrawal) => {
                                        const config = statusConfig[withdrawal.status] || statusConfig.PENDING;
                                        const Icon = config.icon;
                                        const priority = withdrawal.status === "PENDING";

                                        return (
                                            <tr
                                                key={withdrawal.id}
                                                className="hover:bg-white/[0.02] group transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-zinc-400 text-xs font-mono">
                                                        {withdrawal.id.slice(0, 12)}...
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">
                                                        {withdrawal.user?.name || "Unknown"}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {withdrawal.user?.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-white">
                                                        {formatCurrency(withdrawal.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-zinc-300 text-sm font-medium">
                                                            {withdrawal.paymentMethod?.type === "BANK"
                                                                ? withdrawal.paymentMethod?.bankName || "Bank Transfer"
                                                                : withdrawal.paymentMethod?.ewalletType || "E-Wallet"}
                                                        </div>
                                                        {withdrawal.paymentMethod?.label && (
                                                            <div className="text-zinc-500 text-[10px]">
                                                                {withdrawal.paymentMethod.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} border-${config.text.replace("text-", "")}/20`}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-xs">
                                                    {format(new Date(withdrawal.createdAt), "MMM dd, HH:mm")}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/admin/finance/withdrawals/${withdrawal.id}`)
                                                        }
                                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${priority
                                                            ? "bg-white text-black hover:bg-zinc-100 shadow-lg shadow-white/20"
                                                            : "bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 hover:border-zinc-500 text-white"
                                                            }`}
                                                    >
                                                        {priority ? "Review" : "Details"}
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
                    <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex justify-between items-center">
                        <span className="text-xs text-zinc-500">
                            Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal requests
                        </span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default WithdrawalQueue;
