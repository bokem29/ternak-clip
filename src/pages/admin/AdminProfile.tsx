import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
    User,
    Shield,
    Lock,
    Activity,
    Clock,
    Settings,
    Key,
    Smartphone,
    LogOut,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Trash2,
    Globe,
    Mail,
    Calendar,
    TrendingUp,
    FileText,
} from "lucide-react";
import { format } from "date-fns";

interface AdminProfile {
    admin_id: string;
    username: string;
    full_name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'REVIEWER' | 'FINANCE' | 'SUPPORT';
    status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
    created_at: string;
    last_active?: string;
    two_factor_enabled?: boolean;
    two_factor_method?: 'TOTP' | 'SMS' | 'EMAIL';
    failed_login_attempts?: number;
    password_last_changed?: string;
}

interface Session {
    id: string;
    ip_address: string;
    user_agent: string;
    device_info?: string;
    login_at: string;
    last_activity?: string;
    is_current: boolean;
}

interface AuditLog {
    id: string;
    admin_id: string;
    admin_name?: string;
    action_type: string;
    target_type: string;
    target_id: string;
    before_value?: any;
    after_value?: any;
    reason?: string;
    timestamp: string;
    ip_address?: string;
}

interface AdminMetrics {
    total_actions: number;
    fraud_cases_reviewed: number;
    trust_scores_edited: number;
    last_active: string;
}

type TabType = 'overview' | 'security' | 'sessions' | 'activity' | 'permissions' | 'preferences';

