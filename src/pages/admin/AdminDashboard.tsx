import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, DollarSign, FilePlus, TrendingUp, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// V2 Admin Components
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AlertBar } from "@/components/admin/AlertBar";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { OperationalQueue } from "@/components/admin/OperationalQueue";
import { PerformanceChart } from "@/components/admin/PerformanceChart";
import { ApiHealthStatus } from "@/components/admin/ApiHealthStatus";

interface DashboardStats {
    activeCampaigns: number;
    pendingApprovals: number;
    pendingPayout: number;
    pendingPayoutCount: number;
    todaySubmissions: number;
    submissionsChange: number;
    flaggedCount: number;
    totalBalance: number;
}

interface QueueItem {
    id: string;
    type: "submission" | "campaign" | "withdrawal";
    priority: "high" | "medium" | "low";
    user: string;
    detail: string;
    status: "flagged" | "pending" | "processing";
    createdAt: string;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        activeCampaigns: 0,
        pendingApprovals: 0,
        pendingPayout: 0,
        pendingPayoutCount: 0,
        todaySubmissions: 0,
        submissionsChange: 0,
        flaggedCount: 0,
        totalBalance: 0,
    });
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [chartData, setChartData] = useState<number[]>([30, 45, 35, 60, 50, 75, 85]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all necessary data
            const [campaignsRes, submissionsRes, withdrawalsRes] = await Promise.all([
                api.get("/campaigns").catch(() => ({ campaigns: [] })),
                api.get("/submissions").catch(() => ({ submissions: [] })),
                api.get("/admin/withdrawals").catch(() => ({ withdrawals: [] })),
            ]);

            const campaigns = campaignsRes.campaigns || [];
            const submissions = submissionsRes.submissions || [];
            const withdrawals = withdrawalsRes.withdrawals || [];

            // Calculate stats
            const activeCampaigns = campaigns.filter(
                (c: any) => c.status === "active" || c.status === "ACTIVE"
            ).length;
            const pendingApprovals = campaigns.filter(
                (c: any) => c.status === "pending" || c.status === "PENDING_APPROVAL"
            ).length;

            const pendingWithdrawals = withdrawals.filter(
                (w: any) => w.status === "pending" || w.status === "PENDING"
            );
            const pendingPayout = pendingWithdrawals.reduce(
                (sum: number, w: any) => sum + (w.amount || 0),
                0
            );

            // Today's submissions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todaySubmissions = submissions.filter((s: any) => {
                const subDate = new Date(s.submittedAt || s.createdAt);
                return subDate >= today;
            }).length;

            // Flagged submissions
            const flaggedSubmissions = submissions.filter((s: any) => s.flagged);

            // Build queue items
            const queue: QueueItem[] = [];

            // Add flagged submissions (high priority)
            flaggedSubmissions.slice(0, 3).forEach((s: any) => {
                queue.push({
                    id: s.id,
                    type: "submission",
                    priority: "high",
                    user: `@${s.clipperName || s.userName || "unknown"}`,
                    detail: `Campaign: ${s.campaignTitle || "Unknown"}`,
                    status: "flagged",
                    createdAt: formatRelativeTime(s.submittedAt || s.createdAt),
                });
            });

            // Add pending campaigns (medium priority)
            campaigns
                .filter((c: any) => c.status === "pending" || c.status === "PENDING_APPROVAL")
                .slice(0, 2)
                .forEach((c: any) => {
                    queue.push({
                        id: c.id,
                        type: "campaign",
                        priority: "medium",
                        user: c.influencerName || c.title || "Unknown",
                        detail: `Budget: ${formatCurrency(c.totalBudget || c.budget || 0)}`,
                        status: "pending",
                        createdAt: formatRelativeTime(c.createdAt),
                    });
                });

            // Add pending withdrawals (medium priority for pending, low for others)
            pendingWithdrawals.slice(0, 2).forEach((w: any) => {
                const withdrawalStatus = w.status?.toLowerCase() || "pending";
                const isPending = withdrawalStatus === "pending" || withdrawalStatus === "pending_admin_review" || withdrawalStatus === "requested";
                const isFlagged = withdrawalStatus.includes("flag") || withdrawalStatus.includes("investigation");
                
                queue.push({
                    id: w.id,
                    type: "withdrawal",
                    priority: isFlagged ? "high" : isPending ? "medium" : "low",
                    user: `@${w.userName || w.clipperName || "unknown"}`,
                    detail: `Amount: ${formatCurrency(w.amount || 0)} • ${w.paymentMethod?.type || w.bankName || "Bank"}`,
                    status: isFlagged ? "flagged" : isPending ? "pending" : "processing",
                    createdAt: formatRelativeTime(w.createdAt || w.requestedAt),
                });
            });

            setStats({
                activeCampaigns,
                pendingApprovals,
                pendingPayout,
                pendingPayoutCount: pendingWithdrawals.length,
                todaySubmissions,
                submissionsChange: 12, // Placeholder
                flaggedCount: flaggedSubmissions.length,
                totalBalance: 45200000, // Placeholder - would come from wallet API
            });

            setQueueItems(queue);

            // Generate chart data from submissions (last 7 days)
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const count = submissions.filter((s: any) => {
                    const subDate = new Date(s.submittedAt || s.createdAt);
                    return subDate >= date && subDate < nextDate;
                }).length;

                last7Days.push(count || Math.floor(Math.random() * 50) + 20); // Fallback to random if no data
            }
            setChartData(last7Days);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load dashboard data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    };

    const alertMessage = `Attention Needed: ${stats.pendingApprovals} Campaigns Pending Approval & ${stats.flaggedCount} Flagged Submission`;
    const showAlert = stats.pendingApprovals > 0 || stats.flaggedCount > 0;

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Alert Bar */}
            {showAlert && (
                <AlertBar
                    message={alertMessage}
                    onAction={() => navigate("/admin/submissions?status=pending")}
                />
            )}

            {/* Header */}
            <AdminHeader title="Dashboard Overview" />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <AdminStatCard
                        title="Active Campaigns"
                        value={stats.activeCampaigns}
                        subtitle="Active Campaigns"
                        icon={<Zap className="w-5 h-5" />}
                        color="blue"
                        label="Live"
                        badge={stats.activeCampaigns > 0 ? `${Math.min(stats.activeCampaigns, 2)} New` : undefined}
                        badgeColor="emerald"
                    />

                    <AdminStatCard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        subtitle="Pending Approvals"
                        icon={<Clock className="w-5 h-5" />}
                        color="amber"
                        label="Action Required"
                        badge="Avg wait: 2h"
                        badgeColor="zinc"
                        highlight={stats.pendingApprovals > 0}
                    />

                    <AdminStatCard
                        title="Pending Payout"
                        value={formatCurrency(stats.pendingPayout)}
                        subtitle="Pending Payout"
                        icon={<DollarSign className="w-5 h-5" />}
                        color="emerald"
                        label="Finance"
                        badge={`${stats.pendingPayoutCount} Requests`}
                        badgeColor="zinc"
                    />

                    <AdminStatCard
                        title="Today Submissions"
                        value={stats.todaySubmissions}
                        subtitle="Today Submissions"
                        icon={<FilePlus className="w-5 h-5" />}
                        color="purple"
                        label="Volume"
                        badge={
                            stats.submissionsChange > 0 ? (
                                <span className="flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stats.submissionsChange}%
                                </span>
                            ) : undefined
                        }
                        badgeColor="emerald"
                    />
                </div>

                {/* Operational Queue */}
                <div className="mb-8">
                    <OperationalQueue
                        items={queueItems}
                        highPriorityCount={queueItems.filter((q) => q.priority === "high").length}
                        onRefresh={loadDashboardData}
                    />
                </div>

                {/* Charts & Status Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Chart */}
                    <div className="lg:col-span-2">
                        <PerformanceChart data={chartData} />
                    </div>

                    {/* API Health & Stats */}
                    <ApiHealthStatus
                        balance={stats.totalBalance}
                        flaggedCount={stats.flaggedCount}
                        services={[
                            { name: "Payment Gateway", status: "online", percentage: 100 },
                            { name: "TikTok Scraper", status: "slow", percentage: 80 },
                        ]}
                    />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
