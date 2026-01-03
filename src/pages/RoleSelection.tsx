import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'clipper' | 'influencer' | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingRole, setPendingRole] = useState<'clipper' | 'influencer' | null>(null);

  const handleRoleClick = (role: 'clipper' | 'influencer') => {
    if (loading) return;
    setPendingRole(role);
    setShowWarning(true);
  };

  const handleConfirmRole = async () => {
    if (!pendingRole || loading) return;

    setSelectedRole(pendingRole);
    setLoading(true);
    setShowWarning(false);

    try {
      if (pendingRole === 'clipper') {
        // Set user role to clipper and redirect
        await api.post('/auth/set-role', { role: 'clipper' });
        await refreshUser();
        toast({
          title: 'Welcome, Clipper!',
          description: 'You can now start submitting clips and earning rewards.',
        });
        navigate('/dashboard');
      } else if (pendingRole === 'influencer') {
        // Set role to influencer first
        await api.post('/auth/set-role', { role: 'influencer' });
        await refreshUser();

        // Check if user already has influencer profile
        try {
          const statusData = await api.get('/influencer/status');
          if (statusData.status === 'VERIFIED') {
            // Already verified, go to influencer dashboard
            navigate('/influencer');
          } else if (statusData.status === 'PENDING_REVIEW') {
            // Pending review, show status page
            navigate('/influencer/onboarding?status=pending');
          } else {
            // Not applied yet, go to onboarding
            navigate('/influencer/onboarding');
          }
        } catch (error) {
          // No influencer profile yet, go to onboarding
          navigate('/influencer/onboarding');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set role',
        variant: 'destructive',
      });
      setSelectedRole(null);
      setPendingRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-foreground/3 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-foreground/2 blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card variant="glass" className="animate-slide-up">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display mb-2">
              Choose Your Path
            </CardTitle>
            <CardDescription>
              Select how you want to use Ternak Klip
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {/* Clipper Option */}
            <Card
              className={`cursor-pointer transition-all hover:border-foreground/30 ${selectedRole === 'clipper' ? 'border-foreground/50 bg-foreground/5' : ''
                }`}
              onClick={() => handleRoleClick('clipper')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-semibold mb-1">Become a Clipper</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create and submit clips for campaigns. Earn money based on views and performance.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                      <li>• Submit clips to active campaigns</li>
                      <li>• Earn based on views and performance</li>
                      <li>• Get paid when your clips are approved</li>
                      <li>• Start earning immediately</li>
                    </ul>
                    <Button
                      variant={selectedRole === 'clipper' ? 'default' : 'outline'}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && selectedRole === 'clipper' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          Choose Clipper
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Influencer Option */}
            <Card
              className={`cursor-pointer transition-all hover:border-foreground/30 ${selectedRole === 'influencer' ? 'border-foreground/50 bg-foreground/5' : ''
                }`}
              onClick={() => handleRoleClick('influencer')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-semibold mb-1">Become an Influencer</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create paid campaigns for clippers. Get your content created and distributed.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                      <li>• Create and fund clipping campaigns</li>
                      <li>• Set your own rates and requirements</li>
                      <li>• Get clips created for your brand</li>
                      <li>• Requires verification (quick review)</li>
                    </ul>
                    <Button
                      variant={selectedRole === 'influencer' ? 'default' : 'outline'}
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && selectedRole === 'influencer' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          Choose Influencer
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-yellow-500">Important:</strong> Your role selection is <strong>permanent and cannot be changed</strong> after confirmation. Choose carefully based on how you want to use the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Irreversible Warning Modal */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <AlertDialogTitle className="text-xl">Confirm Your Role</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-3">
                <p>
                  You are about to select <strong className="text-foreground">{pendingRole === 'clipper' ? 'Clipper' : 'Influencer'}</strong> as your role.
                </p>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-medium text-xs">
                    ⚠️ This decision is PERMANENT and IRREVERSIBLE
                  </p>
                </div>
                <p>
                  Once confirmed, you will <strong>not be able to change your role</strong> or access features from the other role. Make sure this is the right choice for you.
                </p>
                {pendingRole === 'influencer' && (
                  <p className="text-xs">
                    Note: As an influencer, you will need to complete onboarding and wait for admin approval before accessing platform features.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingRole(null);
              setSelectedRole(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRole}
              className="bg-primary hover:bg-primary/90"
            >
              I Understand, Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleSelection;


