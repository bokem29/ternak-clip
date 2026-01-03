import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SubmitProof = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    analyticsScreenshot: '',
    videoPageScreenshot: '',
    screenRecording: '',
    totalViews: '',
    proofDate: new Date().toISOString().split('T')[0],
    proofTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
  });

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      setFetching(true);
      const data = await api.get('/submissions/my');
      const sub = data.submissions.find((s: any) => s.id === id);
      if (!sub) {
        toast({
          title: 'Submission not found',
          description: 'The submission you are looking for does not exist',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }
      setSubmission(sub);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load submission',
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
      if (!formData.analyticsScreenshot || !formData.videoPageScreenshot || !formData.totalViews) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      await api.post(`/submissions/${id}/proof`, {
        analyticsScreenshot: formData.analyticsScreenshot,
        videoPageScreenshot: formData.videoPageScreenshot,
        screenRecording: formData.screenRecording || null,
        totalViews: parseInt(formData.totalViews),
        proofDate: formData.proofDate,
        proofTime: formData.proofTime,
      });

      toast({
        title: 'Proof Submitted!',
        description: 'Your proof has been submitted and is now waiting for review.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit proof',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE': return 'YouTube';
      case 'TIKTOK': return 'TikTok';
      case 'INSTAGRAM': return 'Instagram';
      case 'FACEBOOK': return 'Facebook';
      default: return platform;
    }
  };

  const canSubmitProof = () => {
    if (!submission) return false;
    if (submission.platform === 'YOUTUBE') return false;
    if (submission.status !== 'SUBMITTED' && submission.status !== 'WAITING_VIEW_CHECK') return false;
    if (!submission.lockUntil) return true;
    return new Date(submission.lockUntil) <= new Date();
  };

  const getHoursRemaining = () => {
    if (!submission?.lockUntil) return 0;
    const now = new Date();
    const lockUntil = new Date(submission.lockUntil);
    if (lockUntil <= now) return 0;
    return Math.ceil((lockUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
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

  if (!submission) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Submission not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const hoursRemaining = getHoursRemaining();
  const canSubmit = canSubmitProof();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-display font-bold mb-1.5">Submit Proof</h1>
          <p className="text-sm text-muted-foreground">
            Upload screenshots to verify your video views
          </p>
        </div>

        {/* Submission Info */}
        <Card variant="glass" className="mb-4">
          <CardHeader>
            <CardTitle className="text-base font-display">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{submission.title || 'Untitled Clip'}</p>
                <a 
                  href={submission.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {submission.videoUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <Badge variant="outline">{getPlatformName(submission.platform)}</Badge>
            </div>
            {submission.uploadDate && (
              <div className="text-xs text-muted-foreground">
                Upload Date: {new Date(submission.uploadDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lock Status */}
        {!canSubmit && hoursRemaining > 0 && (
          <Card variant="glass" className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Waiting Period</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait {hoursRemaining} more hour{hoursRemaining !== 1 ? 's' : ''} before submitting proof.
                    This helps prevent abuse and allows views to stabilize.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof Submission Form */}
        {canSubmit ? (
          <form onSubmit={handleSubmit}>
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base font-display">Upload Proof</CardTitle>
                <CardDescription className="text-xs">
                  Upload screenshots showing your video views and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Instructions:</strong> Upload screenshots to Imgur or similar image hosting service, then paste the URLs here.
                    <br />
                    • Analytics screenshot: Must show view count clearly
                    <br />
                    • Video page screenshot: Must show video URL and your username
                  </AlertDescription>
                </Alert>

                <div className="space-y-1.5">
                  <Label htmlFor="analyticsScreenshot">
                    Analytics Screenshot URL *
                    <span className="text-xs text-muted-foreground ml-2">(Shows view count)</span>
                  </Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="analyticsScreenshot"
                      type="url"
                      placeholder="https://imgur.com/..."
                      value={formData.analyticsScreenshot}
                      onChange={(e) => setFormData({ ...formData, analyticsScreenshot: e.target.value })}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="videoPageScreenshot">
                    Video Page Screenshot URL *
                    <span className="text-xs text-muted-foreground ml-2">(Shows URL & username)</span>
                  </Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="videoPageScreenshot"
                      type="url"
                      placeholder="https://imgur.com/..."
                      value={formData.videoPageScreenshot}
                      onChange={(e) => setFormData({ ...formData, videoPageScreenshot: e.target.value })}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="screenRecording">
                    Screen Recording URL
                    <span className="text-xs text-muted-foreground ml-2">(Optional, 5-15 seconds)</span>
                  </Label>
                  <div className="relative">
                    <VideoIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="screenRecording"
                      type="url"
                      placeholder="https://..."
                      value={formData.screenRecording}
                      onChange={(e) => setFormData({ ...formData, screenRecording: e.target.value })}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="totalViews">Total Views *</Label>
                    <Input
                      id="totalViews"
                      type="number"
                      min="0"
                      placeholder="10000"
                      value={formData.totalViews}
                      onChange={(e) => setFormData({ ...formData, totalViews: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proofDate">Proof Date *</Label>
                    <Input
                      id="proofDate"
                      type="date"
                      value={formData.proofDate}
                      onChange={(e) => setFormData({ ...formData, proofDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proofTime">Proof Time</Label>
                  <Input
                    id="proofTime"
                    type="time"
                    value={formData.proofTime}
                    onChange={(e) => setFormData({ ...formData, proofTime: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Proof
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        ) : submission.status === 'WAITING_REVIEW' ? (
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Proof Submitted</h3>
                  <p className="text-sm text-muted-foreground">
                    Your proof has been submitted and is waiting for review. You will be notified once it's reviewed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default SubmitProof;


