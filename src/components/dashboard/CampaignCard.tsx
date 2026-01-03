import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, DollarSign, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

interface CampaignCardProps {
  id?: string;
  title: string;
  brand: string;
  thumbnail: string;
  reward: number;
  minViews: number;
  deadline: string;
  clippers: number;
  status: "active" | "pending" | "completed";
  onJoin?: () => void;
}

export const CampaignCard = ({
  id,
  title = '',
  brand = '',
  thumbnail = '',
  reward = 0,
  minViews = 0,
  deadline = '',
  clippers = 0,
  status = 'pending',
  onJoin
}: CampaignCardProps) => {
  const normalizedStatus = (status || 'pending').toLowerCase() as keyof typeof statusLabels;

  const statusStyles = {
    active: "bg-foreground/10 text-foreground border-foreground/20",
    pending: "bg-muted text-muted-foreground border-border",
    completed: "bg-muted text-muted-foreground border-border"
  };

  const statusLabels = {
    active: "Aktif",
    pending: "Menunggu",
    completed: "Selesai"
  };

  const cardContent = (
    <>
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <Badge
          className={`absolute top-2.5 right-2.5 ${statusStyles[normalizedStatus] || statusStyles.pending} border text-xs`}
        >
          {statusLabels[normalizedStatus] || status}
        </Badge>
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <p className="text-xs text-muted-foreground">{brand}</p>
          <h3 className="font-display font-semibold text-base line-clamp-1">{title}</h3>
        </div>
      </div>

      <CardContent className="p-3.5 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Reward:</span>
            <span className="font-medium">{formatCurrency(reward || 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Min:</span>
            <span className="font-medium">{(minViews || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{deadline}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{clippers} bergabung</span>
          </div>
        </div>

        {/* Action */}
        {normalizedStatus === "active" && onJoin && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoin();
            }}
          >
            <Play className="w-3.5 h-3.5" />
            Bergabung
          </Button>
        )}
      </CardContent>
    </>
  );

  // If campaign has an ID, wrap in Link for navigation
  if (id) {
    return (
      <Link to={`/campaigns/${id}`} className="block">
        <Card variant="glass" className="group overflow-hidden hover:border-border transition-all duration-300 cursor-pointer">
          {cardContent}
        </Card>
      </Link>
    );
  }

  // Otherwise render as non-clickable card
  return (
    <Card variant="glass" className="group overflow-hidden hover:border-border transition-all duration-300">
      {cardContent}
    </Card>
  );
};