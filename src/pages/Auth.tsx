import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Play, Mail, Lock, User, ArrowRight, Chrome, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await login(email, password);
        toast({
          title: 'Selamat datang kembali!',
          description: `Masuk sebagai ${data.user.name}`,
        });
        // Redirect berdasarkan role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'influencer') {
          navigate('/influencer');
        } else {
          navigate('/dashboard');
        }
      } else {
        const data = await register(email, password, name);
        toast({
          title: 'Akun berhasil dibuat!',
          description: `Selamat datang di Ternak Klip, ${data.user.name}!`,
        });
        // Redirect to role selection for new users
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          // New users go to role selection
          navigate('/role-selection');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || (isLogin ? 'Email atau password salah' : 'Gagal membuat akun');

      // If email already in use during registration, suggest login
      if (!isLogin && errorMessage.includes('sudah terdaftar')) {
        toast({
          title: 'Email sudah terdaftar',
          description: errorMessage + ' Klik "Sign in" untuk masuk.',
          variant: 'destructive',
          duration: 5000,
        });
        // Auto-switch to login mode after a short delay
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      } else {
        toast({
          title: isLogin ? 'Login gagal' : 'Registrasi gagal',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-foreground/3 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-foreground/2 blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-6 group">
          <img src="/logo-ternak.png" alt="Ternak Klip" className="h-10 md:h-12 w-auto group-hover:scale-105 transition-transform duration-200" />
        </Link>

        <Card variant="glass" className="animate-slide-up">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-display">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isLogin
                ? "Sign in to continue to your dashboard"
                : "Start earning with your creative clips"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* OAuth Buttons */}
            <Button variant="outline" className="w-full" type="button">
              <Chrome className="w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <Button variant="link" className="px-0 text-xs h-auto text-muted-foreground">
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-foreground hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground mt-5">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;