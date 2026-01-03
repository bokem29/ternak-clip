import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Link as LinkIcon,
  Play,
  Eye,
  ThumbsUp,
  Clock,
  CheckCircle,
  Loader2,
  Youtube,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Timer,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Platform = 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK';

const Submit = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [platform, setPlatform] = useState<Platform>('YOUTUBE');
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [isOriginal, setIsOriginal] = useState(false);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<{
    title: string;
    thumbnail: string;
    views: number;
    likes: number;
    duration: string;
  } | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1 = URL submission, 2 = Proof submission (for non-YouTube)
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    loadCampaigns();

    // Check if campaign ID is provided in URL
    const campaignParam = searchParams.get('campaign');
    if (campaignParam) {
      setSelectedCampaignId(campaignParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Reset when platform changes
    setVideoUrl("");
    setVideoData(null);
    setStep(1);
    setSubmissionId(null);
    setSubmission(null);
  }, [platform]);

  useEffect(() => {
    // Load campaign details when campaign is selected
    if (selectedCampaignId) {
      loadCampaignDetails(selectedCampaignId);
    } else {
      setSelectedCampaign(null);
      setPlatform('YOUTUBE'); // Reset to default
    }
  }, [selectedCampaignId]);

  const loadCampaignDetails = async (campaignId: string) => {
    try {
      const data = await api.get(`/campaigns/${campaignId}`);
      setSelectedCampaign(data.campaign);

      // Auto-select first allowed platform if current platform is not allowed
      if (data.campaign.allowedPlatforms && data.campaign.allowedPlatforms.length > 0) {
        const allowedPlatforms = data.campaign.allowedPlatforms.map((p: string) => p.toUpperCase());
        if (!allowedPlatforms.includes(platform)) {
          setPlatform(allowedPlatforms[0] as Platform);
        }
      }
    } catch (error) {
      console.error('Failed to load campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive"
      });
    }
  };

  // Get allowed platforms from selected campaign
  const getAllowedPlatforms = (): Platform[] => {
    if (!selectedCampaign || !selectedCampaign.allowedPlatforms) {
      return ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK']; // Default: all platforms
    }
    return selectedCampaign.allowedPlatforms.map((p: string) => p.toUpperCase() as Platform);
  };

  const loadCampaigns = async () => {
    try {
      // [ENGINE_INTEGRATION_POINT] - Load only joined campaigns
      // Only show campaigns that user has joined (from My Campaigns)
      const data = await api.get('/clipper/campaigns');
      const allJoinedCampaigns = [
        ...(data.active || []),
        ...(data.endingSoon || []),
        ...(data.completed || []),
        ...(data.expired || [])
      ];
      setCampaigns(allJoinedCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your campaigns. Please make sure you have joined a campaign first.',
        variant: 'destructive'
      });
    }
  };

  const validateUrl = (url: string, platform: Platform): boolean => {
    const patterns: Record<Platform, RegExp[]> = {
      YOUTUBE: [/youtube\.com\/watch/, /youtu\.be\//],
      TIKTOK: [/tiktok\.com/],
      INSTAGRAM: [/instagram\.com\/reel/, /instagram\.com\/p/],
      FACEBOOK: [/facebook\.com\/watch/, /fb\.watch/],
    };
    return patterns[platform].some(pattern => pattern.test(url));
  };

  const handleFetchVideo = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(videoUrl, platform)) {
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${platform} video URL`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // For YouTube, simulate API call
    if (platform === 'YOUTUBE') {
      setTimeout(() => {
        setVideoData({
          title: "My Awesome Gaming Clip - Epic Moments Compilation",
          thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=340&fit=crop",
          views: 15420,
          likes: 892,
          duration: "2:34"
        });
        setIsLoading(false);
      }, 1500);
    } else {
      // For non-YouTube, just validate URL
      setVideoData({
        title: "Video Clip",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=340&fit=crop",
        views: 0, // Will be set from proof
        likes: 0,
        duration: "0:00"
      });
      setIsLoading(false);
    }
  };

  const handleSubmitUrl = async () => {
    if (!selectedCampaignId) {
      toast({
        title: "Campaign Required",
        description: "Please select a campaign",
        variant: "destructive"
      });
      return;
    }

    if (!videoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(videoUrl, platform)) {
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${platform} video URL`,
        variant: "destructive"
      });
      return;
    }

    if (platform !== 'YOUTUBE' && !uploadDate) {
      toast({
        title: "Upload Date Required",
        description: "Please provide the video upload date",
        variant: "destructive"
      });
      return;
    }

    if (platform !== 'YOUTUBE' && !isOriginal) {
      toast({
        title: "Agreement Required",
        description: "Please confirm the video is original",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await api.post('/submissions', {
        platform,
        videoUrl,
        campaignId: selectedCampaignId,
        title: videoData?.title || 'Untitled Clip',
        thumbnail: videoData?.thumbnail || '',
        views: platform === 'YOUTUBE' ? (videoData?.views || 0) : 0,
        likes: platform === 'YOUTUBE' ? (videoData?.likes || 0) : 0,
        duration: videoData?.duration || '0:00',
        uploadDate: platform !== 'YOUTUBE' ? uploadDate : null,
        isOriginal: platform !== 'YOUTUBE' ? isOriginal : true,
        note: note || null,
      });

      toast({
        title: "Clip Submitted!",
        description: platform === 'YOUTUBE'
          ? "Your clip has been submitted for review."
          : "Your clip URL has been submitted. You can submit proof after 48 hours.",
      });

      if (platform === 'YOUTUBE') {
        // Reset form
        setVideoUrl("");
        setVideoData(null);
        setSelectedCampaignId("");
        setNote("");
      } else {
        // Move to waiting state
        setSubmissionId(result.submission.id);
        setSubmission(result.submission);
        setStep(2);
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit clip",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (p: Platform) => {
    switch (p) {
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'TIKTOK':
        return <span className="text-xs font-bold">TT</span>;
      case 'INSTAGRAM':
        return <span className="text-xs font-bold">IG</span>;
      case 'FACEBOOK':
        return <span className="text-xs font-bold">FB</span>;
    }
  };

  const getPlatformName = (p: Platform) => {
    switch (p) {
      case 'YOUTUBE': return 'YouTube';
      case 'TIKTOK': return 'TikTok';
      case 'INSTAGRAM': return 'Instagram Reels';
      case 'FACEBOOK': return 'Facebook Reels';
    }
  };

  // Filter campaigns by allowed platforms
  const availableCampaigns = campaigns.filter(campaign => {
    if (!campaign.allowedPlatforms) return true; // Backward compatibility
    const platformLower = platform.toLowerCase();
    return campaign.allowedPlatforms.includes(platformLower);
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-display font-bold mb-1.5">Submit a Clip</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {platform === 'YOUTUBE'
              ? "Paste your YouTube video URL to submit for campaign rewards"
              : "Submit your video URL and provide proof after 48 hours"}
          </p>
        </div>

        {/* Campaign Selection - Must be first */}
        <Card variant="glass" className="mb-4">
          <CardHeader>
            <CardTitle className="text-base font-display">Select Campaign</CardTitle>
            <CardDescription className="text-xs">Choose a campaign to submit your clip to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.title} - {campaign.influencerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCampaign && (
              <div className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-xs font-medium mb-1">{selectedCampaign.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  Allowed Platforms: {selectedCampaign.allowedPlatforms?.map((p: string) => p.toUpperCase()).join(', ') || 'All'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Selection - Dynamic based on campaign */}
        {selectedCampaign && (
          <Card variant="glass" className="mb-4">
            <CardHeader>
              <CardTitle className="text-base font-display">Select Platform</CardTitle>
              <CardDescription className="text-xs">
                Choose the platform where your video is hosted (only platforms allowed by this campaign)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-2 ${getAllowedPlatforms().length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
                {getAllowedPlatforms().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all touch-target ${platform === p
                        ? 'border-foreground bg-foreground/5'
                        : 'border-border hover:border-foreground/30'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {getPlatformIcon(p)}
                      </div>
                      <span className="text-xs font-medium">{getPlatformName(p)}</span>
                    </div>
                  </button>
                ))}
              </div>
              {getAllowedPlatforms().length === 0 && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    No platforms allowed for this campaign. Please select a different campaign.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedCampaign ? (
          <Card variant="glass" className="mb-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                {campaigns.length === 0
                  ? "You haven't joined any campaigns yet. Please join a campaign from the marketplace first."
                  : "Please select a campaign first to see available platforms and submit your clip."
                }
              </p>
              {campaigns.length === 0 && (
                <Link to="/marketplace">
                  <Button variant="default">
                    Browse Marketplace
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : step === 1 ? (
          <>
            {/* URL Input Card */}
            <Card variant="glass" className="mb-4">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Label htmlFor="video-url" className="text-sm">{getPlatformName(platform)} Video URL *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {getPlatformIcon(platform)}
                      </div>
                      <Input
                        id="video-url"
                        placeholder={
                          platform === 'YOUTUBE' ? "https://youtube.com/watch?v=..." :
                            platform === 'TIKTOK' ? "https://tiktok.com/@user/video/..." :
                              platform === 'INSTAGRAM' ? "https://instagram.com/reel/..." :
                                "https://facebook.com/watch?v=..."
                        }
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="pl-10 h-10 touch-target"
                      />
                    </div>
                    <Button
                      onClick={handleFetchVideo}
                      disabled={!videoUrl || isLoading}
                      className="touch-target w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Validate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Additional fields for non-YouTube */}
                {platform !== 'YOUTUBE' && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="upload-date">Video Upload Date *</Label>
                      <Input
                        id="upload-date"
                        type="date"
                        value={uploadDate}
                        onChange={(e) => setUploadDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="h-10"
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="is-original"
                        checked={isOriginal}
                        onCheckedChange={(checked) => setIsOriginal(checked === true)}
                      />
                      <Label htmlFor="is-original" className="font-normal cursor-pointer text-sm">
                        I confirm this video is original and not re-uploaded *
                      </Label>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="note">Optional Note</Label>
                      <Input
                        id="note"
                        placeholder="Any additional information..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Preview */}
            {videoData && (
              <Card variant="glass" className="animate-slide-up overflow-hidden mb-4">
                <div className="relative">
                  <img
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <div className="px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {videoData.duration}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline">{getPlatformName(platform)}</Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="text-lg font-display font-semibold mb-4">{videoData.title}</h3>

                  {/* Stats - Only show for YouTube */}
                  {platform === 'YOUTUBE' && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                      <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded-md bg-background/50 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-xl font-display font-bold">{videoData.views.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Views</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded-md bg-background/50 flex items-center justify-center">
                          <ThumbsUp className="w-4 h-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-xl font-display font-bold">{videoData.likes.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {platform !== 'YOUTUBE' && (
                    <Alert className="mb-5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        After submitting, you'll need to wait 48 hours before uploading proof (screenshots of views).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Campaign Selection */}
                  <div className="mb-5">
                    <Label className="text-sm mb-2 block">Select Campaign</Label>
                    <div className="space-y-2">
                      {availableCampaigns.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No active campaigns available for {getPlatformName(platform)}
                        </p>
                      ) : (
                        availableCampaigns.map((campaign) => (
                          <label
                            key={campaign.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-border cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name="campaign"
                              className="accent-foreground"
                              checked={selectedCampaignId === campaign.id}
                              onChange={() => setSelectedCampaignId(campaign.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{campaign.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.ratePer1kViews ? `${formatCurrency(campaign.ratePer1kViews)}/1k views` : `${formatCurrency(campaign.reward)} reward`} • Min {campaign.minEligibleViews?.toLocaleString() || campaign.minViews?.toLocaleString() || 0} views
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  {platform === 'YOUTUBE' && (
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 flex items-start gap-2.5 mb-5">
                      <AlertCircle className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium">Eligibility Check</p>
                        <p className="text-muted-foreground mt-0.5">
                          Your video meets the minimum view requirements. Once approved, you'll receive your reward within 24-48 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button className="w-full touch-target" onClick={handleSubmitUrl} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {platform === 'YOUTUBE' ? 'Submit Clip for Review' : 'Submit URL'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!videoData && (
              <Card variant="glass" className="animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display">How it works</CardTitle>
                  <CardDescription className="text-xs">
                    {platform === 'YOUTUBE'
                      ? "Follow these steps to submit your clip"
                      : "Follow these steps to submit your clip with proof"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(platform === 'YOUTUBE' ? [
                      { step: 1, title: "Paste your YouTube URL", description: "Copy the video URL from YouTube and paste it above" },
                      { step: 2, title: "We fetch your stats", description: "We automatically retrieve views, likes, and other metrics" },
                      { step: 3, title: "Select a campaign", description: "Choose which campaign you want to submit to" },
                      { step: 4, title: "Submit for review", description: "Our team reviews and approves eligible clips" },
                    ] : [
                      { step: 1, title: "Paste your video URL", description: `Copy the video URL from ${getPlatformName(platform)} and paste it above` },
                      { step: 2, title: "Provide upload date", description: "Enter when you uploaded the video" },
                      { step: 3, title: "Submit URL", description: "Your URL will be locked for 48 hours" },
                      { step: 4, title: "Upload proof", description: "After 48 hours, upload screenshots of your views" },
                    ]).map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold">{item.step}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-display">Submission Locked</CardTitle>
              <CardDescription className="text-xs">
                Your video URL has been submitted. Please wait 48 hours before submitting proof.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Timer className="h-4 w-4" />
                <AlertDescription>
                  You can submit proof (screenshots) after the 48-hour waiting period. This helps prevent abuse and allows views to stabilize.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setStep(1);
                  setVideoUrl("");
                  setVideoData(null);
                  setSelectedCampaignId("");
                }}
              >
                Submit Another Video
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Submit;
