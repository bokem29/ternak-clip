import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Wallet,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Lock,
    Clock,
    CheckCircle2,
    Info,
    Loader2,
    DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    date: string;
    campaignId?: string;
    campaignTitle?: string;
}

const InfluencerWallet = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [lockedBudget, setLockedBudget] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState("");

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            const [walletData, txData] = await Promise.all([
                api.get('/influencer/wallet'),
                api.get('/influencer/topup-history')
            ]);

            setBalance(walletData.budget || 0);
            setLockedBudget(walletData.lockedBudget || 0);
            setTransactions(txData.transactions || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load wallet data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Please enter a valid amount',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(true);
            await api.post('/influencer/topup', { amount });
            toast({
                title: 'Top-Up Successful',
                description: `$${amount.toFixed(2)} has been added to your budget`,
            });
            setShowTopUpModal(false);
            setTopUpAmount("");
            await loadWalletData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to process top-up',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        if (type.includes('TOPUP') || type.includes('DEPOSIT')) {
            return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
        } else if (type.includes('LOCK') || type.includes('CAMPAIGN')) {
            return <Lock className="w-4 h-4 text-blue-400" />;
        }
        return <ArrowUpRight className="w-4 h-4 text-gray-400" />;
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
            completed: { color: "bg-emerald-500/20 text-emerald-400", label: "Completed" },
            pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
            failed: { color: "bg-red-500/20 text-red-400", label: "Failed" },
            locked: { color: "bg-blue-500/20 text-blue-400", label: "Locked" },
        };
        const statusConfig = config[status.toLowerCase()] || { color: "bg-gray-500/20", label: status };
        return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
    };

    const availableBudget = balance - lockedBudget;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <Link to="/influencer">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-display font-bold mb-1.5">Influencer Wallet</h1>
                    <p className="text-sm text-muted-foreground">Manage your campaign budget and view transaction history</p>
                </div>

                {/* Info Alert */}
                <Alert className="mb-6 border-blue-500/30 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm">
                        <strong>Budget System:</strong> Your wallet holds campaign funds (escrow). Top up to fund campaigns.
                        Budget is locked when campaigns are approved. Unused budget is refunded when campaigns close.
                    </AlertDescription>
                </Alert>

                {/* Balance Overview */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <Card variant="glass" className="border-emerald-500/30">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Wallet className="w-5 h-5 text-emerald-400" />
                                </div>
                                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Available</Badge>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">${availableBudget.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Available Budget</p>
                        </CardContent>
                    </Card>

                    <Card variant="glass" className="border-blue-500/30">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Lock className="w-5 h-5 text-blue-400" />
                                </div>
                                <Badge variant="outline" className="text-blue-400 border-blue-500/30">Locked</Badge>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">${lockedBudget.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">In Active Campaigns</p>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-secondary rounded-lg">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <Badge variant="outline">Total</Badge>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">${balance.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Total Balance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card variant="glass" className="mb-6">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">Need more campaign budget?</h3>
                                <p className="text-sm text-muted-foreground">Top up your wallet to fund more campaigns</p>
                            </div>
                            <Button onClick={() => setShowTopUpModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Top Up Budget
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-base font-display">Transaction History</CardTitle>
                        <CardDescription className="text-xs">View all budget transactions and campaign locks</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-2 bg-secondary rounded-lg">
                                                {getTransactionIcon(tx.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{tx.description}</p>
                                                {tx.campaignTitle && (
                                                    <p className="text-xs text-muted-foreground">Campaign: {tx.campaignTitle}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(tx.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <p className={`text-sm font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                    {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                                </p>
                                                {getStatusBadge(tx.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top-Up Modal */}
            <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Top Up Budget</DialogTitle>
                        <DialogDescription>
                            Add funds to your campaign budget. Funds are held in escrow and locked when campaigns are approved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="1"
                                placeholder="Enter amount (e.g., 100.00)"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                            />
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                            <p className="text-muted-foreground mb-2">Quick amounts:</p>
                            <div className="flex gap-2 flex-wrap">
                                {[50, 100, 250, 500, 1000].map((amount) => (
                                    <Button
                                        key={amount}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTopUpAmount(amount.toString())}
                                    >
                                        ${amount}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                In production, this would integrate with a payment gateway (Stripe, PayPal, etc.).
                                For demo purposes, funds are added instantly.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTopUpModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleTopUp} disabled={processing || !topUpAmount}>
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add ${topUpAmount || '0.00'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default InfluencerWallet;
