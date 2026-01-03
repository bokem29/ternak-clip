import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Play,
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  DollarSign,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: ('admin' | 'clipper' | 'influencer')[];
}

export const GlassNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['clipper'] },
    { label: "Marketplace", href: "/marketplace", icon: <ShoppingBag className="w-4 h-4" />, roles: ['clipper'] },
    { label: "Wallet", href: "/wallet", icon: <Wallet className="w-4 h-4" />, roles: ['clipper'] },
    { label: "Admin", href: "/admin", icon: <Shield className="w-4 h-4" />, roles: ['admin'] },
    { label: "Influencer", href: "/influencer", icon: <Shield className="w-4 h-4" />, roles: ['influencer'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't render if still loading (to avoid flash)
  if (loading) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <div className="glass-card px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img src="/logo-ternak.png" alt="Ternak Klip" className="h-8 md:h-10 w-auto group-hover:scale-105 transition-transform duration-200" />
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center mx-4">
              {user ? (
                <>
                  {filteredNavItems.map((item) => (
                    <Link key={item.href} to={item.href}>
                      <Button
                        variant={location.pathname === item.href ? "secondary" : "ghost"}
                        size="sm"
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </>
              ) : null}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/wallet" className="cursor-pointer">
                          <Wallet className="w-4 h-4 mr-2" />
                          Wallet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                    Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Navigation - Only show when menu is open */}
          {isOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-border/30 animate-fade-in">
              <div className="flex flex-col gap-1">
                {user ? (
                  <>
                    {filteredNavItems.map((item) => (
                      <Link key={item.href} to={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={location.pathname === item.href ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          size="sm"
                        >
                          {item.icon}
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground flex items-center">{user.name}</span>
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="default" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};