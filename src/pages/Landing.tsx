import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Play,
  DollarSign,
  ArrowRight,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Quick Submissions",
      description: "Submit your clips with just a YouTube URL. We auto-fetch all the stats for you."
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Earn Rewards",
      description: "Get paid for every approved clip. Track your earnings in real-time."
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Platform",
      description: "Your data and earnings are protected with enterprise-grade security."
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analytics Dashboard",
      description: "Track your performance with detailed analytics and insights."
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Clippers" },
    { value: "Rp 500jt+", label: "Paid Out" },
    { value: "50+", label: "Brand Partners" },
    { value: "1M+", label: "Clips Created" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-foreground/3 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-foreground/2 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Navigation - Sticky with dynamic scroll effects */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4' : 'py-8'
        }`}>
        <div className="max-w-[1400px] mx-auto px-8">
          <div className={`flex items-center justify-between rounded-full border-2 shadow-2xl transition-all duration-300 ${isScrolled
            ? 'px-10 py-5 backdrop-blur-3xl bg-background/15 border-white/30'
            : 'px-12 py-6 backdrop-blur-2xl bg-background/5 border-white/20'
            }`}>
            <Link to="/" className="flex items-center group">
              <img
                src="/logo-ternak.png"
                alt="Ternak Klip"
                className={`w-auto group-hover:scale-105 transition-all duration-300 ${isScrolled ? 'h-7' : 'h-8'
                  }`}
              />
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" size="lg" className="text-base">Sign In</Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 text-base px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-36"></div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-foreground text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Now accepting new clippers
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Turn Your Clips Into
            <span className="block text-muted-foreground">Real Earnings</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Join thousands of content creators earning money by creating engaging clips for top brands.
            Simple submissions, automatic stats, instant rewards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/auth?mode=register">
              <Button size="lg">
                Start Earning Today
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" size="lg">
                Browse Campaigns
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl md:text-3xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Our platform provides all the tools you need to create, submit, and earn from your content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 group hover:border-border transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-4 group-hover:bg-accent transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-base font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Ready to Start Earning?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Join our community of creators and start monetizing your content today. No upfront costs, just pure earning potential.
            </p>
            <Link to="/auth?mode=register">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src="/logo-ternak.png" alt="Ternak Klip" className="h-7 w-auto" />
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 Ternak Klip Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;