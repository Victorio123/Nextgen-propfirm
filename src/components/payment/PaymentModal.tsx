import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Banknote, Smartphone, Bitcoin, Shield, ArrowRight } from "lucide-react";
import { HoverCard3D } from "@/components/3d/HoverCard3D";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: {
    id: string;
    name: string;
    price: number;
    balance: number;
    description: string;
    features: string[];
  };
}

const paymentMethods = [
  {
    id: 'paystack',
    name: 'Paystack',
    icon: <CreditCard className="h-6 w-6" />,
    description: 'Credit/Debit Cards, Bank Transfer',
    popular: true,
    fees: '2.9% + $0.30'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: <CreditCard className="h-6 w-6" />,
    description: 'Visa, Mastercard, Apple Pay',
    popular: false,
    fees: '2.9% + $0.30'
  },
  {
    id: 'skrill',
    name: 'Skrill',
    icon: <Banknote className="h-6 w-6" />,
    description: 'Digital Wallet',
    popular: false,
    fees: '1.9%'
  },
  {
    id: 'neteller',
    name: 'Neteller',
    icon: <Smartphone className="h-6 w-6" />,
    description: 'Digital Payment',
    popular: false,
    fees: '2.5%'
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: <Bitcoin className="h-6 w-6" />,
    description: 'Bitcoin, Ethereum, USDT',
    popular: false,
    fees: '1.5%'
  }
];

export const PaymentModal = ({ isOpen, onClose, tier }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!userDetails.firstName || !userDetails.lastName || !userDetails.email) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      if (selectedMethod === 'paystack') {
        // Get current user to link payment to account
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;

        // Direct Paystack redirect via Edge Function (server initializes transaction)
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            tierId: tier.id,
            email: userDetails.email,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            paymentMethod: selectedMethod,
            userId,
          },
        });

        if (error) throw error;

        if (data.success && data.paymentUrl) {
          // Redirect to Paystack checkout
          window.location.href = data.paymentUrl;
        } else {
          throw new Error(data.error || 'Failed to initialize payment');
        }
      } else {
        // For other payment methods, show not implemented message
        toast({
          title: "Payment method not available",
          description: "This payment method will be available soon.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>Secure checkout to purchase your selected trading challenge.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <Card className="bg-muted/30 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{tier.name}</span>
                    <Badge variant="secondary">${tier.balance.toLocaleString()}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{tier.description}</p>
                  
                  <div className="space-y-2">
                    {tier.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-accent" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${tier.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userDetails.firstName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userDetails.lastName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <HoverCard3D key={method.id} intensity={0.5}>
                  <Card 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-primary/20 ${
                      selectedMethod === method.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'bg-card/50 hover:bg-card/80'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {method.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{method.name}</span>
                              {method.popular && (
                                <Badge variant="default" className="text-xs">Popular</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Fee: {method.fees}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverCard3D>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              <Button 
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 text-primary-foreground"
                size="lg"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your payment is secured with SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};