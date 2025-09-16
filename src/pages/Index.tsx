import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-trading.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveBubbles } from "@/components/3d/InteractiveBubbles";
import { BubbleEffect } from "@/components/3d/BubbleEffect";
import { HoverCard3D } from "@/components/3d/HoverCard3D";
import { ParticleSystem } from "@/components/3d/ParticleSystem";

interface AccountTier {
  id: string;
  name: string;
  price: number;
  balance: number;
  description: string;
  features: any; // JSON array from database
}

const Index = () => {
  const [tiers, setTiers] = useState<AccountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTiers = async () => {
      const { data } = await supabase
        .from('account_tiers')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (data) {
        setTiers(data);
      }
      setLoading(false);
    };

    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    fetchTiers();
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleStartChallenge = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Real-Time Monitoring",
      description: "Advanced trading analytics with instant risk monitoring"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Risk Management",
      description: "Automated drawdown protection and breach detection"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Execution",
      description: "Lightning-fast trade execution with minimal slippage"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <ParticleSystem count={20} />
      <InteractiveBubbles count={6} />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm">
        <div className="text-2xl font-bold text-foreground animate-float-subtle">
          Nextgen <span className="text-primary">Prop Firm</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="hero"
              className="animate-pulse-glow"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" className="hover:scale-105 transition-transform">
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" className="animate-pulse-glow">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 z-10">
        <BubbleEffect count={12} className="opacity-30" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-bottom">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Trade with <span className="bg-gradient-primary bg-clip-text text-transparent animate-pulse-glow">Professional</span> Capital
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Join the next generation of prop traders. Get funded accounts up to $100,000 with competitive profit splits and professional support.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleStartChallenge}
                  variant="hero" 
                  size="lg" 
                  className="w-full sm:w-auto animate-pulse-glow hover:scale-105 transition-all duration-300"
                >
                  Start Trading Challenge
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">$2M+</div>
                  <div className="text-sm text-muted-foreground">Funded Capital</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">500+</div>
                  <div className="text-sm text-muted-foreground">Active Traders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>

            <HoverCard3D className="relative animate-scale-in" intensity={1.2}>
              <div className="relative z-10">
                <img 
                  src={heroImage} 
                  alt="Professional Trading Platform"
                  className="rounded-xl shadow-float transition-all duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-xl blur-3xl transform scale-110 animate-pulse-glow"></div>
            </HoverCard3D>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Nextgen Prop Firm?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We provide the tools, capital, and support you need to succeed as a professional trader
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <HoverCard3D key={index} intensity={0.8}>
                <Card className="bg-card border-border hover:shadow-float transition-all duration-300 h-full animate-slide-in-bottom" 
                      style={{ animationDelay: `${index * 0.2}s` }}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 animate-float-subtle">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </HoverCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* Account Tiers Section */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Challenge
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the account size that matches your trading experience and goals
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier, index) => (
                <HoverCard3D key={tier.id} intensity={1}>
                  <Card className={`relative overflow-hidden hover:shadow-float transition-all duration-300 animate-scale-in ${index === 1 ? 'ring-2 ring-primary' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s` }}>
                    {index === 1 && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-primary text-center text-sm py-2 text-primary-foreground font-medium animate-pulse-glow">
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
                        {tier.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-accent" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleStartChallenge}
                        variant={index === 1 ? "hero" : "default"} 
                        className="w-full hover:scale-105 transition-all duration-300"
                      >
                        Start Challenge
                      </Button>
                    </CardContent>
                  </Card>
                </HoverCard3D>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-foreground mb-4">
            Nextgen <span className="text-primary">Prop Firm</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Nextgen Prop Firm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
