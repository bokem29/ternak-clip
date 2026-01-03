import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Search,
  Video,
  Eye,
  ThumbsUp,
  ExternalLink,
  Play
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Clip {
  id: string;
  campaignId: string;
  videoUrl: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  platform: string;
  submittedAt: string;
}

const ClipGallery = () => {
  const [searchParams] = useSearchParams();
  const [clips, setClips] = useState<Clip[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(searchParams.get('campaign') || 'all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [submissionsData, campaignsData] = await Promise.all([
        api.get('/influencer/submissions'),
        api.get('/influencer/campaigns')
      ]);

      // Only show approved clips
      const approvedClips = (submissionsData.submissions || [])
        .filter((s: any) => s.status === 'approved')
        .map((s: any) => ({
          ...s,
          platform: campaigns.find(c => c.id === s.campaignId)?.platform || 'youtube'
        }));

      setClips(approvedClips);
      setCampaigns(campaignsData.campaigns || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load clips',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCampaign = selectedCampaign === 'all' || clip.campaignId === selectedCampaign;
    const matchesPlatform = selectedPlatform === 'all' || clip.platform === selectedPlatform;
    return matchesSearch && matchesCampaign && matchesPlatform;
  });

  const getVideoEmbedUrl = (videoUrl: string, platform: string) => {
    if (platform === 'youtube') {
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // For TikTok, would need TikTok embed URL
    return null;
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/influencer">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold mb-1.5">Clip Gallery</h1>
        <p className="text-sm text-muted-foreground">Lihat semua clip hasil campaign Anda</p>
      </div>

      {/* Filters */}
      <Card variant="glass" className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clips Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : filteredClips.length === 0 ? (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No clips found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClips.map((clip) => (
            <Card key={clip.id} variant="glass" className="overflow-hidden">
              <div className="relative aspect-video">
                {getVideoEmbedUrl(clip.videoUrl, clip.platform) ? (
                  <iframe
                    src={getVideoEmbedUrl(clip.videoUrl, clip.platform) || ''}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {clip.platform}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2 line-clamp-2">{clip.title}</h4>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {clip.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {clip.likes.toLocaleString()}
                  </div>
                </div>
                <a
                  href={clip.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Original
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClipGallery;

