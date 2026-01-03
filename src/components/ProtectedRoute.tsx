import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'clipper' | 'influencer';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If user has no role assigned, redirect to role selection
    if (!user.role) {
      return <Navigate to="/role-selection" replace />;
    }

    // User has a role but it doesn't match the required role for this route
    // Show access denied page instead of redirecting to their dashboard
    return <Navigate to="/access-denied" replace />;
  }

  // For influencer routes that require verification
  if (requiredRole === 'influencer') {
    const influencerStatus = user.influencerStatus || 'NOT_APPLIED';

    // Allow access to onboarding regardless of status
    if (window.location.pathname.includes('/influencer/onboarding')) {
      return <>{children}</>;
    }

    // Allow access to wallet page for ALL influencers regardless of status
    // They need to be able to top up budget at any stage
    if (window.location.pathname.includes('/influencer/wallet')) {
      return <>{children}</>;
    }

    // Check influencer status and redirect accordingly
    if (influencerStatus === 'NOT_APPLIED') {
      return <Navigate to="/influencer/onboarding" replace />;
    } else if (influencerStatus === 'PENDING_REVIEW') {
      return <Navigate to="/influencer/onboarding?status=pending" replace />;
    } else if (influencerStatus === 'REJECTED') {
      return <Navigate to="/influencer/onboarding?status=rejected" replace />;
    }
    // VERIFIED - allow access (continue to render children)
  }

  return <>{children}</>;
};

