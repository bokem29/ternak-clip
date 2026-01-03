import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Smartphone,
  ExternalLink,
  AlertCircle,
  User,
  TrendingUp,
  Shield,
  Flag,
  BarChart3
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const WithdrawManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  useEffect(() => {
    loadWithdraws();
  }, [filter]);

  const loadWithdraws = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      // [ENGINE_INTEGRATION_POINT] - Admin Withdrawals API
      // Uses new withdrawal system with trust score analysis
      const data = await api.get(`/admin/withdrawals${params}`);
      setWithdrawRequests(data.withdrawals || data.withdrawRequests || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load withdrawal requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) {
      return;
    }

    try {
      setProcessing(true);
      // [ENGINE_INTEGRATION_POINT] - Approve Withdrawal API
      await api.patch(`/admin/withdrawals/${id}/approve`, {});
      toast({
        title: 'Withdrawal Approved',
        description: 'The withdrawal has been approved and funds have been deducted.',
      });
      await loadWithdraws();
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to reject this withdrawal request?')) {
      return;
    }

    try {
      setProcessing(true);
      // [ENGINE_INTEGRATION_POINT] - Reject Withdrawal API
      await api.patch(`/admin/withdrawals/${id}/reject`, { reason: rejectionReason });
      toast({
        title: 'Withdrawal Rejected',
        description: 'The withdrawal has been rejected and funds have been returned.',
      });
      setRejectionReason('');
      await loadWithdraws();
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'default' as const, label: 'Pending', icon: Clock },
      APPROVED: { variant: 'default' as const, label: 'Approved', icon: CheckCircle2 },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected', icon: XCircle },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status, icon: null };
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
        return null;
    }
  };

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
    <AdminLayout>
      <AdminHeader title="Withdrawal Management" subtitle="Review and approve withdrawal requests" />
      <div className="flex-1 overflow-y-auto p-6 pb-20">

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {withdrawRequests.length === 0 ? (
              <Card className="glass-panel-v2 rounded-xl">
                <CardContent className="p-6 text-center text-sm text-zinc-400">
                  No withdrawal requests found
                </CardContent>
              </Card>
            ) : (
              withdrawRequests.map((request) => (
                <Card
                  key={request.id}
                  className={`glass-panel-v2 rounded-xl cursor-pointer transition-all hover:bg-white/[0.02] ${selectedRequest?.id === request.id ? 'border-white/20 bg-white/[0.02]' : ''
                    }`}
                  onClick={() => navigate(`/admin/withdrawals/${request.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1 text-white">{request.user?.name || 'Unknown User'}</h3>
                        <p className="text-xs text-zinc-400">{request.user?.email}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-xs text-zinc-400 mt-2">
                      <p className="font-semibold text-white">{formatCurrency(request.amount)}</p>
                      <p className="mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <Card className="glass-panel-v2 rounded-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-display mb-2">
                      Withdrawal Request
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedRequest.status)}
                      <Badge variant="outline">{formatCurrency(selectedRequest.amount)}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">User Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-sm text-zinc-300"><span className="text-zinc-500">Name:</span> {selectedRequest.user?.name}</p>
                    <p className="text-sm text-zinc-300"><span className="text-zinc-500">Email:</span> {selectedRequest.user?.email}</p>
                    <p className="text-sm text-zinc-300"><span className="text-zinc-500">Status:</span> {selectedRequest.user?.status}</p>
                    {selectedRequest.userStats && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-xs text-zinc-400">Total Submissions: {selectedRequest.userStats.totalSubmissions}</p>
                        <p className="text-xs text-zinc-400">Approved: {selectedRequest.userStats.approvedSubmissions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Payment Method</h3>
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      {getPaymentMethodIcon(selectedRequest.paymentMethod?.type)}
                      <span className="font-medium">{selectedRequest.paymentMethod?.label || 'Direct Withdrawal'}</span>
                    </div>
                    {selectedRequest.paymentMethod ? (
                      selectedRequest.paymentMethod.type === 'BANK' ? (
                        <div className="text-xs text-zinc-400 space-y-1">
                          <p>Bank: {selectedRequest.paymentMethod.bankName}</p>
                          <p>Account: {selectedRequest.paymentMethod.accountNumber}</p>
                          <p>Name: {selectedRequest.paymentMethod.accountName}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400 space-y-1">
                          <p>Type: {selectedRequest.paymentMethod.ewalletType}</p>
                          <p>Number: {selectedRequest.paymentMethod.ewalletNumber}</p>
                          <p>Name: {selectedRequest.paymentMethod.ewalletName}</p>
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-zinc-400">
                        <p>No payment method details available for this request.</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* [ENGINE_INTEGRATION_POINT] - Trust Score Analysis Section */}
                {/* This section displays trust score data from the engine */}
                {selectedRequest.trustScoreAtRequest !== undefined && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Trust Score Analysis
                      </h3>
                      <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Trust Score at Request:</span>
                          <Badge 
                            variant={
                              selectedRequest.trustScoreAtRequest >= 86 ? 'default' :
                              selectedRequest.trustScoreAtRequest >= 61 ? 'default' :
                              selectedRequest.trustScoreAtRequest >= 31 ? 'secondary' : 'destructive'
                            }
                          >
                            {selectedRequest.trustScoreAtRequest}
                          </Badge>
                        </div>
                        
                        {/* Submission History */}
                        {selectedRequest.submissionHistory && selectedRequest.submissionHistory.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs font-medium mb-2">Submission History:</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Total: {selectedRequest.submissionHistory.length}</p>
                              <p>Approved: {selectedRequest.submissionHistory.filter((s: any) => s.status === 'APPROVED' || s.status === 'PAID').length}</p>
                              <p>Rejected: {selectedRequest.submissionHistory.filter((s: any) => s.status === 'REJECTED').length}</p>
                            </div>
                          </div>
                        )}

                        {/* Flag History */}
                        {selectedRequest.flagHistory && selectedRequest.flagHistory.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs font-medium mb-2 flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              Flag History:
                            </p>
                            <div className="space-y-1">
                              {selectedRequest.flagHistory.map((flag: any, idx: number) => (
                                <div key={idx} className="text-xs p-2 rounded bg-destructive/10 border border-destructive/20">
                                  <span className="font-medium">{flag.type}:</span> {flag.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Withdrawal Pattern */}
                        {selectedRequest.withdrawalPattern && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs font-medium mb-2 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              Withdrawal Pattern:
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Total Withdrawals: {selectedRequest.withdrawalPattern.totalWithdrawals}</p>
                              <p>Total Amount: {formatCurrency(selectedRequest.withdrawalPattern.totalAmount)}</p>
                              <p>Frequency: {selectedRequest.withdrawalPattern.frequency > 0 ? `${selectedRequest.withdrawalPattern.frequency.toFixed(1)} days` : 'First withdrawal'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Request Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Request Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Amount:</span>
                      <span className="font-semibold text-white">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Requested:</span>
                      <span className="text-zinc-300">{new Date(selectedRequest.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedRequest.notes && (
                      <div>
                        <span className="text-zinc-400">Notes:</span>
                        <p className="mt-1 text-zinc-300">{selectedRequest.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason if rejected */}
                {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {/* Actions */}
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                        <Textarea
                          id="rejectionReason"
                          placeholder="Provide a clear reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          onClick={() => handleApprove(selectedRequest.id)}
                          disabled={processing}
                          className="flex-1"
                        >
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
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedRequest.id)}
                          disabled={processing || !rejectionReason.trim()}
                          className="flex-1"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-panel-v2 rounded-xl">
              <CardContent className="p-12 text-center text-zinc-400">
                Select a withdrawal request to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default WithdrawManagement;


