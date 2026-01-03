import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
    Activity,
    Zap,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    ExternalLink,
    Server,
    Network,
    Globe,
} from "lucide-react";

// Mock Data - Replace with real API service later
interface ApiService {
    id: string;
    name: string;
    provider: string;
    status: "online" | "slow" | "down";
    latency: number; // ms
    errorRate: number; // percentage
    uptime: number; // percentage
    lastChecked: string;
    totalRequests: number;
    successRate: number; // percentage
    avgResponseTime: number; // ms
    trend: "up" | "down" | "stable";
}

interface ApiCall {
    id: string;
    service: string;
    endpoint: string;
    method: string;
    status: number;
    responseTime: number; // ms
    timestamp: string;
    success: boolean;
}

// Mock API Services Data
const mockApiServices: ApiService[] = [
    {
        id: "youtube",
        name: "YouTube Data API",
        provider: "Google",
        status: "online",
        latency: 20,
        errorRate: 0.1,
        uptime: 99.9,
        lastChecked: "2 min ago",
        totalRequests: 15420,
        successRate: 99.9,
        avgResponseTime: 185,
        trend: "up",
    },
    {
        id: "instagram",
        name: "Instagram Graph API",
        provider: "Meta",
        status: "online",
        latency: 35,
        errorRate: 0.3,
        uptime: 99.7,
        lastChecked: "1 min ago",
        totalRequests: 8920,
        successRate: 99.7,
        avgResponseTime: 320,
        trend: "stable",
    },
    {
        id: "tiktok",
        name: "TikTok Scraper",
        provider: "Internal",
        status: "slow",
        latency: 450,
        errorRate: 2.5,
        uptime: 97.5,
        lastChecked: "30 sec ago",
        totalRequests: 12350,
        successRate: 97.5,
        avgResponseTime: 1200,
        trend: "down",
    },
    {
        id: "payment",
        name: "Payment Gateway",
        provider: "Midtrans",
        status: "online",
        latency: 15,
        errorRate: 0.05,
        uptime: 99.95,
        lastChecked: "1 min ago",
        totalRequests: 3450,
        successRate: 99.95,
        avgResponseTime: 120,
        trend: "up",
    },
    {
        id: "webhook",
        name: "Webhook Service",
        provider: "Internal",
        status: "online",
        latency: 25,
        errorRate: 0.2,
        uptime: 99.8,
        lastChecked: "45 sec ago",
        totalRequests: 5670,
        successRate: 99.8,
        avgResponseTime: 95,
        trend: "stable",
    },
];

// Mock Recent API Calls
const mockApiCalls: ApiCall[] = [
    {
        id: "1",
        service: "YouTube Data API",
        endpoint: "/v3/videos",
        method: "GET",
        status: 200,
        responseTime: 185,
        timestamp: "2 min ago",
        success: true,
    },
    {
        id: "2",
        service: "Instagram Graph API",
        endpoint: "/v18.0/media",
        method: "GET",
        status: 200,
        responseTime: 320,
        timestamp: "3 min ago",
        success: true,
    },
    {
        id: "3",
        service: "TikTok Scraper",
        endpoint: "/api/video/metadata",
        method: "GET",
        status: 500,
        responseTime: 2500,
        timestamp: "5 min ago",
        success: false,
    },
    {
        id: "4",
        service: "Payment Gateway",
        endpoint: "/v2/charge",
        method: "POST",
        status: 200,
        responseTime: 120,
        timestamp: "7 min ago",
        success: true,
    },
    {
        id: "5",
        service: "YouTube Data API",
        endpoint: "/v3/channels",
        method: "GET",
        status: 200,
        responseTime: 195,
        timestamp: "8 min ago",
        success: true,
    },
    {
        id: "6",
        service: "Webhook Service",
        endpoint: "/webhook/submission",
        method: "POST",
        status: 200,
        responseTime: 95,
        timestamp: "10 min ago",
        success: true,
    },
];

