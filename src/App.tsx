import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Wallet from "./pages/Wallet";
import Submit from "./pages/Submit";
import Submissions from "./pages/Submissions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignManagement from "./pages/admin/CampaignManagement";
import CampaignDetail from "./pages/admin/CampaignDetail";
import SubmissionQueue from "./pages/admin/SubmissionQueue";
import SubmissionDetail from "./pages/admin/SubmissionDetail";
import UserManagement from "./pages/admin/UserManagement";
import TransactionManagement from "./pages/admin/TransactionManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Settings from "./pages/admin/Settings";
import InfluencerReview from "./pages/admin/InfluencerReview";
import AdminCampaignReview from "./pages/admin/AdminCampaignReview";
import WithdrawManagement from "./pages/admin/WithdrawManagement";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import UserProfile from "./pages/UserProfile";
import TransactionList from "./pages/admin/finance/TransactionList";
import WithdrawalQueue from "./pages/admin/finance/WithdrawalQueue";
import WithdrawalDetail from "./pages/admin/finance/WithdrawalDetail";
import ApiPerformance from "./pages/admin/ApiPerformance";
import InfluencerDashboard from "./pages/influencer/InfluencerDashboard";
import InfluencerCreateCampaign from "./pages/influencer/CreateCampaign";
import InfluencerCampaignsList from "./pages/influencer/CampaignsList";
import InfluencerCampaignDetail from "./pages/influencer/CampaignDetail";
import ClipperCampaignDetail from "./pages/ClipperCampaignDetail";
import ClipGallery from "./pages/influencer/ClipGallery";
import PaymentInvoice from "./pages/influencer/PaymentInvoice";
import Reports from "./pages/influencer/Reports";
import RoleSelection from "./pages/RoleSelection";
import InfluencerOnboarding from "./pages/influencer/Onboarding";
import InfluencerWallet from "./pages/influencer/InfluencerWallet";
import SubmitProof from "./pages/SubmitProof";
import Withdraw from "./pages/Withdraw";
import TransactionHistory from "./pages/TransactionHistory";
import PaymentMethods from "./pages/PaymentMethods";
import NotFound from "./pages/NotFound";
import AccessDenied from "./pages/AccessDenied";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Marketplace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Wallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet/withdraw"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Withdraw />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet/history"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet/payment-methods"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <PaymentMethods />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/withdrawals/:id"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <WithdrawalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Submit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <Submissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/:id"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <ClipperCampaignDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit/proof/:id"
                element={
                  <ProtectedRoute requiredRole="clipper">
                    <SubmitProof />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CampaignManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/create"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CreateCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/review"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminCampaignReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CampaignDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SubmissionQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SubmissionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/:userId"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/transactions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <TransactionManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/influencers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <InfluencerReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/finance/transactions"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <TransactionList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/finance/withdrawals"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <WithdrawalQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/finance/withdrawals/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <WithdrawalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/api-performance"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ApiPerformance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/withdraws"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <WithdrawManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/campaigns"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerCampaignsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/campaigns/create"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerCreateCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/campaigns/:id"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerCampaignDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/wallet"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <InfluencerWallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/onboarding"
                element={
                  <ProtectedRoute>
                    <InfluencerOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-selection"
                element={
                  <ProtectedRoute>
                    <RoleSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/clips"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <ClipGallery />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/payment"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <PaymentInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer/reports"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
