import { AlertTriangle } from "lucide-react";

interface AlertBarProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const AlertBar = ({ message, actionLabel = "View Priority Queue", onAction }: AlertBarProps) => {
    return (
        <div className="bg-amber-900/30 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between backdrop-blur-sm z-30">
            <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="font-medium text-sm">{message}</span>
            </div>
            <button
                onClick={onAction}
                className="text-xs text-amber-300 hover:text-amber-100 font-semibold 
                    px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20
                    hover:bg-amber-500/20 hover:border-amber-400/40
                    transition-all duration-200 hover:scale-105 active:scale-95"
            >
                {actionLabel} &rarr;
            </button>
        </div>
    );
};

export default AlertBar;

