import { useNavigate } from "react-router-dom";
import { Filter, RefreshCw, Flag, Megaphone, Wallet } from "lucide-react";

type QueueItemType = "submission" | "campaign" | "withdrawal";
type QueueItemStatus = "flagged" | "pending" | "processing";
type PriorityLevel = "high" | "medium" | "low";

interface QueueItem {
    id: string;
    type: QueueItemType;
    priority: PriorityLevel;
    user: string;
    detail: string;
    status: QueueItemStatus;
    createdAt: string;
}

interface OperationalQueueProps {
    items: QueueItem[];
    highPriorityCount: number;
    onRefresh?: () => void;
}

const typeIcons: Record<QueueItemType, { icon: React.ReactNode; label: string }> = {
    submission: { icon: <Flag className="w-4 h-4 text-red-400" />, label: "Submission" },
    campaign: { icon: <Megaphone className="w-4 h-4 text-amber-400" />, label: "New Campaign" },
    withdrawal: { icon: <Wallet className="w-4 h-4 text-blue-400" />, label: "Withdrawal" },
};

const statusStyles: Record<QueueItemStatus, string> = {
    flagged: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const priorityDots: Record<PriorityLevel, string> = {
    high: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    medium: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    low: "bg-zinc-600",
};

export const OperationalQueue = ({ items, highPriorityCount, onRefresh }: OperationalQueueProps) => {
    const navigate = useNavigate();

    const getItemUrl = (item: QueueItem): string => {
        switch (item.type) {
            case "submission":
                return `/admin/submissions/${item.id}`;
            case "campaign":
                return "/admin/campaigns/review";
            case "withdrawal":
                return `/admin/finance/withdrawals/${item.id}`;
            default:
                return "#";
        }
    };

    const handleRowClick = (item: QueueItem, e: React.MouseEvent) => {
        // Don't navigate if clicking on the action button
        if ((e.target as HTMLElement).closest('a, button')) {
            return;
        }
        navigate(getItemUrl(item));
    };

    return (
        <div className="glass-panel-v2 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-white">Operational Queue</h2>
                    {highPriorityCount > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                            {highPriorityCount} High Priority
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-white/5 rounded text-zinc-400 transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-white/5 rounded text-zinc-400 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-zinc-400 border-b border-white/10 bg-white/[0.03]">
                            <th className="px-6 py-3 font-medium uppercase tracking-wider w-8">#</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">User / Campaign</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/10">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                    No items in queue
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr 
                                    key={item.id} 
                                    className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                                    onClick={(e) => handleRowClick(item, e)}
                                >
                                    {/* Priority Dot */}
                                    <td className="px-6 py-4">
                                        <span className={`w-2 h-2 rounded-full block ${priorityDots[item.priority]}`} />
                                    </td>

                                    {/* Type */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            {typeIcons[item.type].icon}
                                            {typeIcons[item.type].label}
                                        </div>
                                    </td>

                                    {/* User / Detail */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{item.user}</div>
                                        <div className="text-xs text-zinc-500">{item.detail}</div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[item.status]}`}
                                        >
                                            {item.status === "pending" ? "Pending Approval" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </span>
                                    </td>

                                    {/* Created At */}
                                    <td className="px-6 py-4 text-zinc-400 text-xs">{item.createdAt}</td>

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <a
                                            href={getItemUrl(item)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(getItemUrl(item));
                                            }}
                                            className={`inline-block px-4 py-1.5 rounded-md text-xs font-semibold 
                                                transition-all duration-200 
                                                hover:scale-105 active:scale-95 active:brightness-90
                                                ${item.priority === "high"
                                                    ? "bg-white text-black hover:bg-zinc-100 shadow-lg shadow-white/20"
                                                    : "bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 hover:border-zinc-500 text-white"
                                                }`}
                                        >
                                            {item.status === "pending" || item.status === "flagged" ? "Review" : "Details"}
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex justify-center">
                <button
                    onClick={() => navigate("/admin/submissions")}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                    View full queue ({items.length} items)
                </button>
            </div>
        </div>
    );
};

export default OperationalQueue;
