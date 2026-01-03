import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Settings, LogOut, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
}

interface SearchResult {
    type: 'user' | 'campaign' | 'submission' | 'transaction';
    id: string;
    title: string;
    subtitle?: string;
    route: string;
}

export const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    // Search across different entities
                    const results: SearchResult[] = [];
                    
                    // Search users
                    try {
                        const usersData = await api.get(`/admin/users?search=${encodeURIComponent(searchQuery)}`);
                        if (usersData.users) {
                            usersData.users.slice(0, 3).forEach((user: any) => {
                                results.push({
                                    type: 'user',
                                    id: user.id,
                                    title: user.name || user.email,
                                    subtitle: user.email,
                                    route: `/admin/users/${user.id}`
                                });
                            });
                        }
                    } catch (e) {
                        // Ignore if endpoint doesn't exist
                    }

                    // Search campaigns
                    try {
                        const campaignsData = await api.get(`/campaigns?search=${encodeURIComponent(searchQuery)}`);
                        if (campaignsData.campaigns) {
                            campaignsData.campaigns.slice(0, 3).forEach((campaign: any) => {
                                results.push({
                                    type: 'campaign',
                                    id: campaign.id,
                                    title: campaign.title,
                                    subtitle: `ID: ${campaign.id.slice(0, 8)}`,
                                    route: `/admin/campaigns/${campaign.id}`
                                });
                            });
                        }
                    } catch (e) {
                        // Ignore if endpoint doesn't exist
                    }

                    // Search submissions
                    try {
                        const submissionsData = await api.get(`/submissions?search=${encodeURIComponent(searchQuery)}`);
                        if (submissionsData.submissions) {
                            submissionsData.submissions.slice(0, 3).forEach((submission: any) => {
                                results.push({
                                    type: 'submission',
                                    id: submission.id,
                                    title: submission.title || `Submission ${submission.id.slice(0, 8)}`,
                                    subtitle: submission.user?.name || submission.user?.email,
                                    route: `/admin/submissions/${submission.id}`
                                });
                            });
                        }
                    } catch (e) {
                        // Ignore if endpoint doesn't exist
                    }

                    setSearchResults(results);
                    setShowResults(results.length > 0);
                } catch (error) {
                    console.error("Search error:", error);
                    setSearchResults([]);
                    setShowResults(false);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);

    const handleResultClick = (route: string) => {
        navigate(route);
        setSearchQuery("");
        setShowResults(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchQuery.trim().length >= 2) {
            // Navigate to first result or show all results
            if (searchResults.length > 0) {
                handleResultClick(searchResults[0].route);
            }
        } else if (e.key === "Escape") {
            setShowResults(false);
        }
    };

    return (
        <header className="h-14 glass-header-v2 flex items-center justify-between px-6 sticky top-0 z-20">
            <div>
                <h1 className="font-semibold text-white">{title}</h1>
                {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/5">
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search ID/User..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none text-xs text-zinc-300 w-48 placeholder-zinc-600"
                    />
                        {isSearching && (
                            <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 right-0 w-80 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                            <div className="max-h-96 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleResultClick(result.route)}
                                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {result.type === 'user' && <User className="w-4 h-4 text-blue-400" />}
                                                {result.type === 'campaign' && <Search className="w-4 h-4 text-purple-400" />}
                                                {result.type === 'submission' && <Search className="w-4 h-4 text-emerald-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{result.title}</p>
                                                {result.subtitle && (
                                                    <p className="text-xs text-zinc-400 truncate">{result.subtitle}</p>
                                                )}
                                                <p className="text-[10px] text-zinc-500 mt-1 uppercase">{result.type}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification */}
                <button className="relative text-zinc-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />
                </button>

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border border-white/10">
                        <DropdownMenuLabel className="text-white">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-zinc-400">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            onClick={() => navigate('/admin/profile')}
                            className="text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate('/admin/settings')}
                            className="text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate('/admin/profile')}
                            className="text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Security
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default AdminHeader;

