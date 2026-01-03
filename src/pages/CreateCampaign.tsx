import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    influencerName: '',
    description: '',
    allowedPlatforms: [] as string[],
    ratePer1kViews: '',
    minEligibleViews: '',
    maxPayableViewsPerClip: '',
    totalBudget: '',
    thumbnail: '',
    contentGuidelines: '',
    captionRequirements: '',
    hashtagRequirements: '',
    prohibitedContent: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoCloseOnBudgetExhausted: true,
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
      // Validation
      if (!formData.title || !formData.influencerName || !formData.ratePer1kViews ||
        !formData.minEligibleViews || !formData.totalBudget) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields',
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

      await api.post('/campaigns', {
        title: formData.title,
        influencerName: formData.influencerName,
        description: formData.description,
        thumbnail: formData.thumbnail || null,
        allowedPlatforms: formData.allowedPlatforms,
        ratePer1kViews: parseFloat(formData.ratePer1kViews),
        minEligibleViews: parseInt(formData.minEligibleViews),
        maxPayableViewsPerClip: formData.maxPayableViewsPerClip ? parseInt(formData.maxPayableViewsPerClip) : null,
        totalBudget: parseFloat(formData.totalBudget),
        contentGuidelines: formData.contentGuidelines,
        captionRequirements: formData.captionRequirements,
        hashtagRequirements: formData.hashtagRequirements,
        prohibitedContent: formData.prohibitedContent,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        autoCloseOnBudgetExhausted: formData.autoCloseOnBudgetExhausted,
        isPublic: formData.isPublic,
        allowUnlimitedClippers: formData.allowUnlimitedClippers,
        maxClippers: formData.allowUnlimitedClippers ? null : (formData.maxClippers ? parseInt(formData.maxClippers) : null),
        maxClipsPerUser: formData.maxClipsPerUser ? parseInt(formData.maxClipsPerUser) : null,
      });

      toast({
        title: 'Campaign created!',
        description: 'Your campaign has been successfully created',
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-2xl font-display font-bold mb-1.5">Create Campaign</h1>
          <p className="text-sm text-muted-foreground">Create a new campaign for clippers to participate in</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card variant="glass" className="space-y-5">
            <CardHeader>
              <CardTitle className="text-base font-display">Campaign Details</CardTitle>
              <CardDescription className="text-xs">Fill in the information for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Campaign Title *</Label>
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
                  placeholder="Influencer or Brand Name"
                  value={formData.influencerName}
                  onChange={(e) => setFormData({ ...formData, influencerName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Campaign description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="thumbnail">Campaign Thumbnail URL (Optional)</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">URL gambar untuk thumbnail campaign</p>
              </div>

              <div className="space-y-2">
                <Label>Allowed Platforms *</Label>
                <div className="flex gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ratePer1kViews">Rate per 1,000 Views (Rp) *</Label>
                  <Input
                    id="ratePer1kViews"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10.00"
                    value={formData.ratePer1kViews}
                    onChange={(e) => setFormData({ ...formData, ratePer1kViews: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minEligibleViews">Minimum Eligible Views *</Label>
                  <Input
                    id="minEligibleViews"
                    type="number"
                    min="1"
                    placeholder="10000"
                    value={formData.minEligibleViews}
                    onChange={(e) => setFormData({ ...formData, minEligibleViews: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="totalBudget">Total Campaign Budget (Rp) *</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000.00"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxPayableViewsPerClip">Max Payable Views per Clip (Optional)</Label>
                  <Input
                    id="maxPayableViewsPerClip"
                    type="number"
                    min="1"
                    placeholder="No limit"
                    value={formData.maxPayableViewsPerClip}
                    onChange={(e) => setFormData({ ...formData, maxPayableViewsPerClip: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contentGuidelines">Content Guidelines</Label>
                  <Textarea
                    id="contentGuidelines"
                    placeholder="What type of content are you looking for?"
                    value={formData.contentGuidelines}
                    onChange={(e) => setFormData({ ...formData, contentGuidelines: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="captionRequirements">Caption Requirements</Label>
                  <Textarea
                    id="captionRequirements"
                    placeholder="Any specific caption requirements?"
                    value={formData.captionRequirements}
                    onChange={(e) => setFormData({ ...formData, captionRequirements: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hashtagRequirements">Hashtag Requirements</Label>
                  <Input
                    id="hashtagRequirements"
                    placeholder="#hashtag1 #hashtag2"
                    value={formData.hashtagRequirements}
                    onChange={(e) => setFormData({ ...formData, hashtagRequirements: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prohibitedContent">Prohibited Content</Label>
                  <Textarea
                    id="prohibitedContent"
                    placeholder="What content should be avoided?"
                    value={formData.prohibitedContent}
                    onChange={(e) => setFormData({ ...formData, prohibitedContent: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublic">Public Campaign</Label>
                    <p className="text-xs text-muted-foreground">Make this campaign visible to all clippers</p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowUnlimitedClippers">Allow Unlimited Clippers</Label>
                    <p className="text-xs text-muted-foreground">No limit on number of participants</p>
                  </div>
                  <Switch
                    id="allowUnlimitedClippers"
                    checked={formData.allowUnlimitedClippers}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowUnlimitedClippers: checked })}
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCloseOnBudgetExhausted">Auto-close when Budget Exhausted</Label>
                    <p className="text-xs text-muted-foreground">Automatically close campaign when budget runs out</p>
                  </div>
                  <Switch
                    id="autoCloseOnBudgetExhausted"
                    checked={formData.autoCloseOnBudgetExhausted}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoCloseOnBudgetExhausted: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
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
                    'Create Campaign'
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

export default CreateCampaign;

