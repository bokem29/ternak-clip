import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Shield,
    AlertTriangle,
    FileText,
    Activity,
    Lock,
    Flag,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    TrendingUp,
    Video,
    MessageSquare,
    Plus,
    Save,
    ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface FullUserProfile {
    // Public Data
    user_id: string;
    username: string;
    display_name: string;
    email: string;
    user_type: "CLIPPER" | "INFLUENCER";
    role?: "admin" | "clipper" | "influencer"; // Original role from API
    status: "ACTIVE" | "SUSPENDED" | "BANNED";
    avatar_url: string | null;
    created_at: string;
    last_active_at: string;
    joined_date: string;
    
    // Stats
    clipper_stats?: {
        total_clips: number;
        completed_campaigns: number;
        total_views: number;
        approval_rate: number;
        total_earnings: number;
    };
    influencer_stats?: {
        total_campaigns: number;
        active_campaigns: number;
        total_spend: number;
        total_clips_received: number;
    };
    
    // Internal Data (Admin Only)
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    system_flags: Array<{
        flag_type: "MANUAL" | "AUTOMATED";
        flag_reason: string;
        flagged_by: string;
        flagged_at: string;
        resolved: boolean;
    }>;
    violation_count: number;
    violations: Array<{
        violation_type: string;
        severity: "LOW" | "MEDIUM" | "HIGH";
        occurred_at: string;
        resolved: boolean;
        action_taken: string;
    }>;
    payout_status: "ACTIVE" | "RESTRICTED" | "SUSPENDED";
    payout_restriction_reason: string | null;
    total_payouts: number;
    pending_payouts: number;
    dispute_count: number;
    
    // Trust Score (Full Data - Admin Only)
    trust_status: {
        label: "GOOD" | "LIMITED" | "RESTRICTED" | "PENDING";
        badge_color: "emerald" | "amber" | "red" | "gray";
        description: string;
    };
    trust_score_internal: number | null;
    trust_level: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" | null;
    trust_calculation: {
        last_calculated: string | null;
        calculation_version: string | null;
        factors: {
            account_age_score: number | null;
            activity_score: number | null;
            violation_penalty: number | null;
            financial_behavior_score: number | null;
        };
    };
    
    // Internal Notes
    internal_notes: Array<{
        note_id: string;
        admin_id: string;
        admin_name: string;
        note: string;
        created_at: string;
        is_private: boolean;
    }>;
}

type TabType = 'overview' | 'internal' | 'trust' | 'activity' | 'notes';