const AdminProfile = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

    // Security form state
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'sessions') {
            loadSessions();
        } else if (activeTab === 'activity') {
            loadAuditLogs();
        } else if (activeTab === 'overview') {
            loadMetrics();
        }
    }, [activeTab]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/data');
            setProfile(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSessions = async () => {
        try {
            const data = await api.get('/admin/data?type=sessions');
            setSessions(data.sessions || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load sessions',
                variant: 'destructive',
            });
        }
    };

    const loadAuditLogs = async () => {
        try {
            const data = await api.get('/admin/data?type=activity');
            setAuditLogs(data.logs || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load audit logs',
                variant: 'destructive',
            });
        }
    };

    const loadMetrics = async () => {
        try {
            const data = await api.get('/admin/data?type=metrics');
            setMetrics(data);
        } catch (error: any) {
            // Silently fail if metrics don't exist
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.new !== passwordForm.confirm) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (passwordForm.new.length < 8) {
            toast({
                title: 'Error',
                description: 'Password must be at least 8 characters',
                variant: 'destructive',
            });
            return;
        }

        try {
            setUpdatingPassword(true);
            await api.post('/admin/profile/change-password', {
                current_password: passwordForm.current,
                new_password: passwordForm.new,
            });

            toast({
                title: 'Success',
                description: 'Password updated successfully',
            });

            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update password',
                variant: 'destructive',
            });
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to revoke this session?')) return;

        try {
            await api.delete(`/admin/profile/sessions/${sessionId}`);
            toast({
                title: 'Success',
                description: 'Session revoked successfully',
            });
            loadSessions();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to revoke session',
                variant: 'destructive',
            });
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm('Are you sure you want to revoke all other sessions? This will log you out from all other devices.')) return;

        try {
            await api.post('/admin/profile/sessions/revoke-all');
            toast({
                title: 'Success',
                description: 'All other sessions revoked',
            });
            loadSessions();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to revoke sessions',
                variant: 'destructive',
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            SUPER_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
            ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            MODERATOR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            REVIEWER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            FINANCE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            SUPPORT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        };
        return colors[role] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            DISABLED: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return colors[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminHeader title="Admin Profile" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400 text-sm">Loading profile...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: User },
        { id: 'security' as TabType, label: 'Security', icon: Lock },
        { id: 'sessions' as TabType, label: 'Sessions', icon: Clock },
        { id: 'activity' as TabType, label: 'Activity', icon: Activity },
        { id: 'permissions' as TabType, label: 'Permissions', icon: Shield },
        { id: 'preferences' as TabType, label: 'Preferences', icon: Settings },
    ];

    return (
        <AdminLayout>
            <AdminHeader title="Admin Profile" subtitle="Manage your account settings and security" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Profile Header */}
                <div className="glass-panel rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                            <User className="w-10 h-10 text-zinc-300" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-white">{profile?.full_name || user?.name}</h2>
                                {profile?.role && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(profile.role)}`}>
                                        {profile.role.replace('_', ' ')}
                                    </span>
                                )}
                                {profile?.status && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeColor(profile.status)}`}>
                                        {profile.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-400 text-sm mb-1">{profile?.email || user?.email}</p>
                            <p className="text-zinc-500 text-xs">Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMM dd, yyyy') : 'N/A'}</p>
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
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                                            ? 'text-white border-blue-500 bg-white/5'
                                            : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="glass-card-primary p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-zinc-500 uppercase">Total Actions</span>
                                            <Activity className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-white">{metrics?.total_actions || 0}</p>
                                    </div>
                                    <div className="glass-card-primary p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-zinc-500 uppercase">Fraud Cases</span>
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-white">{metrics?.fraud_cases_reviewed || 0}</p>
                                    </div>
                                    <div className="glass-card-primary p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-zinc-500 uppercase">Trust Scores</span>
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-white">{metrics?.trust_scores_edited || 0}</p>
                                    </div>
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Account Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Username</span>
                                            <span className="text-sm text-white font-medium">{profile?.username || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Email</span>
                                            <span className="text-sm text-white font-medium">{profile?.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Role</span>
                                            <span className="text-sm text-white font-medium">{profile?.role?.replace('_', ' ') || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Status</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getStatusBadgeColor(profile?.status || '')}`}>
                                                {profile?.status || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Last Active</span>
                                            <span className="text-sm text-white font-medium">
                                                {profile?.last_active ? format(new Date(profile.last_active), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        Change Password
                                    </h3>
                                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                        <div>
                                            <label className="text-xs text-zinc-400 mb-1 block">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={passwordForm.current}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="Enter current password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 mb-1 block">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.new}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="Enter new password (min 8 characters)"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 mb-1 block">Confirm New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.confirm}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                                                    placeholder="Confirm new password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={updatingPassword}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatingPassword ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Password'
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4" />
                                        Two-Factor Authentication
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-white font-medium">2FA Status</p>
                                            <p className="text-xs text-zinc-400">
                                                {profile?.two_factor_enabled ? `Enabled (${profile.two_factor_method})` : 'Not enabled'}
                                            </p>
                                        </div>
                                        <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-all">
                                            {profile?.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                                        </button>
                                    </div>
                                </div>

                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Security Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Password Last Changed</span>
                                            <span className="text-sm text-white font-medium">
                                                {profile?.password_last_changed ? format(new Date(profile.password_last_changed), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Failed Login Attempts</span>
                                            <span className="text-sm text-white font-medium">{profile?.failed_login_attempts || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sessions Tab */}
                        {activeTab === 'sessions' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
                                    {sessions.filter(s => !s.is_current).length > 0 && (
                                        <button
                                            onClick={handleRevokeAllSessions}
                                            className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-all"
                                        >
                                            Revoke All Other Sessions
                                        </button>
                                    )}
                                </div>
                                {sessions.length === 0 ? (
                                    <p className="text-zinc-400 text-sm text-center py-8">No active sessions</p>
                                ) : (
                                    <div className="space-y-2">
                                        {sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="glass-card-primary p-4 rounded-lg flex items-center justify-between"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm text-white font-medium">
                                                            {session.device_info || 'Unknown Device'}
                                                        </p>
                                                        {session.is_current && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-zinc-400 mb-1">{session.ip_address}</p>
                                                    <p className="text-xs text-zinc-500">{session.user_agent}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        Last active: {session.last_activity ? format(new Date(session.last_activity), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                                    </p>
                                                </div>
                                                {!session.is_current && (
                                                    <button
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Revoke session"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-white mb-4">Audit Logs</h3>
                                {auditLogs.length === 0 ? (
                                    <p className="text-zinc-400 text-sm text-center py-8">No activity logs</p>
                                ) : (
                                    <div className="space-y-2">
                                        {auditLogs.map((log) => (
                                            <div key={log.id} className="glass-card-primary p-4 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm text-white font-medium">{log.action_type}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                                                {log.target_type}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400">Target ID: {log.target_id}</p>
                                                        {log.reason && (
                                                            <p className="text-xs text-zinc-500 mt-1">Reason: {log.reason}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-zinc-500">
                                                        {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Permissions Tab */}
                        {activeTab === 'permissions' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Role & Permissions</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-400 mb-2">Current Role</p>
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium border ${getRoleBadgeColor(profile?.role || '')}`}>
                                                {profile?.role?.replace('_', ' ') || 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-400 mb-2">Permissions</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-white">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    View Dashboard
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-white">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    Manage Campaigns
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-white">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    Review Submissions
                                                </div>
                                                {profile?.role === 'SUPER_ADMIN' && (
                                                    <>
                                                        <div className="flex items-center gap-2 text-sm text-white">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            Manage Admins
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-white">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                            System Settings
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-4">
                                <div className="glass-card-primary p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-white mb-4">Preferences</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-zinc-400 mb-2 block">Language</label>
                                            <select className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                                                <option>English</option>
                                                <option>Indonesian</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 mb-2 block">Timezone</label>
                                            <select className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                                                <option>UTC</option>
                                                <option>Asia/Jakarta</option>
                                            </select>
                                        </div>
                                        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all">
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProfile;

