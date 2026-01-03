import { useNavigate } from "react-router-dom";
import { Landmark, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type HealthStatus = "online" | "slow" | "down";

interface ApiService {
    name: string;
    status: HealthStatus;
    percentage: number;
}

interface ApiHealthStatusProps {
    balance: number;
    flaggedCount: number;
    services: ApiService[];
}

const statusColors: Record<HealthStatus, { text: string; bar: string }> = {
    online: { text: "text-emerald-500", bar: "bg-emerald-500" },
    slow: { text: "text-yellow-500", bar: "bg-yellow-500" },
    down: { text: "text-red-500", bar: "bg-red-500" },
};

export const ApiHealthStatus = ({ balance, flaggedCount, services }: ApiHealthStatusProps) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {/* Total Balance Card */}
            <div className="glass-card-primary hover:border-white/20 transition-colors p-4 rounded-xl flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs">Total Balance</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(balance)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                </div>
            </div>

            {/* Flagged Count Card */}
            <div className="glass-card-primary hover:border-white/20 transition-colors p-4 rounded-xl flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs">Flagged Count</p>
                    <p className="text-lg font-bold text-white">
                        {flaggedCount} <span className="text-xs font-normal text-zinc-400">/ month</span>
                    </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-400" />
                </div>
            </div>

            {/* API Health Card */}
            <div 
                className="glass-card-primary p-4 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                onClick={() => navigate("/admin/api-performance")}
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-xs">API Health Status</p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/admin/api-performance");
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View Details
                    </button>
                </div>
                <div className="space-y-3">
                    {services.map((service) => (
                        <div key={service.name}>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-300">{service.name}</span>
                                <span className={statusColors[service.status].text}>
                                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-700/50 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                    className={`h-full ${statusColors[service.status].bar}`}
                                    style={{ width: `${service.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ApiHealthStatus;
