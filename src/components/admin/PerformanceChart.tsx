interface PerformanceChartProps {
    data: number[]; // Array of 7 values (Mon-Sun)
    title?: string;
}

export const PerformanceChart = ({ data, title = "Platform Performance (7 Days)" }: PerformanceChartProps) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const maxValue = Math.max(...data, 1);

    return (
        <div className="glass-panel-v2 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">{title}</h3>
                <select className="bg-black/40 border border-white/10 text-xs rounded-md px-2 py-1 text-zinc-300 hover:border-white/20 transition-colors">
                    <option>Submissions</option>
                    <option>Payouts</option>
                    <option>Views</option>
                </select>
            </div>

            {/* Chart Area */}
            <div className="h-48 flex items-end justify-between gap-2 px-2 pb-2 border-b border-white/10 relative">
                {/* Y-Axis Labels */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] text-zinc-500 pointer-events-none pr-2">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                    <span>0</span>
                </div>

                {/* Bars */}
                <div className="flex items-end justify-between gap-3 flex-1 ml-8 h-full">
                    {data.map((value, index) => {
                        const heightPercent = (value / maxValue) * 100;
                        const isToday = index === data.length - 1;

                        return (
                            <div
                                key={index}
                                className={`w-full rounded-t transition-all duration-300 ${isToday
                                        ? "bg-blue-500 hover:bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        : "bg-blue-600/40 hover:bg-blue-500/60"
                                    }`}
                                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                title={`${days[index]}: ${value}`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-zinc-400 mt-2 ml-8">
                {days.map((day) => (
                    <span key={day}>{day}</span>
                ))}
            </div>
        </div>
    );
};

export default PerformanceChart;

