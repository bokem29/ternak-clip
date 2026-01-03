import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ThumbsUp, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SubmissionCardProps {
  thumbnail: string;
  title: string;
  campaign: string;
  views: number;
  likes: number;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  earnings?: number;
}

export const SubmissionCard = ({
  thumbnail = '',
  title = '',
  campaign = '',
  views = 0,
  likes = 0,
  submittedAt = '',
  status = 'pending',
  earnings
}: SubmissionCardProps) => {
  const statusConfig = {
    pending: {
      color: "bg-secondary text-muted-foreground border-border",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Pending"
    },
    approved: {
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Approved"
    },
    rejected: {
      color: "bg-secondary text-muted-foreground border-border",
      icon: <XCircle className="w-3 h-3" />,
      label: "Rejected"
    }
  };

  const normalizedStatus = (status || 'pending').toLowerCase();
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="group p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
              <p className="text-[10px] text-muted-foreground">{campaign}</p>
            </div>
            <Badge className={`${config.color} border flex items-center gap-1 flex-shrink-0 text-[9px] px-1.5 py-0`}>
              {config.icon}
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(views || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {(likes || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {submittedAt}
            </div>
            {status === "approved" && earnings !== undefined && (
              <div className="ml-auto text-emerald-400 font-medium text-xs">
                +${(earnings || 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};