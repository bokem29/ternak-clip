import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  userId: string;
  type: 'earning' | 'withdrawal';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  userName?: string;
}

const TransactionManagement = () => {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState({
    totalBalance: 0,
    totalPendingPayout: 0,
    payoutToday: 0,
    payoutWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, statsData] = await Promise.all([
        api.get('/wallet?all=true'),
        api.get('/admin/stats')
      ]);

      setTransactions(transactionsData.transactions || []);
      setWallet({
        totalBalance: statsData.totalBalance || 0,
        totalPendingPayout: statsData.totalPendingPayout || 0,
        payoutToday: statsData.payoutToday || 0,
        payoutWeek: statsData.payoutWeek || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (transactionId: string, status: 'completed' | 'cancelled') => {
    try {
      await api.patch(`/admin/transactions/${transactionId}/status`, { status });
      toast({
        title: 'Success',
        description: `Transaction status updated to ${status}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const pendingWithdrawals = transactions.filter(t =>
    t.type === 'withdrawal' && t.status === 'pending'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold mb-1.5">Transaction Management</h1>
        <p className="text-sm text-muted-foreground">Kelola payout & transaksi - mark as paid, cancel, adjust balance</p>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold">{formatCurrency(wallet.totalBalance)}</p>
                <p className="text-xs text-muted-foreground">Total Balance</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold">{formatCurrency(wallet.totalPendingPayout)}</p>
                <p className="text-xs text-muted-foreground">Pending Payout</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold">{formatCurrency(wallet.payoutToday)}</p>
                <p className="text-xs text-muted-foreground">Payout Today</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display font-bold">{formatCurrency(wallet.payoutWeek)}</p>
                <p className="text-xs text-muted-foreground">Payout This Week</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilterStatus('all')}>
            All ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setFilterStatus('pending')}>
            Pending ({pendingWithdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setFilterStatus('completed')}>
            Completed ({transactions.filter(t => t.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredTransactions.map(transaction => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onStatusChange={handleStatusChange}
              formatDate={formatDate}
            />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingWithdrawals.map(transaction => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onStatusChange={handleStatusChange}
              formatDate={formatDate}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {filteredTransactions.filter(t => t.status === 'completed').map(transaction => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onStatusChange={handleStatusChange}
              formatDate={formatDate}
            />
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

const TransactionCard = ({
  transaction,
  onStatusChange,
  formatDate
}: {
  transaction: Transaction;
  onStatusChange: (id: string, status: 'completed' | 'cancelled') => void;
  formatDate: (date: string) => string;
}) => {
  const statusConfig = {
    pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
    completed: { color: "bg-emerald-500/20 text-emerald-400", label: "Completed" },
    cancelled: { color: "bg-red-500/20 text-red-400", label: "Cancelled" }
  };

  const config = statusConfig[transaction.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Card variant="glass">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'earning'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-blue-500/20 text-blue-400'
              }`}>
              {transaction.type === 'earning' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{transaction.description || 'Transaction'}</p>
                <Badge className={config.color}>{config.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {transaction.userName || 'Unknown User'} • {formatDate(transaction.date)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${transaction.amount > 0 ? 'text-emerald-400' : 'text-foreground'
                }`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
            </div>
          </div>
          {transaction.status === 'pending' && transaction.type === 'withdrawal' && (
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(transaction.id, 'completed')}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark Paid
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onStatusChange(transaction.id, 'cancelled')}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionManagement;

