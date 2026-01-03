import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = [
    { id: "all", label: "Semua Campaign" },
    { id: "gaming", label: "Gaming" },
    { id: "tech", label: "Teknologi" },
    { id: "lifestyle", label: "Gaya Hidup" },
    { id: "entertainment", label: "Hiburan" },
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get('/campaigns?marketplace=true');
      console.log('Marketplace: Received campaigns data:', data);
      const mappedCampaigns = (data.campaigns || []).map((c: any) => ({
        ...c,
        status: c.status || 'active',
        deadline: getDaysLeft(c.endDate || c.deadline),
        clippers: c.submissions || 0,
        brand: c.influencerName || c.brand || 'Unknown',
        reward: (c.ratePer1kViews || c.rate || 0) * ((c.minEligibleViews || c.minViews || 0) / 1000),
        minViews: c.minEligibleViews || c.minViews || 0,
      }));
      console.log('Marketplace: Mapped campaigns:', mappedCampaigns);
      setCampaigns(mappedCampaigns);
    } catch (error: any) {
      console.error('Marketplace: Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return 'No deadline';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} hari tersisa` : 'Kedaluwarsa';
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const avgReward = campaigns.length > 0
    ? formatCurrency(Math.round(campaigns.reduce((sum, c) => sum + c.reward, 0) / campaigns.length))
    : formatCurrency(0);

  const stats = [
    { icon: <TrendingUp className="w-4 h-4" />, label: "Campaign Aktif", value: campaigns.length },
    { icon: <DollarSign className="w-4 h-4" />, label: "Rata-rata Reward", value: avgReward },
    { icon: <Clock className="w-4 h-4" />, label: "Total Pengajuan", value: campaigns.reduce((sum, c) => sum + (c.submissions || 0), 0) },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold mb-1">Marketplace Campaign</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Temukan campaign dan mulai menghasilkan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} variant="glass" className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                {stat.icon}
              </div>
              <div>
                <p className="text-base sm:text-lg font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card variant="glass" className="mb-6">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Category Filter - Horizontal scroll on mobile */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Memuat campaign...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCampaigns.map((campaign, index) => (
              <div
                key={campaign.id || index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CampaignCard {...campaign} />
              </div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Tidak ada campaign yang sesuai dengan kriteria Anda.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              >
                Hapus Filter
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Marketplace;