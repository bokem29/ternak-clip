import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Basic Information
    influencerName: '',
    influencerType: 'PERSONAL' as 'PERSONAL' | 'BRAND' | 'AGENCY',
    // Platform Information
    platformsOwned: [] as string[],
    primaryPlatform: '',
    channelUrl: '',
    followerCount: '',
    // Intent & Credibility
    reasonForCampaigns: '',
    estimatedBudget: '',
    // Contact Information
    contactPersonName: '',
    preferredContactMethod: 'EMAIL' as 'WHATSAPP' | 'EMAIL' | 'TELEGRAM',
    contactDetail: '',
    // Optional Proof
    analyticsScreenshot: '',
    mediaKitUrl: '',
    // Agreement
    ownsChannel: false,
    agreesToTerms: false,
    acceptsReview: false,
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const data = await api.get('/influencer/status');
      setCurrentStatus(data);
      
      if (data.status === 'VERIFIED') {
        navigate('/influencer');
      } else if (data.status === 'PENDING_REVIEW') {
        // Show pending status, don't allow editing
      } else if (data.status === 'REJECTED') {
        // Show rejection reason, allow reapply
      }
    } catch (error: any) {
      // No profile yet, allow form submission
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setCurrentStatus({ status: 'NOT_APPLIED' });
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => {
      const platforms = prev.platformsOwned.includes(platform)
        ? prev.platformsOwned.filter(p => p !== platform)
        : [...prev.platformsOwned, platform];
      return { ...prev, platformsOwned: platforms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.influencerName || !formData.channelUrl || !formData.reasonForCampaigns ||
          !formData.contactPersonName || !formData.contactDetail) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (formData.platformsOwned.length === 0) {
        toast({
          title: 'Platform Required',
          description: 'Please select at least one platform',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.primaryPlatform) {
        toast({
          title: 'Primary Platform Required',
          description: 'Please select your primary platform',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.ownsChannel || !formData.agreesToTerms || !formData.acceptsReview) {
        toast({
          title: 'Agreement Required',
          description: 'Please accept all required agreements',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      await api.post('/influencer/apply', {
        influencerName: formData.influencerName,
        influencerType: formData.influencerType,
        platformsOwned: formData.platformsOwned,
        primaryPlatform: formData.primaryPlatform,
        channelUrl: formData.channelUrl,
        followerCount: formData.followerCount ? parseInt(formData.followerCount) : null,
        reasonForCampaigns: formData.reasonForCampaigns,
        estimatedBudget: formData.estimatedBudget,
        contactPersonName: formData.contactPersonName,
        preferredContactMethod: formData.preferredContactMethod,
        contactDetail: formData.contactDetail,
        analyticsScreenshot: formData.analyticsScreenshot || null,
        mediaKitUrl: formData.mediaKitUrl || null,
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your influencer application has been submitted for review. We will notify you once it\'s reviewed.',
      });

      await checkStatus();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Show status if pending or rejected
  if (currentStatus?.status === 'PENDING_REVIEW') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display">Application Under Review</CardTitle>
                  <CardDescription>Your influencer application is being reviewed by our team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We typically review applications within 24-48 hours. You will receive a notification once your application has been reviewed.
                </AlertDescription>
              </Alert>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{currentStatus.submittedAt ? new Date(currentStatus.submittedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <Button variant="outline" onClick={() => navigate('/influencer')} className="w-full mt-4">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (currentStatus?.status === 'REJECTED') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display">Application Rejected</CardTitle>
                  <CardDescription>Your influencer application was not approved</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reason:</strong> {currentStatus.rejectionReason || 'No reason provided'}
                </AlertDescription>
              </Alert>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rejected:</span>
                  <span>{currentStatus.rejectedAt ? new Date(currentStatus.rejectedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setCurrentStatus({ status: 'NOT_APPLIED' });
                    setFormData({
                      ...formData,
                      influencerName: '',
                      channelUrl: '',
                      reasonForCampaigns: '',
                    });
                  }} 
                  className="w-full mt-4"
                >
                  Reapply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-display font-bold mb-1.5">Become an Influencer</h1>
          <p className="text-sm text-muted-foreground">Complete your influencer profile to start creating campaigns</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">A. Basic Information</CardTitle>
              <CardDescription className="text-xs">Tell us about yourself or your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="influencerName">Influencer / Brand Name *</Label>
                <Input
                  id="influencerName"
                  placeholder="Your Name or Brand"
                  value={formData.influencerName}
                  onChange={(e) => setFormData({ ...formData, influencerName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="influencerType">Influencer Type *</Label>
                <Select
                  value={formData.influencerType}
                  onValueChange={(value: 'PERSONAL' | 'BRAND' | 'AGENCY') => 
                    setFormData({ ...formData, influencerType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="BRAND">Brand</SelectItem>
                    <SelectItem value="AGENCY">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Platform Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">B. Platform Information</CardTitle>
              <CardDescription className="text-xs">Your social media platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Platforms Owned *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['tiktok', 'instagram', 'youtube', 'facebook'].map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={formData.platformsOwned.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label htmlFor={platform} className="font-normal capitalize cursor-pointer">
                        {platform === 'youtube' ? 'YouTube' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="primaryPlatform">Primary Platform *</Label>
                <Select
                  value={formData.primaryPlatform}
                  onValueChange={(value) => setFormData({ ...formData, primaryPlatform: value })}
                  disabled={formData.platformsOwned.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.platformsOwned.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform === 'youtube' ? 'YouTube' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="channelUrl">Channel / Account URL *</Label>
                <Input
                  id="channelUrl"
                  type="url"
                  placeholder="https://tiktok.com/@yourhandle"
                  value={formData.channelUrl}
                  onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="followerCount">Self-reported Follower Count</Label>
                <Input
                  id="followerCount"
                  type="number"
                  min="0"
                  placeholder="100000"
                  value={formData.followerCount}
                  onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Intent & Credibility */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">C. Intent & Credibility</CardTitle>
              <CardDescription className="text-xs">Why do you want to create campaigns?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reasonForCampaigns">Reason for Creating Campaigns *</Label>
                <Textarea
                  id="reasonForCampaigns"
                  placeholder="Explain why you want to create campaigns and what you hope to achieve..."
                  value={formData.reasonForCampaigns}
                  onChange={(e) => setFormData({ ...formData, reasonForCampaigns: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimatedBudget">Estimated Starting Budget</Label>
                <Select
                  value={formData.estimatedBudget}
                  onValueChange={(value) => setFormData({ ...formData, estimatedBudget: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-500">$0 - $500</SelectItem>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10000+">$10,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">D. Contact Information</CardTitle>
              <CardDescription className="text-xs">How can we reach you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                <Input
                  id="contactPersonName"
                  placeholder="John Doe"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method *</Label>
                  <Select
                    value={formData.preferredContactMethod}
                    onValueChange={(value: 'WHATSAPP' | 'EMAIL' | 'TELEGRAM') => 
                      setFormData({ ...formData, preferredContactMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="TELEGRAM">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactDetail">Contact Detail *</Label>
                  <Input
                    id="contactDetail"
                    placeholder={formData.preferredContactMethod === 'EMAIL' ? 'email@example.com' : '+1234567890'}
                    value={formData.contactDetail}
                    onChange={(e) => setFormData({ ...formData, contactDetail: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Proof */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">E. Optional Proof</CardTitle>
              <CardDescription className="text-xs">Help us verify your account faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="analyticsScreenshot">Channel Analytics Screenshot URL</Label>
                <Input
                  id="analyticsScreenshot"
                  type="url"
                  placeholder="https://imgur.com/..."
                  value={formData.analyticsScreenshot}
                  onChange={(e) => setFormData({ ...formData, analyticsScreenshot: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot to Imgur or similar and paste the URL here
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mediaKitUrl">Media Kit or Website URL</Label>
                <Input
                  id="mediaKitUrl"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.mediaKitUrl}
                  onChange={(e) => setFormData({ ...formData, mediaKitUrl: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Agreement */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">F. Agreement</CardTitle>
              <CardDescription className="text-xs">Please read and accept the following</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ownsChannel"
                  checked={formData.ownsChannel}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, ownsChannel: checked === true })
                  }
                />
                <Label htmlFor="ownsChannel" className="font-normal cursor-pointer">
                  I own or manage this channel *
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreesToTerms"
                  checked={formData.agreesToTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, agreesToTerms: checked === true })
                  }
                />
                <Label htmlFor="agreesToTerms" className="font-normal cursor-pointer">
                  I agree to platform terms and conditions *
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptsReview"
                  checked={formData.acceptsReview}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, acceptsReview: checked === true })
                  }
                />
                <Label htmlFor="acceptsReview" className="font-normal cursor-pointer">
                  I accept that my application will be reviewed by administrators *
                </Label>
              </div>
            </CardContent>
          </Card>

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
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Onboarding;


