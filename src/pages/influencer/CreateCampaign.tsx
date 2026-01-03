import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Campaign Basics
    title: '',
    influencerName: user?.name || '',
    description: '',
    allowedPlatforms: [] as string[],
    // Campaign Rules (NO FINANCIAL FIELDS)
    contentGuidelines: '',
    captionRequirements: '',
    hashtagRequirements: '',
    prohibitedContent: '',
    clipDuration: '', // NEW: e.g., "15-60 seconds"
    targetViews: '', // NEW: optional target
    // Timeline
    startDate: '',
    endDate: '',
    // Campaign Visibility
    isPublic: true,
    allowUnlimitedClippers: true,
    maxClippers: '',
    maxClipsPerUser: '',
  });

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => {
      const platforms = prev.allowedPlatforms.includes(platform)
        ? prev.allowedPlatforms.filter(p => p !== platform)
        : [...prev.allowedPlatforms, platform];
      return { ...prev, allowedPlatforms: platforms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation - NO financial fields required
      if (!formData.title || !formData.influencerName) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in campaign name and influencer name',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (formData.allowedPlatforms.length === 0) {
        toast({
          title: 'Platform Required',
          description: 'Please select at least one platform',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Use the new influencer campaign request endpoint
      await api.post('/influencer/campaigns/request', {
        title: formData.title,
        influencerName: formData.influencerName,
        description: formData.description,
        allowedPlatforms: formData.allowedPlatforms,
        contentGuidelines: formData.contentGuidelines,
        captionRequirements: formData.captionRequirements,
        hashtagRequirements: formData.hashtagRequirements,
        prohibitedContent: formData.prohibitedContent,
        clipDuration: formData.clipDuration || null,
        targetViews: formData.targetViews ? parseInt(formData.targetViews) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        isPublic: formData.isPublic,
        allowUnlimitedClippers: formData.allowUnlimitedClippers,
        maxClippers: formData.allowUnlimitedClippers
          ? null
          : (formData.maxClippers ? parseInt(formData.maxClippers) : null),
        maxClipsPerUser: formData.maxClipsPerUser
          ? parseInt(formData.maxClipsPerUser)
          : null,
      });

      toast({
        title: 'Campaign Request Created!',
        description: 'Your campaign has been saved as a draft. Submit it for admin approval when ready.',
      });

      navigate('/influencer/campaigns');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user is verified
  if (user?.role === 'influencer' && !user.verified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only verified influencers can create campaigns. Please contact support to get verified.
            </AlertDescription>
          </Alert>
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
            onClick={() => navigate('/influencer')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-display font-bold mb-1.5">Create Campaign Request</h1>
          <p className="text-sm text-muted-foreground">Request a new paid clipping campaign</p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-500/30 bg-blue-500/5">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>How it works:</strong> You create a campaign request with content details.
            Admin will review and set the payment rates (CPM, budget) before approving.
            You'll be notified when your campaign is approved and live.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Basics */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">A. Campaign Basics</CardTitle>
              <CardDescription className="text-xs">Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Campaign Name *</Label>
                <Input
                  id="title"
                  placeholder="Summer Gaming Challenge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="influencerName">Influencer Name *</Label>
                <Input
                  id="influencerName"
                  placeholder="Your Name"
                  value={formData.influencerName}
                  onChange={(e) => setFormData({ ...formData, influencerName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign goals and what you're looking for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Platforms *</Label>
                <div className="flex flex-wrap gap-4">
                  {['tiktok', 'instagram', 'facebook', 'youtube'].map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={formData.allowedPlatforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label htmlFor={platform} className="font-normal capitalize cursor-pointer">
                        {platform === 'tiktok' ? 'TikTok' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Rules */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">B. Content Rules</CardTitle>
              <CardDescription className="text-xs">Set guidelines for clippers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="clipDuration">Clip Duration</Label>
                  <Input
                    id="clipDuration"
                    placeholder="e.g., 15-60 seconds"
                    value={formData.clipDuration}
                    onChange={(e) => setFormData({ ...formData, clipDuration: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="targetViews">Target Views (Optional)</Label>
                  <Input
                    id="targetViews"
                    type="number"
                    min="0"
                    placeholder="e.g., 100000"
                    value={formData.targetViews}
                    onChange={(e) => setFormData({ ...formData, targetViews: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contentGuidelines">Content Guidelines</Label>
                <Textarea
                  id="contentGuidelines"
                  placeholder="What type of content are you looking for? What should clips include?"
                  value={formData.contentGuidelines}
                  onChange={(e) => setFormData({ ...formData, contentGuidelines: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="captionRequirements">Caption Requirements</Label>
                <Textarea
                  id="captionRequirements"
                  placeholder="Required captions, mentions, or text in clips..."
                  value={formData.captionRequirements}
                  onChange={(e) => setFormData({ ...formData, captionRequirements: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hashtagRequirements">Hashtag Requirements</Label>
                <Textarea
                  id="hashtagRequirements"
                  placeholder="Required hashtags (e.g., #yourbrand #campaign2024)"
                  value={formData.hashtagRequirements}
                  onChange={(e) => setFormData({ ...formData, hashtagRequirements: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prohibitedContent">Prohibited Content</Label>
                <Textarea
                  id="prohibitedContent"
                  placeholder="What content is not allowed? What should be avoided?"
                  value={formData.prohibitedContent}
                  onChange={(e) => setFormData({ ...formData, prohibitedContent: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">C. Timeline (Optional)</CardTitle>
              <CardDescription className="text-xs">Set preferred campaign dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Preferred Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Preferred End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Visibility */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">D. Campaign Visibility</CardTitle>
              <CardDescription className="text-xs">Control who can see and join your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Public Campaign</Label>
                  <p className="text-xs text-muted-foreground">
                    Make campaign visible in marketplace
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublic: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="space-y-0.5">
                  <Label htmlFor="unlimitedClippers">Allow Unlimited Clippers</Label>
                  <p className="text-xs text-muted-foreground">
                    No limit on number of clippers who can join
                  </p>
                </div>
                <Switch
                  id="unlimitedClippers"
                  checked={formData.allowUnlimitedClippers}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowUnlimitedClippers: checked })
                  }
                />
              </div>

              {!formData.allowUnlimitedClippers && (
                <div className="space-y-1.5">
                  <Label htmlFor="maxClippers">Maximum Clippers</Label>
                  <Input
                    id="maxClippers"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.maxClippers}
                    onChange={(e) => setFormData({ ...formData, maxClippers: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="maxClipsPerUser">Max Clips per User (Optional)</Label>
                <Input
                  id="maxClipsPerUser"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={formData.maxClipsPerUser}
                  onChange={(e) => setFormData({ ...formData, maxClipsPerUser: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Limit how many clips each clipper can submit
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/influencer')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Campaign Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateCampaign;
