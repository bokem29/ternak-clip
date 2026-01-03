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
  Plus, 
  Loader2, 
  AlertCircle,
  Building2,
  Smartphone,
  CreditCard,
  Trash2,
  Edit,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);

  const [formData, setFormData] = useState({
    type: 'BANK',
    label: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    ewalletType: '',
    ewalletNumber: '',
    ewalletName: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setFetching(true);
      const data = await api.get('/wallet/payment-methods');
      setPaymentMethods(data.paymentMethods || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payment methods',
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
      if (formData.type === 'BANK') {
        if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
          toast({
            title: 'Missing Fields',
            description: 'Please fill in all bank details',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      } else {
        if (!formData.ewalletType || !formData.ewalletNumber || !formData.ewalletName) {
          toast({
            title: 'Missing Fields',
            description: 'Please fill in all e-wallet details',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      if (editingMethod) {
        await api.put(`/wallet/payment-methods/${editingMethod.id}`, {
          type: formData.type,
          label: formData.label || (formData.type === 'BANK' ? formData.bankName : formData.ewalletType),
          bankName: formData.type === 'BANK' ? formData.bankName : null,
          accountNumber: formData.type === 'BANK' ? formData.accountNumber : null,
          accountName: formData.type === 'BANK' ? formData.accountName : null,
          ewalletType: formData.type === 'EWALLET' ? formData.ewalletType : null,
          ewalletNumber: formData.type === 'EWALLET' ? formData.ewalletNumber : null,
          ewalletName: formData.type === 'EWALLET' ? formData.ewalletName : null,
        });
        toast({
          title: 'Payment Method Updated',
          description: 'Your payment method has been updated successfully',
        });
      } else {
        await api.post('/wallet/payment-methods', {
          type: formData.type,
          label: formData.label || (formData.type === 'BANK' ? formData.bankName : formData.ewalletType),
          bankName: formData.type === 'BANK' ? formData.bankName : null,
          accountNumber: formData.type === 'BANK' ? formData.accountNumber : null,
          accountName: formData.type === 'BANK' ? formData.accountName : null,
          ewalletType: formData.type === 'EWALLET' ? formData.ewalletType : null,
          ewalletNumber: formData.type === 'EWALLET' ? formData.ewalletNumber : null,
          ewalletName: formData.type === 'EWALLET' ? formData.ewalletName : null,
        });
        toast({
          title: 'Payment Method Added',
          description: 'Your payment method has been added successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment method',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await api.delete(`/wallet/payment-methods/${id}`);
      toast({
        title: 'Payment Method Deleted',
        description: 'Your payment method has been deleted',
      });
      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment method',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      label: method.label || '',
      bankName: method.bankName || '',
      accountNumber: method.accountNumber || '',
      accountName: method.accountName || '',
      ewalletType: method.ewalletType || '',
      ewalletNumber: method.ewalletNumber || '',
      ewalletName: method.ewalletName || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'BANK',
      label: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      ewalletType: '',
      ewalletNumber: '',
      ewalletName: '',
    });
    setEditingMethod(null);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-5 h-5" />;
      case 'EWALLET':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold mb-1.5">Metode Pembayaran</h1>
              <p className="text-sm text-muted-foreground">Manage your payment methods for withdrawals</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Metode
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingMethod ? 'Edit' : 'Add'} Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a payment method to receive withdrawals
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="type">Payment Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={!!editingMethod}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="EWALLET">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'BANK' ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          placeholder="BCA, Mandiri, BNI, etc."
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          placeholder="1234567890"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="accountName">Account Name *</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="ewalletType">E-Wallet Type *</Label>
                        <Select
                          value={formData.ewalletType}
                          onValueChange={(value) => setFormData({ ...formData, ewalletType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select e-wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OVO">OVO</SelectItem>
                            <SelectItem value="DANA">DANA</SelectItem>
                            <SelectItem value="GOPAY">GoPay</SelectItem>
                            <SelectItem value="LINK AJA">LinkAja</SelectItem>
                            <SelectItem value="SHOPEEPAY">ShopeePay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ewalletNumber">E-Wallet Number *</Label>
                        <Input
                          id="ewalletNumber"
                          placeholder="081234567890"
                          value={formData.ewalletNumber}
                          onChange={(e) => setFormData({ ...formData, ewalletNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ewalletName">Account Name *</Label>
                        <Input
                          id="ewalletName"
                          placeholder="John Doe"
                          value={formData.ewalletName}
                          onChange={(e) => setFormData({ ...formData, ewalletName: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        editingMethod ? 'Update' : 'Add'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {paymentMethods.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">No payment methods added yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card key={method.id} variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        {getPaymentMethodIcon(method.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{method.label}</p>
                          {method.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {method.type === 'BANK' ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{method.bankName}</p>
                            <p>Account: {method.accountNumber}</p>
                            <p>Name: {method.accountName}</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{method.ewalletType}</p>
                            <p>Number: {method.ewalletNumber}</p>
                            <p>Name: {method.ewalletName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(method)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentMethods;


