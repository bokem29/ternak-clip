import { Link, useLocation } from "react-router-dom";
import {
    LayoutGrid,
    Megaphone,
    FileCheck,
    Users,
    UserCheck,
    ArrowLeftRight,
    Wallet,
    ShieldAlert,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
} from "lucide-react";
import { useSidebar } from "./AdminLayout";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

export const AdminSidebar = () => {
    const location = useLocation();
    const { isCollapsed, toggleSidebar } = useSidebar();

    const navGroups: NavGroup[] = [
        {
            title: "Overview",
            items: [
                { label: "Dashboard", href: "/admin", icon: <LayoutGrid className="w-4 h-4" /> },
            ],
        },
        {
            title: "Management",
            items: [
                { label: "Campaigns", href: "/admin/campaigns", icon: <Megaphone className="w-4 h-4" /> },
                { label: "Submissions", href: "/admin/submissions", icon: <FileCheck className="w-4 h-4" /> },
                { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
                { label: "Influencers", href: "/admin/influencers", icon: <UserCheck className="w-4 h-4" /> },
                { label: "API Performance", href: "/admin/api-performance", icon: <Activity className="w-4 h-4" /> },
            ],
        },
        {
            title: "Finance",
            items: [
                { label: "Transactions", href: "/admin/finance/transactions", icon: <ArrowLeftRight className="w-4 h-4" /> },
                { label: "Withdrawals", href: "/admin/finance/withdrawals", icon: <Wallet className="w-4 h-4" /> },
            ],
        },
        {
            title: "System",
            items: [
                { label: "Audit Logs", href: "/admin/audit-logs", icon: <ShieldAlert className="w-4 h-4" /> },
                { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
            ],
        },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") {
            return location.pathname === "/admin";
        }
        return location.pathname.startsWith(href);
    };

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#09090b] border-r border-white/5 flex flex-col z-30 shrink-0 transition-all duration-300 relative`}>
            {/* Logo Header */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 relative z-40">
                {!isCollapsed && (
                <Link to="/admin" className="flex items-center gap-2">
                    <img
                        src="/logo-ternak.png"
                        alt="Ternak Klip"
                        className="h-8 w-auto"
                    />
                </Link>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs mx-auto">
                        TK
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all z-50 shadow-xl"
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navGroups.map((group, groupIndex) => (
                    <div key={group.title}>
                        {!isCollapsed && (
                        <div className={`px-3 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider ${groupIndex > 0 ? 'mt-6' : ''}`}>
                            {group.title}
                        </div>
                        )}
                        {group.items.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200
                                    active:scale-[0.97] active:brightness-90
                                    ${isActive(item.href)
                                        ? "text-white bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                    }`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className={`transition-colors ${isActive(item.href) ? "text-blue-400" : ""}`}>
                                    {item.icon}
                                </span>
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer Status */}
            <div className="p-4 border-t border-white/5">
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-zinc-600">v2.1.0</span>
                    </div>
                ) : (
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-zinc-400">System Healthy</span>
                    <span className="text-xs text-zinc-600 ml-auto">v2.1.0</span>
                </div>
                )}
            </div>
        </aside>
    );
};

export default AdminSidebar;