const AdminUserProfile = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<FullUserProfile | null>(null);
    const [newNote, setNewNote] = useState("");
    const [isPrivateNote, setIsPrivateNote] = useState(false);
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        if (userId) {
            loadProfile();
        }
    }, [userId]);

    const loadProfile = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            // Try to fetch from profile endpoint first
            try {
                const data = await api.get(`/admin/users/${userId}/profile`);
                // If profile data doesn't have role, fetch it from user data
                if (!data.role) {
                    try {
                        const userData = await api.get(`/admin/users/${userId}`);
                        data.role = userData.role;
                    } catch (e) {
                        // Ignore if user endpoint also fails
                    }
                }
                setProfile(data);
                return;
            } catch (profileError: any) {
                // If profile endpoint fails, fetch from users list or user details
                console.log("Profile endpoint not available, fetching from users API");
                
                let userData: any = null;
                
                // Try to get user from /admin/users/:id endpoint
                try {
                    userData = await api.get(`/admin/users/${userId}`);
                } catch (userError: any) {
                    // If that fails, fetch all users and find the one we need
                    try {
                        const usersResponse = await api.get("/admin/users");
                        const users = usersResponse.users || [];
                        userData = users.find((u: any) => u.id === userId);
                    } catch (listError: any) {
                        console.error("Failed to fetch user data:", listError);
                        throw new Error("Failed to load user data");
                    }
                }
                
                if (!userData) {
                    throw new Error("User not found");
                }
                
                // Map user data to FullUserProfile format
                const mappedProfile: FullUserProfile = {
                    user_id: userData.id || userId,
                    username: userData.email?.split('@')[0] || "user",
                    display_name: userData.name || "User",
                    email: userData.email || "user@example.com",
                    role: userData.role, // Store original role
                    user_type: userData.role === 'admin' ? 'CLIPPER' : (userData.role === 'influencer' ? 'INFLUENCER' : 'CLIPPER'),
                    status: (userData.status?.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'BANNED') || 'ACTIVE',
                    avatar_url: null,
                    created_at: userData.createdAt || new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                    joined_date: userData.createdAt || new Date().toISOString(),
                    clipper_stats: userData.role === 'clipper' ? {
                        total_clips: userData.totalSubmissions || 0,
                        completed_campaigns: userData.approvedSubmissions || 0,
                        total_views: 0,
                        approval_rate: userData.approvalRate || 0,
                        total_earnings: userData.balance || 0,
                    } : undefined,
                    influencer_stats: userData.role === 'influencer' ? {
                        total_campaigns: 0,
                        active_campaigns: 0,
                        total_spend: 0,
                        total_clips_received: userData.totalSubmissions || 0,
                    } : undefined,
                    risk_level: "LOW",
                    system_flags: [],
                    violation_count: 0,
                    violations: [],
                    payout_status: "ACTIVE",
                    payout_restriction_reason: null,
                    total_payouts: userData.balance || 0,
                    pending_payouts: userData.pendingBalance || 0,
                    dispute_count: 0,
                    trust_status: {
                        label: "PENDING",
                        badge_color: "gray",
                        description: "Trust status is being calculated",
                    },
                    trust_score_internal: null,
                    trust_level: null,
                    trust_calculation: {
                        last_calculated: null,
                        calculation_version: "dummy-v1.0",
                        factors: {
                            account_age_score: null,
                            activity_score: null,
                            violation_penalty: null,
                            financial_behavior_score: null,
                        },
                    },
                    internal_notes: [],
                };
                setProfile(mappedProfile);
            }
        } catch (error: any) {
            console.error("Failed to load profile:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load user profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!userId || !newNote.trim()) return;

        try {
            setAddingNote(true);
            await api.post(`/admin/users/${userId}/notes`, {
                note: newNote,
                is_private: isPrivateNote,
            });
            toast({
                title: "Success",
                description: "Note added successfully",
            });
            setNewNote("");
            setIsPrivateNote(false);
            loadProfile();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add note",
                variant: "destructive",
            });
        } finally {
            setAddingNote(false);
        }
    };

    const handleStatusChange = async (newStatus: "SUSPENDED" | "BANNED") => {
        if (!userId) return;
        const reason = prompt(`Reason for ${newStatus.toLowerCase()}:`);
        if (!reason) return;

        try {
            await api.patch(`/admin/users/${userId}/status`, {
                status: newStatus,
                reason,
            });
            toast({
                title: "Success",
                description: `User status updated to ${newStatus}`,
            });
            loadProfile();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const getTrustBadgeColor = (label: string) => {
        const colors: Record<string, string> = {
            GOOD: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            LIMITED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            RESTRICTED: "bg-red-500/10 text-red-400 border-red-500/20",
            PENDING: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        };
        return colors[label] || colors.PENDING;
    };

    const getRiskBadgeColor = (level: string) => {
        const colors: Record<string, string> = {
            LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return colors[level] || colors.LOW;
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            SUSPENDED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            BANNED: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return colors[status] || colors.ACTIVE;
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminHeader title="User Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading profile...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!profile) {
        return (
            <AdminLayout>
                <AdminHeader title="User Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-400 text-sm">User not found</p>
                </div>
            </AdminLayout>
        );
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: User },
        { id: 'internal' as TabType, label: 'Internal Data', icon: Lock },
        { id: 'trust' as TabType, label: 'Trust Status', icon: Shield },
        { id: 'activity' as TabType, label: 'Activity', icon: Activity },
        { id: 'notes' as TabType, label: 'Notes / Flags', icon: FileText },
    ];

    return (
        <AdminLayout>
            <AdminHeader title="User Profile" subtitle={profile.display_name} />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Users
                    </button>
                </div>

                {/* Profile Header */}
                <div className="glass-panel-v2 rounded-xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-zinc-300" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-white">{profile.display_name}</h2>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeColor(profile.status)}`}>
                                        {profile.status}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${
                                        profile.role === 'admin' 
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : profile.role === 'influencer'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {profile.role || profile.user_type}
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-sm mb-1">@{profile.username}</p>
                                <p className="text-zinc-500 text-xs">{profile.email}</p>
                                <p className="text-zinc-500 text-xs mt-1">
                                    Joined {format(new Date(profile.joined_date), "MMM dd, yyyy")} • Last active: {profile.last_active_at ? format(new Date(profile.last_active_at), "MMM dd, yyyy HH:mm") : "Never"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {profile.status === "ACTIVE" && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange("SUSPENDED")}
                                        className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-all"
                                    >
                                        Suspend
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange("BANNED")}
                                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-all"
                                    >
                                        Ban
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="glass-panel-v2 rounded-xl overflow-hidden mb-6">
                    <div className="flex border-b border-white/5 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? "text-white border-blue-500 bg-white/5"
                                            : "text-zinc-400 border-transparent hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {profile.user_type === "CLIPPER" && profile.clipper_stats && (
                                        <>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Total Clips</span>
                                                    <Video className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.clipper_stats.total_clips}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Campaigns</span>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.clipper_stats.completed_campaigns}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Total Views</span>
                                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.clipper_stats.total_views.toLocaleString()}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Earnings</span>
                                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{formatCurrency(profile.clipper_stats.total_earnings)}</p>
                                            </div>
                                        </>
                                    )}
                                    {profile.user_type === "INFLUENCER" && profile.influencer_stats && (
                                        <>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Total Campaigns</span>
                                                    <Video className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.influencer_stats.total_campaigns}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Active</span>
                                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.influencer_stats.active_campaigns}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Clips Received</span>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{profile.influencer_stats.total_clips_received}</p>
                                            </div>
                                            <div className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500 uppercase">Total Spend</span>
                                                    <DollarSign className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">{formatCurrency(profile.influencer_stats.total_spend)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Account Information</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-zinc-400">User ID</span>
                                            <p className="text-white font-mono text-xs">{profile.user_id}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">Username</span>
                                            <p className="text-white">{profile.username}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">Email</span>
                                            <p className="text-white">{profile.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">User Type</span>
                                            <p className="text-white">{profile.user_type}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">Created At</span>
                                            <p className="text-white">{format(new Date(profile.created_at), "MMM dd, yyyy HH:mm")}</p>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400">Last Active</span>
                                            <p className="text-white">{profile.last_active_at ? format(new Date(profile.last_active_at), "MMM dd, yyyy HH:mm") : "Never"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Internal Data Tab */}
                        {activeTab === 'internal' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Risk Assessment
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Risk Level</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getRiskBadgeColor(profile.risk_level)}`}>
                                                {profile.risk_level}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Violation Count</span>
                                            <span className="text-sm text-white font-medium">{profile.violation_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Dispute Count</span>
                                            <span className="text-sm text-white font-medium">{profile.dispute_count}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Flag className="w-4 h-4" />
                                        System Flags ({profile.system_flags.length})
                                    </h3>
                                    {profile.system_flags.length === 0 ? (
                                        <p className="text-zinc-400 text-sm">No flags</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {profile.system_flags.map((flag, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-zinc-400">{flag.flag_type}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${flag.resolved ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                                            {flag.resolved ? "Resolved" : "Active"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-white">{flag.flag_reason}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        By {flag.flagged_by} • {format(new Date(flag.flagged_at), "MMM dd, yyyy")}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Financial Status
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Payout Status</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getStatusBadgeColor(profile.payout_status)}`}>
                                                {profile.payout_status}
                                            </span>
                                        </div>
                                        {profile.payout_restriction_reason && (
                                            <div>
                                                <span className="text-sm text-zinc-400">Restriction Reason</span>
                                                <p className="text-sm text-white mt-1">{profile.payout_restriction_reason}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Total Payouts</span>
                                            <span className="text-sm text-white font-medium">{formatCurrency(profile.total_payouts)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Pending Payouts</span>
                                            <span className="text-sm text-white font-medium">{formatCurrency(profile.pending_payouts)}</span>
                                        </div>
                                    </div>
                                </div>

                                {profile.violations.length > 0 && (
                                    <div className="glass-card-primary p-4 rounded-lg">
                                        <h3 className="text-sm font-semibold text-white mb-4">Violations</h3>
                                        <div className="space-y-2">
                                            {profile.violations.map((violation, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm text-white font-medium">{violation.violation_type}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${getRiskBadgeColor(violation.severity)}`}>
                                                            {violation.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 mt-1">
                                                        {format(new Date(violation.occurred_at), "MMM dd, yyyy")} • {violation.action_taken}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trust Status Tab */}
                        {activeTab === 'trust' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Trust Status
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-zinc-400 mb-1">Status Label</p>
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium border ${getTrustBadgeColor(profile.trust_status.label)}`}>
                                                    {profile.trust_status.label}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-zinc-400 mb-1">Trust Score (Internal)</p>
                                                <p className="text-2xl font-bold text-white">
                                                    {profile.trust_score_internal !== null ? profile.trust_score_internal : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-400 mb-1">Description</p>
                                            <p className="text-sm text-white">{profile.trust_status.description}</p>
                                        </div>
                                        {profile.trust_level && (
                                            <div>
                                                <p className="text-sm text-zinc-400 mb-1">Trust Level</p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRiskBadgeColor(profile.trust_level)}`}>
                                                    {profile.trust_level}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {profile.trust_calculation && (
                                    <div className="glass-card-primary p-4 rounded-lg">
                                        <h3 className="text-sm font-semibold text-white mb-4">Calculation Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-400">Last Calculated</span>
                                                <span className="text-sm text-white">
                                                    {profile.trust_calculation.last_calculated
                                                        ? format(new Date(profile.trust_calculation.last_calculated), "MMM dd, yyyy HH:mm")
                                                        : "Never"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-400">Calculation Version</span>
                                                <span className="text-sm text-white">
                                                    {profile.trust_calculation.calculation_version || "dummy-v1.0"}
                                                </span>
                                            </div>
                                            {profile.trust_calculation.factors && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-xs text-zinc-500 uppercase mb-2">Factors</p>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-400">Account Age</span>
                                                            <span className="text-white">{profile.trust_calculation.factors.account_age_score || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-400">Activity</span>
                                                            <span className="text-white">{profile.trust_calculation.factors.activity_score || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-400">Violation Penalty</span>
                                                            <span className="text-white">{profile.trust_calculation.factors.violation_penalty || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-400">Financial Behavior</span>
                                                            <span className="text-white">{profile.trust_calculation.factors.financial_behavior_score || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                                    <p className="text-zinc-400 text-sm">Activity logs will be displayed here</p>
                                </div>
                            </div>
                        )}

                        {/* Notes / Flags Tab */}
                        {activeTab === 'notes' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Internal Notes
                                    </h3>
                                    
                                    {/* Add Note Form */}
                                    <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Add internal note..."
                                            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 resize-none mb-2"
                                            rows={3}
                                        />
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-xs text-zinc-400">
                                                <input
                                                    type="checkbox"
                                                    checked={isPrivateNote}
                                                    onChange={(e) => setIsPrivateNote(e.target.checked)}
                                                    className="w-3 h-3"
                                                />
                                                Private (SUPER_ADMIN only)
                                            </label>
                                            <button
                                                onClick={handleAddNote}
                                                disabled={!newNote.trim() || addingNote}
                                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                {addingNote ? (
                                                    <>
                                                        <Clock className="w-3 h-3 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-3 h-3" />
                                                        Add Note
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notes List */}
                                    {profile.internal_notes.length === 0 ? (
                                        <p className="text-zinc-400 text-sm">No notes</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {profile.internal_notes.map((note) => (
                                                <div
                                                    key={note.note_id}
                                                    className="p-3 rounded-lg bg-zinc-900/50 border border-white/5"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-sm text-white">{note.admin_name}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                {format(new Date(note.created_at), "MMM dd, yyyy HH:mm")}
                                                            </p>
                                                        </div>
                                                        {note.is_private && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                                Private
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{note.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUserProfile;

