import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const AccessDenied = () => {
    const { user } = useAuth();

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'influencer') return '/influencer';
        if (user?.role === 'clipper') return '/dashboard';
        return '/';
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                        <div className="relative p-6 bg-gradient-to-br from-[rgba(239,68,68,0.1)] to-[rgba(185,28,28,0.1)] backdrop-blur-[8px] border border-red-500/20 rounded-2xl">
                            <ShieldOff className="w-16 h-16 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-white mb-4">
                    Access Denied
                </h1>

                {/* Description */}
                <p className="text-zinc-400 mb-2">
                    You don't have permission to access this page.
                </p>

                {user?.role && (
                    <p className="text-sm text-zinc-500 mb-8">
                        Your current role: <span className="text-zinc-300 font-medium">{user.role}</span>
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        asChild
                        variant="outline"
                        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
                    >
                        <Link to={getDashboardPath()}>
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Link>
                    </Button>

                    <Button
                        asChild
                        className="bg-white text-black hover:bg-zinc-200"
                        onClick={() => window.history.back()}
                    >
                        <button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </button>
                    </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <p className="text-xs text-zinc-500">
                        If you believe this is an error, please contact your administrator or try logging in with a different account.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
