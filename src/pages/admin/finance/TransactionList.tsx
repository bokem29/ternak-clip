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
    X,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
} from "lucide-react";

interface Transaction {
    id: string;
    userId: string;
    user?: { name?: string; email?: string };
    type: string;
    amount: number;
    description?: string;
    status: string;
    date?: string;
    createdAt: string;
    relatedEntityId?: string;
}

const TransactionList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [transactions, searchQuery, typeFilter, statusFilter]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await api.get("/transactions");

            // Enrich with user data
            const enriched = (data.transactions || []).map((tx: Transaction) => {
                // In real app, this would come from a join or separate API call
                return {
                    ...tx,
                    user: { name: "User", email: tx.userId }
                };
            });

            setTransactions(enriched);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load transactions",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        let filtered = transactions;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (tx) =>
                    tx.id?.toLowerCase().includes(query) ||
                    tx.description?.toLowerCase().includes(query) ||
                    tx.userId?.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter((tx) => tx.type === typeFilter);
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((tx) => tx.status === statusFilter);
        }

        setFilteredTransactions(filtered);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setTypeFilter("all");
        setStatusFilter("all");
    };

    // Calculate stats
    const totalIn = transactions
        .filter((tx) => tx.amount > 0 && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalOut = Math.abs(
        transactions
            .filter((tx) => tx.amount < 0 && tx.status === "completed")
            .reduce((sum, tx) => sum + tx.amount, 0)
    );

    const netBalance = totalIn - totalOut;

    const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
        DEPOSIT: { icon: "", color: "text-emerald-400", label: "Deposit" },
        PAYOUT: { icon: "", color: "text-red-400", label: "Payout" },
        ADJUSTMENT: { icon: "", color: "text-blue-400", label: "Adjustment" },
        ADMIN_ADJUSTMENT: { icon: "", color: "text-blue-400", label: "Admin Adjustment" },
        SUBMISSION_REWARD_APPROVED: { icon: "", color: "text-emerald-400", label: "Reward" },
        WITHDRAW_REQUEST: { icon: "", color: "text-amber-400", label: "Withdraw Request" },
        WITHDRAW_APPROVED: { icon: "", color: "text-emerald-400", label: "Withdraw Approved" },
        WITHDRAW_REJECTED: { icon: "", color: "text-red-400", label: "Withdraw Rejected" },
    };

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
        completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
        cancelled: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Cancelled" },
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminHeader title="Transactions" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading transactions...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminHeader title="Transactions" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass-card-primary rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Total In
                                </p>
                                <p className="text-emerald-400 text-2xl font-bold">{formatCurrency(totalIn)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card-primary rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Total Out
                                </p>
                                <p className="text-red-400 text-2xl font-bold">{formatCurrency(totalOut)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <ArrowDownCircle className="w-5 h-5 text-red-400" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card-primary rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Net Balance
                                </p>
                                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {formatCurrency(netBalance)}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netBalance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                                }`}>
                                <DollarSign className={`w-5 h-5 ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`} />
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
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="all">All Types</option>
                                <option value="DEPOSIT">Deposit</option>
                                <option value="PAYOUT">Payout</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="SUBMISSION_REWARD_APPROVED">Reward</option>
                                <option value="WITHDRAW_APPROVED">Withdraw Approved</option>
                                <option value="WITHDRAW_REJECTED">Withdraw Rejected</option>
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
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
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
                                onClick={loadTransactions}
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
                            Transactions ({filteredTransactions.length})
                        </h2>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => {
                                        const typeCfg = typeConfig[tx.type] || {
                                            icon: "📄",
                                            color: "text-zinc-400",
                                            label: tx.type
                                        };
                                        const statusCfg = statusConfig[tx.status] || statusConfig.pending;

                                        return (
                                            <tr
                                                key={tx.id}
                                                onClick={() => navigate(`/admin/finance/transactions/${tx.id}`)}
                                                className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-zinc-400 text-xs font-mono">
                                                        {tx.id.slice(0, 12)}...
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{typeCfg.icon}</span>
                                                        <span className={typeCfg.color}>{typeCfg.label} </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-300">
                                                    <div className="text-xs text-zinc-500">{tx.userId.slice(0, 8)}...</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                        {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
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
                                                    {tx.date || tx.createdAt
                                                        ? format(new Date(tx.date || tx.createdAt), "MMM dd, HH:mm")
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
                            Showing {filteredTransactions.length} of {transactions.length} transactions
                        </span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default TransactionList;
