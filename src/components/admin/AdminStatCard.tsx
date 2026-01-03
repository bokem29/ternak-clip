import { ReactNode } from "react";

type ColorVariant = "blue" | "amber" | "emerald" | "purple";

interface AdminStatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: ReactNode;
    color: ColorVariant;
    badge?: string | ReactNode;
    badgeColor?: "emerald" | "zinc";
    highlight?: boolean;
    label?: string;
}

const colorConfig: Record<ColorVariant, {
    iconBg: string;
    iconText: string;
    glow: string;
    border: string;
    hoverBorder: string;
    accentGlow: string;
}> = {
    blue: {
        iconBg: "bg-blue-500/20",
        iconText: "text-blue-400",
        glow: "shadow-[0_0_12px_rgba(59,130,246,0.15)]",
        border: "border-blue-500/15",
        hoverBorder: "hover:border-blue-400/30",
        accentGlow: "bg-blue-500/15",
    },
    amber: {
        iconBg: "bg-amber-500/20",
        iconText: "text-amber-400",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        border: "border-amber-500/15",
        hoverBorder: "hover:border-amber-400/30",
        accentGlow: "bg-amber-500/15",
    },
    emerald: {
        iconBg: "bg-emerald-500/20",
        iconText: "text-emerald-400",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        border: "border-emerald-500/15",
        hoverBorder: "hover:border-emerald-400/30",
        accentGlow: "bg-emerald-500/15",
    },
    purple: {
        iconBg: "bg-purple-500/20",
        iconText: "text-purple-400",
        glow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]",
        border: "border-purple-500/15",
        hoverBorder: "hover:border-purple-400/30",
        accentGlow: "bg-purple-500/15",
    },
};

export const AdminStatCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
    badge,
    badgeColor = "emerald",
    highlight = false,
    label = "",
}: AdminStatCardProps) => {
    const config = colorConfig[color];

    return (
        <div
            className={`relative overflow-hidden p-5 rounded-xl group cursor-pointer 
                bg-zinc-900/80 backdrop-blur-md
                border ${config.border} ${config.hoverBorder}
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:shadow-xl
                active:scale-[0.98] active:brightness-90
                ${highlight ? "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]" : ""}
            `}
        >
            {/* Color accent glow in corner */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${config.accentGlow} blur-3xl rounded-full -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity`} />

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex justify-between items-start mb-4">
                {/* Icon with colored background and glow */}
                <div
                    className={`p-3 rounded-xl ${config.iconBg} ${config.iconText} ${config.glow}
                        transition-all duration-300 group-hover:scale-110`}
                >
                    {icon}
                </div>

                {/* Label */}
                <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded
                        ${highlight
                            ? "text-amber-300 bg-amber-500/20 animate-pulse"
                            : "text-zinc-400 bg-zinc-800/50"
                        }`}
                >
                    {label || title}
                </span>
            </div>

            {/* Value - Pure White with slight text shadow */}
            <div className="relative text-3xl font-bold text-white mb-1 drop-shadow-sm">{value}</div>

            {/* Footer */}
            <div className="relative flex justify-between items-end">
                <span className="text-zinc-400 text-xs">{subtitle}</span>
                {badge && (
                    <span
                        className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded font-medium
                            transition-all duration-200
                            ${badgeColor === "emerald"
                                ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/30"
                                : "text-zinc-400 bg-zinc-800"
                            }`}
                    >
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AdminStatCard;


