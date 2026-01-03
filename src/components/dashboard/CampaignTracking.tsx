import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Calendar,
  Bell
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const CampaignTracking = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<{
    active: any[];
    endingSoon: any[];
    completed: any[];
    expired: any[];
  }>({
    active: [],
    endingSoon: [],
    completed: [],
    expired: []
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // [ENGINE_INTEGRATION_POINT] - Clipper Campaigns API
      // Gets campaigns with relationship tracking
      const data = await api.get('/clipper/campaigns');
      setCampaigns({
        active: data.active || [],
        endingSoon: data.endingSoon || [],
        completed: data.completed || [],
        expired: data.expired || []
      });
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return 'No deadline';
    const now = new Date();
    const deadlineDate = new Date(endDate);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} hari tersisa` : 'Kedaluwarsa';
  };

  const getDaysLeftNumber = (endDate?: string): number | null => {
    if (!endDate) return null;
    const now = new Date();
    const deadlineDate = new Date(endDate);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const getStatusBadge = (status: string, endDate?: string) => {
    if (status === 'COMPLETED') {
      return <Badge variant="default" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Completed</Badge>;
    }
    if (endDate && new Date(endDate) <= new Date()) {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Expired</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><Play className="w-3 h-3" />Active</Badge>;
  };

  const renderCampaignList = (campaignList: any[], showSubmitButton: boolean = false) => {
    if (campaignList.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No campaigns in this category
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {campaignList.map((campaign) => {
          const canSubmit = showSubmitButton && campaign.status === 'ACTIVE' && 
            (!campaign.endDate || new Date(campaign.endDate) > new Date());
          
          return (
            <Card key={campaign.id} variant="glass" className="hover:border-foreground/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/campaigns/${campaign.id}`}>
                      <h3 className="font-semibold text-sm mb-1 truncate hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{campaign.influencerName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getDaysLeft(campaign.endDate)}
                      </span>
                      <span>•</span>
                      <span>{campaign.submissionCount || 0} submissions</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(campaign.status, campaign.endDate)}
                  </div>
                </div>
                
                {/* Submit Clip Button - Only for active campaigns that user has joined */}
                {canSubmit && (
                  <div className="pt-3 border-t border-border/50">
                    <Link to={`/submit?campaign=${campaign.id}`}>
                      <Button variant="default" size="sm" className="w-full">
                        <Play className="w-3 h-3 mr-2" />
                        Submit Clip
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
      </div>
    );
  }

  const totalCampaigns = campaigns.active.length + campaigns.endingSoon.length + campaigns.completed.length + campaigns.expired.length;

  if (totalCampaigns === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">You haven't joined any campaigns yet</p>
        <Link to="/marketplace">
          <Button size="sm">
            Browse Campaigns
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  // Check for urgent campaigns (H-3, H-1)
  const urgentCampaigns = [...campaigns.active, ...campaigns.endingSoon].filter(c => {
    const daysLeft = getDaysLeftNumber(c.endDate);
    return daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
  });

  return (
    <div className="w-full">
      {/* Urgent Campaign Alerts (H-3, H-1) */}
      {urgentCampaigns.length > 0 && (
        <div className="mb-4 space-y-2">
          {urgentCampaigns.map(campaign => {
            const daysLeft = getDaysLeftNumber(campaign.endDate);
            if (!daysLeft || daysLeft <= 0) return null;
            
            const isUrgent = daysLeft <= 1;
            const isWarning = daysLeft <= 3 && daysLeft > 1;
            
            return (
              <Alert 
                key={campaign.id} 
                variant={isUrgent ? "destructive" : "default"}
                className="border-yellow-500/50 bg-yellow-500/10"
              >
                <Bell className="h-4 w-4" />
                <AlertTitle>
                  {isUrgent ? "🚨 Campaign Berakhir Besok!" : "⏰ Campaign Berakhir Dalam " + daysLeft + " Hari"}
                </AlertTitle>
                <AlertDescription>
                  <Link to={`/campaigns/${campaign.id}`} className="font-semibold hover:underline">
                    {campaign.title}
                  </Link>
                  {" "}akan berakhir {isUrgent ? "besok" : `dalam ${daysLeft} hari`}. 
                  {campaign.submissionCount === 0 && " Submit clip Anda sekarang!"}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            Active ({campaigns.active.length})
          </TabsTrigger>
          <TabsTrigger value="endingSoon">
            Ending Soon ({campaigns.endingSoon.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({campaigns.completed.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({campaigns.expired.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {renderCampaignList(campaigns.active, true)}
        </TabsContent>
        
        <TabsContent value="endingSoon" className="mt-4">
          {renderCampaignList(campaigns.endingSoon, true)}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {renderCampaignList(campaigns.completed, false)}
        </TabsContent>
        
        <TabsContent value="expired" className="mt-4">
          {renderCampaignList(campaigns.expired, false)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

