import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpRight, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WalletCardProps {
  balance: number;
  pendingBalance: number;
  onWithdraw?: () => void;
  onHistory?: () => void;
  className?: string; // Added className prop
}

export const WalletCard = ({ balance, pendingBalance, onWithdraw, onHistory, className }: WalletCardProps) => {
  return (
    <Card variant="glass" className={`overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Dompet Anda</CardTitle>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
          <p className="text-3xl font-display font-bold">{formatCurrency(balance)}</p>
        </div>

        {/* Pending */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Menunggu</span>
          </div>
          <span className="text-sm font-medium">{formatCurrency(pendingBalance)}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="default" size="sm" onClick={onWithdraw}>
            <ArrowUpRight className="w-3.5 h-3.5" />
            Tarik
          </Button>
          <Button variant="outline" size="sm" onClick={onHistory}>
            <History className="w-3.5 h-3.5" />
            Riwayat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};