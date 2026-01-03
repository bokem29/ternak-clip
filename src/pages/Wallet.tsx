import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  CreditCard,
  History
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const Wallet = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({
    balance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    lockedBalance: 0,
    totalEarned: 0,
    lifetimeEarned: 0,
    totalWithdrawn: 0,
    lifetimeWithdrawn: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        api.get('/wallet'),
        api.get('/transactions'),
      ]);

      setWallet(walletData);
      setTransactions(transactionsData.transactions || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data dompet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    navigate('/wallet/withdraw');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const stats = [
    {
      title: "Saldo Tersedia",
      value: formatCurrency(wallet.availableBalance || wallet.balance),
      icon: <WalletIcon className="w-4 h-4" />,
      change: "Dapat ditarik"
    },
    {
      title: "Pendapatan Menunggu",
      value: formatCurrency(wallet.pendingBalance),
      icon: <Clock className="w-4 h-4" />,
      change: "Menunggu persetujuan"
    },
    {
      title: "Saldo Terkunci",
      value: formatCurrency(wallet.lockedBalance || 0),
      icon: <Clock className="w-4 h-4" />,
      change: "Dalam proses penarikan"
    },
    {
      title: "Total Pendapatan",
      value: formatCurrency(wallet.lifetimeEarned || wallet.totalEarned),
      icon: <TrendingUp className="w-4 h-4" />,
      change: "Total seumur hidup"
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Dompet</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Kelola pendapatan dan penarikan Anda</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => navigate('/wallet/history')} className="touch-target w-full sm:w-auto">
            <History className="w-4 h-4 mr-2" />
            Riwayat
          </Button>
          <Button onClick={handleWithdraw} disabled={(wallet.availableBalance || wallet.balance) < 50000} className="touch-target w-full sm:w-auto">
            <ArrowUpRight className="w-4 h-4" />
            Tarik Dana
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            variant="glass"
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                  {stat.icon}
                </div>
              </div>
              <p className="text-lg sm:text-xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Transaction History */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display">Riwayat Transaksi</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/wallet/history')}
              >
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada transaksi
              </p>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${transaction.type?.includes("REWARD") || transaction.type === "earning"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-secondary text-foreground"
                      }`}>
                      {transaction.type?.includes("REWARD") || transaction.type === "earning" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transaction.description || transaction.type || 'Transaksi'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt || transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${transaction.amount > 0 ? "text-emerald-400" : "text-foreground"
                      }`}>
                      {transaction.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    {(transaction.status === "pending" || transaction.status === "PENDING") && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1">
                        Menunggu
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <Card variant="glass">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-display">Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="p-3 rounded-lg bg-secondary/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-background" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rekening Bank</p>
                  <p className="text-xs text-muted-foreground">Tambah metode pembayaran</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/wallet/payment-methods')}
              >
                Tambah Metode Pembayaran
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-display">Pengaturan Penarikan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Penarikan</span>
                <span className="font-medium">{formatCurrency(50000)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Waktu Proses</span>
                <span className="font-medium">1-3 hari kerja</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya Transaksi</span>
                <span className="font-medium text-emerald-400">Gratis</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;
