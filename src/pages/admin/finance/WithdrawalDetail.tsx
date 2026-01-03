import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building2,
  Smartphone,
  FileText,
  Shield,
  Flag,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar,
  CreditCard,
  Wallet,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  History,
  Receipt
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface StatusHistoryEntry {
  id: string;
  status: string;
  timestamp: string;
  actor: 'SYSTEM' | 'ADMIN';
  actorId: string | null;
  description: string;
  metadata?: any;
}

interface AdminLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  actionType: 'APPROVE' | 'REJECT' | 'FLAG' | 'COMMENT';
  reason: string | null;
  evidenceReference: string | null;
  metadata?: any;
}

interface ClipperSnapshot {
  id: string;
  username: string;
  email: string;
  accountAge: number;
  trustScore: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface WithdrawalDetailData {
  withdrawal: {
    id: string;
    userId: string;
    amount: number;
    paymentMethod: any;
    status: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
    paidAt?: string;
    invoiceId?: string;
    trustScoreAtRequest: number;
    ipAddress?: string;
    userAgent?: string;
  };
  clipperSnapshot: ClipperSnapshot;
  statusHistory: StatusHistoryEntry[];
  adminLogs: AdminLogEntry[];
  balanceSnapshot: {
    before: number | null;
    after: number | null;
  };
  ledgerEntries: any[];
  submissionStats: {
    total: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  campaignStats: {
    totalJoined: number;
  };
  trustScoreHistory: any[];
  withdrawalVelocity: {
    totalWithdrawals: number;
    totalAmount: number;
    averageAmount: number;
    frequency: number;
  };
  invoice: {
    id: string;
    number: string;
    generatedAt: string;
    downloadUrl: string;
  } | null;
  systemNotes: any[];
  estimatedPayoutTime: string | null;
}

const WithdrawalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<WithdrawalDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [flagEvidence, setFlagEvidence] = useState("");

  useEffect(() => {
    if (id) {
      loadWithdrawal();
    }
  }, [id]);

  const loadWithdrawal = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/withdrawals/${id}`);
      setData(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load withdrawal details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this withdrawal? Funds will be deducted from user balance and payout will be processed.")) {
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/admin/withdrawals/${id}/approve`, {});
      toast({
        title: "Success",
        description: "Withdrawal approved and payout processing initiated",
      });
      await loadWithdrawal();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/admin/withdrawals/${id}/reject`, { reason: rejectReason });
      toast({
        title: "Success",
        description: "Withdrawal rejected",
      });
      setShowRejectDialog(false);
      setRejectReason("");
      await loadWithdrawal();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast({
        title: "Flag Reason Required",
        description: "Please provide a reason for flagging",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/admin/withdrawals/${id}/flag`, {
        reason: flagReason,
        evidenceReference: flagEvidence || null
      });
      toast({
        title: "Success",
        description: "Withdrawal flagged for investigation",
      });
      setShowFlagDialog(false);
      setFlagReason("");
      setFlagEvidence("");
      await loadWithdrawal();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to flag withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      REQUESTED: { variant: 'default', label: 'Requested', icon: Clock },
      PENDING_REVIEW: { variant: 'default', label: 'Pending Review', icon: Clock },
      UNDER_INVESTIGATION: { variant: 'destructive', label: 'Under Investigation', icon: Flag },
      APPROVED: { variant: 'default', label: 'Approved', icon: CheckCircle2 },
      REJECTED: { variant: 'destructive', label: 'Rejected', icon: XCircle },
      PAYOUT_PROCESSING: { variant: 'default', label: 'Payout Processing', icon: Clock },
      PAID: { variant: 'default', label: 'Paid', icon: CheckCircle2 },
      FAILED: { variant: 'destructive', label: 'Failed', icon: XCircle },
    };
    const config = configs[status] || { variant: 'outline', label: status, icon: null };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskTierColor = (tier: string) => {
    switch (tier) {
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'HIGH':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <AdminHeader />
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Withdrawal not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { withdrawal, clipperSnapshot, statusHistory, adminLogs, balanceSnapshot, ledgerEntries, submissionStats, campaignStats, withdrawalVelocity, invoice, systemNotes, estimatedPayoutTime } = data;
  const isAdmin = user?.role === 'admin';
  const canTakeAction = isAdmin && (withdrawal.status === 'PENDING' || withdrawal.status === 'PENDING_REVIEW' || withdrawal.status === 'UNDER_INVESTIGATION');

  const Layout = isAdmin ? AdminLayout : DashboardLayout;
  const Header = isAdmin ? AdminHeader : null;

  return (
    <Layout>
      {Header && <Header title="Withdrawal Detail" subtitle={`ID: ${id}`} />}
      <div className="flex-1 overflow-y-auto p-6 pb-20">
      <div className="space-y-6">
        {/* Back Button - Only for Admin */}
        {isAdmin && (
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/admin/finance/withdrawals")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Withdrawals
            </Button>
            {getStatusBadge(withdrawal.status)}
          </div>
        )}
        {!isAdmin && (
          <div className="flex items-center justify-end">
            {getStatusBadge(withdrawal.status)}
          </div>
        )}

        {/* SECTION 1: WITHDRAWAL SUMMARY */}
        <Card className="glass-panel-v2 rounded-xl">
          <CardHeader>
            <CardTitle>Withdrawal Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Requested Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(withdrawal.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Request Date</p>
                <p className="text-sm">{formatDate(withdrawal.requestedAt)}</p>
              </div>
              {estimatedPayoutTime && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Payout</p>
                  <p className="text-sm">{formatDate(estimatedPayoutTime)}</p>
                </div>
              )}
              {withdrawal.paidAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid Date</p>
                  <p className="text-sm">{formatDate(withdrawal.paidAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: STATUS TIMELINE */}
        <Card className="glass-panel-v2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Status Timeline
            </CardTitle>
            <CardDescription>Chronological history of status changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.map((entry, idx) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${idx === statusHistory.length - 1 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    {idx < statusHistory.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(entry.status)}
                        <span className="text-xs text-muted-foreground">
                          {entry.actor === 'SYSTEM' ? 'System' : 'Admin'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* SECTION 3: CLIPPER PROFILE SNAPSHOT */}
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Clipper Profile Snapshot
              </CardTitle>
              <CardDescription>Snapshot at request time (immutable)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <span className="text-sm font-medium">{clipperSnapshot.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm">{clipperSnapshot.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Account Age:</span>
                  <span className="text-sm">{clipperSnapshot.accountAge} days</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trust Score:</span>
                  <Badge variant="outline">{clipperSnapshot.trustScore}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Tier:</span>
                  <Badge className={getRiskTierColor(clipperSnapshot.riskTier)}>
                    {clipperSnapshot.riskTier}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Summary Stats:</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Campaigns Joined: {campaignStats.totalJoined}</p>
                    <p>Submissions: {submissionStats.total} (Approved: {submissionStats.approved}, Rejected: {submissionStats.rejected})</p>
                    <p>Flags: {submissionStats.flagged}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: WITHDRAWAL AMOUNT BREAKDOWN */}
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Amount Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Requested Amount:</span>
                  <span className="text-sm font-semibold">{formatCurrency(withdrawal.amount)}</span>
                </div>
                {balanceSnapshot.before !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Web Balance Before:</span>
                    <span className="text-sm">{formatCurrency(balanceSnapshot.before)}</span>
                  </div>
                )}
                {balanceSnapshot.after !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Web Balance After:</span>
                    <span className="text-sm">{formatCurrency(balanceSnapshot.after)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fees:</span>
                  <span className="text-sm">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span className="text-sm">Net Payout Amount:</span>
                  <span className="text-sm">{formatCurrency(withdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Currency:</span>
                  <span className="text-xs">IDR (Indonesian Rupiah)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 5: PAYMENT METHOD DETAILS */}
        <Card className="glass-panel-v2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method Details
            </CardTitle>
            <CardDescription>Payout destination (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawal.paymentMethod ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(withdrawal.paymentMethod.type)}
                  <span className="font-medium">{withdrawal.paymentMethod.label || withdrawal.paymentMethod.type}</span>
                </div>
                {withdrawal.paymentMethod.type === 'BANK' && (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Bank:</span> {withdrawal.paymentMethod.bankName}</p>
                    <p><span className="text-muted-foreground">Account Number:</span> {withdrawal.paymentMethod.accountNumber || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Account Name:</span> {withdrawal.paymentMethod.accountName || 'N/A'}</p>
                  </div>
                )}
                {withdrawal.paymentMethod.type === 'EWALLET' && (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Type:</span> {withdrawal.paymentMethod.ewalletType}</p>
                    <p><span className="text-muted-foreground">Number:</span> {withdrawal.paymentMethod.ewalletNumber || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Name:</span> {withdrawal.paymentMethod.ewalletName || 'N/A'}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment method details available</p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 6: TRUST & RISK ANALYSIS (Admin Only) */}
        {isAdmin && (
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Trust & Risk Analysis
              </CardTitle>
              <CardDescription>Decision support data (read-only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trust Score at Request:</p>
                  <Badge variant="outline" className="text-lg">{withdrawal.trustScoreAtRequest}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Risk Tier:</p>
                  <Badge className={getRiskTierColor(clipperSnapshot.riskTier)}>
                    {clipperSnapshot.riskTier}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Withdrawal Velocity:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Withdrawals:</span> {withdrawalVelocity.totalWithdrawals}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span> {formatCurrency(withdrawalVelocity.totalAmount)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Amount:</span> {formatCurrency(withdrawalVelocity.averageAmount)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span> {withdrawalVelocity.frequency > 0 ? `${withdrawalVelocity.frequency.toFixed(1)} days` : 'First withdrawal'}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Submission Metrics:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span> {submissionStats.total}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approved:</span> {submissionStats.approved}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rejected:</span> {submissionStats.rejected}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Flagged:</span> {submissionStats.flagged}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 7: ADMIN REVIEW & ACTION LOG */}
        {isAdmin && (
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Admin Review & Action Log
              </CardTitle>
              <CardDescription>Immutable audit trail of admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              {adminLogs.length > 0 ? (
                <div className="space-y-3">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.actionType === 'APPROVE' ? 'default' : log.actionType === 'REJECT' ? 'destructive' : 'secondary'}>
                            {log.actionType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{log.adminName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                      </div>
                      {log.reason && (
                        <p className="text-sm mt-1"><span className="text-muted-foreground">Reason:</span> {log.reason}</p>
                      )}
                      {log.evidenceReference && (
                        <p className="text-xs text-muted-foreground mt-1">Evidence: {log.evidenceReference}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No admin actions yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION 8: TRANSACTION & LEDGER RECORDS */}
        <Card className="glass-panel-v2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transaction & Ledger Records
            </CardTitle>
            <CardDescription>Immutable financial records</CardDescription>
          </CardHeader>
          <CardContent>
            {ledgerEntries.length > 0 ? (
              <div className="space-y-2">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                    <div>
                      <p className="text-sm font-medium">Ledger ID: {entry.id}</p>
                      <p className="text-xs text-muted-foreground">{entry.type} - {entry.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${entry.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {entry.type === 'DEBIT' ? '-' : '+'}{formatCurrency(Math.abs(entry.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ledger entries yet</p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 9: INVOICE & DOCUMENTS */}
        {invoice && (
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice ID:</span>
                  <span className="text-sm font-medium">{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice Number:</span>
                  <span className="text-sm">{invoice.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Generated:</span>
                  <span className="text-sm">{formatDate(invoice.generatedAt)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(invoice.downloadUrl, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SECTION 10: SYSTEM NOTES & FLAGS */}
        {systemNotes.length > 0 && (
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                System Notes & Flags
              </CardTitle>
              <CardDescription>Read-only system-generated notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemNotes.map((note, idx) => (
                  <Alert key={idx} variant={note.type === 'FRAUD_FLAG' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium text-xs mb-1">{note.source}: {note.type}</p>
                      <p className="text-sm">{note.message}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        {canTakeAction && (
          <Card className="glass-panel-v2 rounded-xl">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={processing} className="flex-1">
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={processing} className="flex-1">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setShowFlagDialog(true)} disabled={processing} className="flex-1">
                  <Flag className="w-4 h-4 mr-2" />
                  Flag
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag for Investigation</DialogTitle>
            <DialogDescription>
              Flag this withdrawal for further investigation. The withdrawal status will be set to "Under Investigation".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flagReason">Flag Reason *</Label>
              <Textarea
                id="flagReason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Enter reason for flagging..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="flagEvidence">Evidence Reference (Optional)</Label>
              <Textarea
                id="flagEvidence"
                value={flagEvidence}
                onChange={(e) => setFlagEvidence(e.target.value)}
                placeholder="Reference to evidence or related case..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>Cancel</Button>
            <Button onClick={handleFlag} disabled={!flagReason.trim() || processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Flag for Investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
};

export default WithdrawalDetail;
