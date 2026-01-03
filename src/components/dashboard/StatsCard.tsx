import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  prefix?: string;
}

export const StatsCard = ({ title, value, change, icon, prefix = "" }: StatsCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card variant="glass" className="group hover:border-border transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold tracking-tight">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${
                isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-muted-foreground"
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNegative ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{isPositive ? "+" : ""}{change}%</span>
                <span className="text-muted-foreground">vs minggu lalu</span>
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground group-hover:bg-accent transition-colors duration-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};