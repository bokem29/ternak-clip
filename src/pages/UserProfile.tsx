import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
    User,
    Edit,
    Video,
    TrendingUp,
    CheckCircle,
    DollarSign,
    Calendar,
    Shield,
    ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PublicProfile {
    user_id: string;
    avatar_url: string | null;
    display_name: string;
    username: string;
    joined_date: string;
    user_type: "CLIPPER" | "INFLUENCER";
    status: "ACTIVE" | "SUSPENDED" | "BANNED";
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
    trust_status: {
        label: "GOOD" | "LIMITED" | "RESTRICTED" | "PENDING";
        badge_color: "emerald" | "amber" | "red" | "gray";
        description: string;
    };
}

const UserProfile = () => {
    const { userId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: "",
        avatar_url: "",
    });

    const isOwnProfile = !userId || userId === currentUser?.id;

    useEffect(() => {
        // Wait for auth to finish loading, then load profile
        if (!authLoading) {
            // If viewing own profile, wait for currentUser; if viewing other user's profile, proceed with userId
            if (userId || currentUser) {
                loadProfile();
            }
        }
    }, [userId, currentUser?.id, authLoading]);

    const createDummyProfile = (targetUserId: string): PublicProfile => {
        return {
            user_id: targetUserId,
            avatar_url: null,
            display_name: currentUser?.name || "User",
            username: currentUser?.email?.split('@')[0] || "user",
            joined_date: new Date().toISOString(),
            user_type: currentUser?.role === 'influencer' ? 'INFLUENCER' : 'CLIPPER',
            status: (currentUser?.status?.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'BANNED') || 'ACTIVE',
            clipper_stats: currentUser?.role === 'clipper' ? {
                total_clips: 0,
                completed_campaigns: 0,
                total_views: 0,
                approval_rate: 0,
                total_earnings: currentUser?.balance || 0,
            } : undefined,
            influencer_stats: currentUser?.role === 'influencer' ? {
                total_campaigns: 0,
                active_campaigns: 0,
                total_spend: 0,
                total_clips_received: 0,
            } : undefined,
            trust_status: {
                label: 'PENDING',
                badge_color: 'gray',
                description: 'Trust status is being calculated',
            },
        };
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            const targetUserId = userId || currentUser?.id;
            
            if (!targetUserId) {
                // If no userId and no currentUser, wait a bit and try again
                setTimeout(() => {
                    if (!profile && (userId || currentUser?.id)) {
                        loadProfile();
                    }
                }, 500);
                return;
            }

            try {
                const data = await api.get(`/users/${targetUserId}/profile`);
                setProfile(data);
                setEditForm({
                    display_name: data.display_name || "",
                    avatar_url: data.avatar_url || "",
                });
            } catch (apiError: any) {
                // Always use dummy data if API fails (endpoint not implemented yet)
                console.log("Profile API not available, using dummy data:", apiError.message);
                // Always create dummy profile - if viewing own profile, use currentUser data
                // If viewing another user's profile, we'll use basic data
                const dummyProfile = createDummyProfile(targetUserId);
                setProfile(dummyProfile);
                setEditForm({
                    display_name: dummyProfile.display_name,
                    avatar_url: dummyProfile.avatar_url || "",
                });
            }
        } catch (error: any) {
            console.error("Profile load error:", error);
            // Fallback to dummy data on any error
            const targetUserId = userId || currentUser?.id;
            if (targetUserId && (currentUser || !userId)) {
                const dummyProfile = createDummyProfile(targetUserId);
                setProfile(dummyProfile);
                setEditForm({
                    display_name: dummyProfile.display_name,
                    avatar_url: dummyProfile.avatar_url || "",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load profile",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isOwnProfile) return;

        try {
            await api.patch(`/users/${currentUser?.id}/profile`, editForm);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            setIsEditing(false);
            loadProfile();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
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

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            SUSPENDED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            BANNED: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return colors[status] || colors.ACTIVE;
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // If profile is still null after loading, show error or wait
    if (!profile && !loading) {
        // If we have currentUser but no profile, try to create one
        const targetUserId = userId || currentUser?.id;
        if (targetUserId && currentUser) {
            // Use useEffect to set profile to avoid infinite loop
            useEffect(() => {
                const dummyProfile = createDummyProfile(targetUserId);
                setProfile(dummyProfile);
                setEditForm({
                    display_name: dummyProfile.display_name,
                    avatar_url: dummyProfile.avatar_url || "",
                });
            }, []);
            return (
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">Loading profile...</p>
                        </div>
                    </div>
                </DashboardLayout>
            );
        }
        
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-2">Profile not found</p>
                        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-display font-bold mb-1.5">Profile</h1>
                <p className="text-sm text-muted-foreground">
                    {isOwnProfile ? "Your profile information" : `${profile.display_name}'s profile`}
                </p>
            </div>

            {/* Profile Header Card */}
            <Card variant="glass" className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-foreground/50" />
                                )}
                            </div>
                            {isOwnProfile && !isEditing && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            {isEditing && isOwnProfile ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.display_name}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, display_name: e.target.value })
                                            }
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            placeholder="Display Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            Avatar URL
                                        </label>
                                        <input
                                            type="url"
                                            value={editForm.avatar_url}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, avatar_url: e.target.value })
                                            }
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSave}>
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(false);
                                                loadProfile();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-display font-bold">
                                            {profile.display_name}
                                        </h2>
                                        <Badge className={getStatusBadgeColor(profile.status)}>
                                            {profile.status}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground mb-2">@{profile.username}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                Joined {format(new Date(profile.joined_date), "MMM yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-4 h-4" />
                                            <span className="capitalize">{profile.user_type.toLowerCase()}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trust Status Card */}
            <Card variant="glass" className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base font-display flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Trust Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Badge className={getTrustBadgeColor(profile.trust_status.label)}>
                            {profile.trust_status.label}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                            {profile.trust_status.description}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            {profile.user_type === "CLIPPER" && profile.clipper_stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Total Clips</p>
                                <Video className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.clipper_stats.total_clips}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Campaigns</p>
                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.clipper_stats.completed_campaigns}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Total Views</p>
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.clipper_stats.total_views.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Total Earnings</p>
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {formatCurrency(profile.clipper_stats.total_earnings)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {profile.user_type === "INFLUENCER" && profile.influencer_stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Total Campaigns</p>
                                <Video className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.influencer_stats.total_campaigns}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Active</p>
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.influencer_stats.active_campaigns}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Clips Received</p>
                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {profile.influencer_stats.total_clips_received}
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground">Total Spend</p>
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-display font-bold">
                                {formatCurrency(profile.influencer_stats.total_spend)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
};

export default UserProfile;

