import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  DollarSign,
  Plus,
  Download,
  CreditCard,
  History,
  CheckCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const PaymentInvoice = () => {
  const { user, refreshUser } = useAuth();
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTopupHistory();
  }, []);

  const loadTopupHistory = async () => {
    try {
      const data = await api.get('/influencer/topup-history');
      setTopupHistory(data.transactions || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load top up history',
        variant: 'destructive',
      });
    }
  };

  const handleTopUp = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Masukkan jumlah top up yang valid',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/influencer/topup', { amount: parseFloat(topupAmount) });
      toast({
        title: 'Top Up Success',
        description: `Budget berhasil di-top up sebesar $${parseFloat(topupAmount).toFixed(2)}`,
      });
      setTopupAmount("");
      await refreshUser();
      loadTopupHistory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to top up',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (transaction: any) => {
    // Simple invoice generation
    const invoice = `
INVOICE
================================
Date: ${new Date(transaction.date).toLocaleDateString()}
Transaction ID: ${transaction.id}
Type: Budget Top Up
Amount: $${transaction.amount.toFixed(2)}
Status: ${transaction.status}
================================
Thank you for your payment!
    `.trim();

    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${transaction.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Invoice Downloaded',
      description: 'Invoice telah di-download',
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/influencer">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold mb-1.5">Payment & Invoice</h1>
        <p className="text-sm text-muted-foreground">Top up budget & download invoice</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Current Budget */}
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Budget</p>
                <p className="text-3xl font-display font-bold">${(user?.budget || 0).toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Available untuk membuat campaign baru
            </p>
          </CardContent>
        </Card>

        {/* Total Top Up */}
        <Card variant="glass">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Top Up</p>
                <p className="text-3xl font-display font-bold">
                  ${topupHistory.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {topupHistory.length} top up transactions
            </p>
          </CardContent>
        </Card>

        {/* Quick Top Up */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base font-display">Quick Top Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="100.00"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleTopUp}
              disabled={loading || !topupAmount}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Top Up Budget'}
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setTopupAmount('100')}
              >
                $100
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setTopupAmount('500')}
              >
                $500
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setTopupAmount('1000')}
              >
                $1000
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Up History */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base font-display">Top Up History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topupHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No top up history yet
              </p>
            ) : (
              topupHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg text-emerald-400">
                        +${transaction.amount.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        <CheckCircle className="w-2 h-2 mr-1" />
                        {transaction.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(transaction)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Invoice
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PaymentInvoice;

