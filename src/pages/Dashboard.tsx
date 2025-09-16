import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Activity,
  LogOut,
  Settings,
  CreditCard,
  Plus,
  ShoppingCart
} from "lucide-react";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { BubbleEffect } from "@/components/3d/BubbleEffect";
import { HoverCard3D } from "@/components/3d/HoverCard3D";
import { ParticleSystem } from "@/components/3d/ParticleSystem";

interface UserAccount {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  initial_balance: number;
  equity: number;
  current_daily_drawdown: number;
  current_overall_drawdown: number;
  status: string;
}

interface AccountTier {
  id: string;
  name: string;
  price: number;
  balance: number;
  description: string;
  features: any; // JSON array from database
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [tiers, setTiers] = useState<AccountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<AccountTier | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchAccounts(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUser(session.user);
          await fetchAccounts(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAccounts = async (userId: string) => {
    try {
      const [accountsResponse, tiersResponse] = await Promise.all([
        supabase
          .from('user_accounts')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('account_tiers')
          .select('*')
          .eq('is_active', true)
          .order('price')
      ]);

      if (accountsResponse.error) throw accountsResponse.error;
      if (tiersResponse.error) throw tiersResponse.error;

      setAccounts(accountsResponse.data || []);
      setTiers(tiersResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openPaymentModal = (tier: AccountTier) => {
    setSelectedTier(tier);
    setPaymentModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-accent';
      case 'warning': return 'text-yellow-500';
      case 'breached': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getDrawdownColor = (drawdown: number, limit: number) => {
    if (drawdown >= limit * 0.8) return 'text-destructive';
    if (drawdown >= limit * 0.6) return 'text-yellow-500';
    return 'text-accent';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <ParticleSystem count={15} />
      <BubbleEffect count={8} className="opacity-20" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground animate-float-subtle">
              Nextgen <span className="text-primary">Prop Firm</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.user_metadata?.first_name || user?.email}
              </span>
              <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:scale-105 transition-transform">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-slide-in-bottom">
          <h1 className="text-3xl font-bold text-foreground mb-2">Trading Dashboard</h1>
          <p className="text-muted-foreground">Monitor your funded accounts and trading performance</p>
        </div>

        {accounts.length === 0 ? (
          /* No Accounts State - Show Available Challenges */
          <div className="space-y-8">
            <HoverCard3D>
              <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border animate-scale-in">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CreditCard className="h-8 w-8 text-primary" />
                    Start Your Trading Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                  <p className="text-muted-foreground text-lg">
                    Get started with a funded trading account. Choose from our professional challenges below.
                  </p>
                </CardContent>
              </Card>
            </HoverCard3D>

            {/* Available Challenges */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier, index) => (
                <HoverCard3D key={tier.id} intensity={1}>
                  <Card className={`relative overflow-hidden hover:shadow-float transition-all duration-300 bg-card/80 backdrop-blur-sm animate-scale-in ${index === 1 ? 'ring-2 ring-primary' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s` }}>
                    {index === 1 && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-primary text-center text-sm py-2 text-primary-foreground font-medium">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className={index === 1 ? 'pt-12' : ''}>
                      <CardTitle className="text-center">
                        <div className="text-lg font-semibold mb-2">{tier.name}</div>
                        <div className="text-3xl font-bold text-primary animate-float-subtle">
                          ${tier.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${tier.balance.toLocaleString()} Account
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        {tier.description}
                      </p>
                      
                      <div className="space-y-2">
                        {tier.features.slice(0, 3).map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-accent" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => openPaymentModal(tier)}
                        variant={index === 1 ? "hero" : "default"} 
                        className="w-full hover:scale-105 transition-all duration-300"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Challenge
                      </Button>
                    </CardContent>
                  </Card>
                </HoverCard3D>
              ))}
            </div>
          </div>
        ) : (
          /* Accounts Dashboard */
          <div className="space-y-8">
            {/* Add New Account Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your Trading Accounts</h2>
                <p className="text-muted-foreground">Manage and monitor your funded accounts</p>
              </div>
              <Button 
                onClick={() => tiers.length > 0 && openPaymentModal(tiers[0])}
                variant="hero"
                className="animate-pulse-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Account
              </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <HoverCard3D intensity={0.5}>
                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-float transition-all duration-300 animate-slide-in-bottom">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold animate-float-subtle">{accounts.length}</div>
                  </CardContent>
                </Card>
              </HoverCard3D>

              <HoverCard3D intensity={0.5}>
                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-float transition-all duration-300 animate-slide-in-bottom" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold animate-float-subtle">
                      ${accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </HoverCard3D>

              <HoverCard3D intensity={0.5}>
                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-float transition-all duration-300 animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent animate-float-subtle">
                      {accounts.filter(acc => acc.status === 'active').length}
                    </div>
                  </CardContent>
                </Card>
              </HoverCard3D>

              <HoverCard3D intensity={0.5}>
                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-float transition-all duration-300 animate-slide-in-bottom" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500 animate-float-subtle">
                      {accounts.filter(acc => acc.current_daily_drawdown > 3 || acc.current_overall_drawdown > 6).length}
                    </div>
                  </CardContent>
                </Card>
              </HoverCard3D>
            </div>

            {/* Account Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {accounts.map((account, index) => (
                <HoverCard3D key={account.id} intensity={1}>
                  <Card className="bg-card/80 backdrop-blur-sm hover:shadow-float transition-all duration-300 border-border animate-scale-in"
                        style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Account #{account.account_number}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                          {account.status.toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Balance Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold">${account.balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Equity</p>
                        <p className="text-2xl font-bold">${account.equity.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Drawdown Info */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Daily Drawdown</span>
                          <span className={getDrawdownColor(account.current_daily_drawdown, 5)}>
                            {account.current_daily_drawdown.toFixed(2)}% / 5.00%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              account.current_daily_drawdown >= 4 ? 'bg-destructive' : 
                              account.current_daily_drawdown >= 3 ? 'bg-yellow-500' : 'bg-accent'
                            }`}
                            style={{ width: `${(account.current_daily_drawdown / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Drawdown</span>
                          <span className={getDrawdownColor(account.current_overall_drawdown, 10)}>
                            {account.current_overall_drawdown.toFixed(2)}% / 10.00%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              account.current_overall_drawdown >= 8 ? 'bg-destructive' : 
                              account.current_overall_drawdown >= 6 ? 'bg-yellow-500' : 'bg-accent'
                            }`}
                            style={{ width: `${(account.current_overall_drawdown / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 hover:scale-105 transition-transform">
                        View Details
                      </Button>
                      <Button variant="default" className="flex-1 hover:scale-105 transition-transform">
                        Trade Now
                      </Button>
                    </div>
                  </CardContent>
                  </Card>
                </HoverCard3D>
              ))}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {selectedTier && (
          <PaymentModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            tier={selectedTier}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;