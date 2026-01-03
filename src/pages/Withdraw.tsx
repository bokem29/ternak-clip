import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Wallet,
  Building2,
  Smartphone
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    paymentMethodId: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setFetching(true);
      // [ENGINE_INTEGRATION_POINT] - Web Balance API
      // This uses the new web balance system instead of wallet balance
      const [webBalanceData, methodsData] = await Promise.all([
        api.get('/clipper/web-balance').catch(() => ({ balance: 0 })),
        api.get('/wallet/payment-methods'),
      ]);
      setWallet({ availableBalance: webBalanceData.balance || 0, pendingBalance: 0, lockedBalance: 0 });
      setPaymentMethods(methodsData.paymentMethods || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const minWithdraw = 50000; // Rp 50.000

      if (!amount || amount < minWithdraw) {
        toast({
          title: 'Invalid Amount',
          description: `Minimum withdrawal is ${formatCurrency(minWithdraw)}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (amount > (wallet?.availableBalance || 0)) {
        toast({
          title: 'Insufficient Balance',
          description: 'You do not have enough available balance',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.paymentMethodId) {
        toast({
          title: 'Payment Method Required',
          description: 'Please select a payment method',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // [ENGINE_INTEGRATION_POINT] - Withdrawal Request API
      // Uses new withdrawal system with trust score analysis
      const paymentMethod = paymentMethods.find(m => m.id === formData.paymentMethodId);
      await api.post('/clipper/withdrawals', {
        amount,
        paymentMethod: {
          type: paymentMethod?.type || 'BANK',
          details: paymentMethod
        },
      });

      toast({
        title: 'Withdrawal Request Submitted',
        description: 'Your withdrawal request has been submitted and is pending admin approval.',
      });

      navigate('/wallet');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit withdrawal request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-4 h-4" />;
      case 'EWALLET':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const availableBalance = wallet?.availableBalance || 0;
  const minWithdraw = 50000;
  const canWithdraw = availableBalance >= minWithdraw;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wallet')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Button>
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-1.5">Tarik Dana</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Request withdrawal to your payment method</p>
        </div>

        {/* Balance Info */}
        <Card variant="glass" className="mb-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Saldo Tersedia</p>
                <p className="text-2xl sm:text-3xl font-display font-bold">{formatCurrency(availableBalance)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Pending Balance:</span>
                <span>{formatCurrency(wallet?.pendingBalance || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Locked Balance:</span>
                <span>{formatCurrency(wallet?.lockedBalance || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!canWithdraw && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Minimum withdrawal amount is {formatCurrency(minWithdraw)}. Your available balance is {formatCurrency(availableBalance)}.
            </AlertDescription>
          </Alert>
        )}

        {paymentMethods.length === 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to add a payment method before withdrawing. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/wallet/payment-methods')}>Add payment method</Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Withdrawal Request</CardTitle>
              <CardDescription className="text-xs">Fill in the details for your withdrawal request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (Rupiah) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={minWithdraw}
                  max={availableBalance}
                  step="1000"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={!canWithdraw}
                  className="touch-target"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: {formatCurrency(minWithdraw)} • Maximum: {formatCurrency(availableBalance)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                {paymentMethods.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground mb-2">No payment methods added</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/wallet/payment-methods')}
                    >
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.paymentMethodId}
                    onValueChange={(value) => {
                      const method = paymentMethods.find(m => m.id === value);
                      setFormData({
                        ...formData,
                        paymentMethodId: value,
                        paymentMethod: method?.type || ''
                      });
                    }}
                    required
                    disabled={!canWithdraw}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{method.label}</p>
                              <p className="text-xs text-muted-foreground">{method.details}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!canWithdraw}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Processing Time:</strong> Withdrawals are processed within 1-3 business days after admin approval.
                  <br />
                  <strong>Minimum Amount:</strong> {formatCurrency(minWithdraw)}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/wallet')}
                  className="flex-1 touch-target"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !canWithdraw || paymentMethods.length === 0}
                  className="flex-1 touch-target"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Submit Withdrawal Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;