const ApiPerformance = () => {
    const navigate = useNavigate();
    const [services] = useState<ApiService[]>(mockApiServices);
    const [recentCalls] = useState<ApiCall[]>(mockApiCalls);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh - Replace with real API call later
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "online":
                return "text-emerald-500";
            case "slow":
                return "text-yellow-500";
            case "down":
                return "text-red-500";
            default:
                return "text-zinc-500";
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case "online":
                return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
            case "slow":
                return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
            case "down":
                return "bg-red-500/10 border-red-500/20 text-red-400";
            default:
                return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "online":
                return "Online";
            case "slow":
                return "Slow";
            case "down":
                return "Down";
            default:
                return "Unknown";
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case "GET":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "POST":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "PUT":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "DELETE":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            default:
                return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        }
    };

    return (
        <AdminLayout>
            <AdminHeader title="API Performance" subtitle="Monitor and track API service health and metrics" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm text-zinc-400">All systems operational</span>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* API Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="glass-card-primary rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer"
                            onClick={() => {
                                // Navigate to service detail - implement later
                                console.log("Navigate to service detail:", service.id);
                            }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${service.status === "online" ? "bg-emerald-500/10" : service.status === "slow" ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
                                        {service.id === "youtube" && <Activity className="w-5 h-5 text-red-400" />}
                                        {service.id === "instagram" && <Zap className="w-5 h-5 text-purple-400" />}
                                        {service.id === "tiktok" && <Network className="w-5 h-5 text-black" />}
                                        {service.id === "payment" && <Server className="w-5 h-5 text-blue-400" />}
                                        {service.id === "webhook" && <Globe className="w-5 h-5 text-green-400" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                                        <p className="text-xs text-zinc-500">{service.provider}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBg(service.status)}`}>
                                    {getStatusBadge(service.status)}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Latency</p>
                                        <p className="text-sm font-semibold text-white">{service.latency}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Error Rate</p>
                                        <p className={`text-sm font-semibold ${service.errorRate > 1 ? "text-red-400" : "text-emerald-400"}`}>
                                            {service.errorRate}%
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-zinc-500">Uptime</p>
                                        <p className="text-xs font-medium text-white">{service.uptime}%</p>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full ${service.status === "online" ? "bg-emerald-500" : service.status === "slow" ? "bg-yellow-500" : "bg-red-500"}`}
                                            style={{ width: `${service.uptime}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Clock className="w-3 h-3" />
                                        {service.lastChecked}
                                    </div>
                                    {service.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                                    {service.trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
                                    {service.trend === "stable" && <div className="w-4 h-4 rounded-full bg-zinc-600" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Overall Stats */}
                    <div className="lg:col-span-2 glass-panel-v2 rounded-xl p-6">
                        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Overall Performance Metrics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-card-primary p-4 rounded-lg">
                                <p className="text-xs text-zinc-500 mb-1">Total Requests</p>
                                <p className="text-2xl font-bold text-white">
                                    {services.reduce((sum, s) => sum + s.totalRequests, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="glass-card-primary p-4 rounded-lg">
                                <p className="text-xs text-zinc-500 mb-1">Avg Latency</p>
                                <p className="text-2xl font-bold text-white">
                                    {Math.round(services.reduce((sum, s) => sum + s.latency, 0) / services.length)}ms
                                </p>
                            </div>
                            <div className="glass-card-primary p-4 rounded-lg">
                                <p className="text-xs text-zinc-500 mb-1">Success Rate</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {(
                                        services.reduce((sum, s) => sum + s.successRate, 0) / services.length
                                    ).toFixed(1)}%
                                </p>
                            </div>
                            <div className="glass-card-primary p-4 rounded-lg">
                                <p className="text-xs text-zinc-500 mb-1">Avg Uptime</p>
                                <p className="text-2xl font-bold text-white">
                                    {(services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-panel-v2 rounded-xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate("/admin/settings?tab=integration")}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all text-left flex items-center justify-between"
                            >
                                <span>API Configuration</span>
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all text-left flex items-center justify-between"
                            >
                                <span>Refresh All Services</span>
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    // View logs - implement later
                                    console.log("View API logs");
                                }}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all text-left flex items-center justify-between"
                            >
                                <span>View API Logs</span>
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent API Calls */}
                <div className="glass-panel-v2 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Recent API Calls
                        </h3>
                        <button
                            onClick={() => {
                                // View all - implement later
                                console.log("View all API calls");
                            }}
                            className="text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-zinc-400 border-b border-white/10 bg-white/[0.03]">
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Endpoint</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Response Time</th>
                                    <th className="px-6 py-3 font-medium uppercase tracking-wider">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/10">
                                {recentCalls.map((call) => (
                                    <tr key={call.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{call.service}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                                                {call.endpoint}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getMethodColor(call.method)}`}
                                            >
                                                {call.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {call.success ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {call.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-400">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {call.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-sm ${call.responseTime > 1000 ? "text-red-400" : call.responseTime > 500 ? "text-yellow-400" : "text-emerald-400"}`}
                                            >
                                                {call.responseTime}ms
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-xs">{call.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ApiPerformance;


