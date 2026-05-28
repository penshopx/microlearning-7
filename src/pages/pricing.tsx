import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PageHeader } from "@/components/PageHeader";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


type Plan = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_participants: number | null;
  max_duration_minutes: number | null;
};

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // In a real app, you would fetch from DB. For now we'll define them to match DB structure
      // or fetch if they exist
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;

      const priceOverrides: Record<string, { monthly: number; yearly: number }> = {
        "Pro": { monthly: 99000, yearly: 990000 },
        "Business": { monthly: 199000, yearly: 1990000 },
      };
      
      if (data && data.length > 0) {
        setPlans(data.map(p => {
          const override = priceOverrides[p.name];
          return {
            ...p,
            price_monthly: override ? override.monthly : p.price_monthly,
            price_yearly: override ? override.yearly : p.price_yearly,
            features: Array.isArray(p.features) 
              ? p.features.map(f => String(f))
              : [
                p.max_participants ? `Up to ${p.max_participants} participants` : "Unlimited participants",
                p.max_duration_minutes ? `${p.max_duration_minutes} mins duration limit` : "Unlimited duration",
                "Screen sharing",
                "Chat & Reactions"
              ]
          };
        }));
      } else {
        // Fallback if DB is empty (should run seed script in real app)
        setPlans([
          {
            id: "free",
            name: "Free",
            price_monthly: 0,
            price_yearly: 0,
            max_participants: 100,
            max_duration_minutes: 45,
            features: [
              "Up to 100 participants",
              "45 mins group meetings",
              "Unlimited 1-on-1",
              "Basic Sales Tools",
              "Screen sharing"
            ]
          },
          {
            id: "pro",
            name: "Pro",
            price_monthly: 99000,
            price_yearly: 990000,
            max_participants: 100,
            max_duration_minutes: null,
            features: [
              "Everything in Free",
              "Unlimited duration",
              "Push Sales CTA (Live Shopping)",
              "Live Streaming to Social Media",
              "5GB Cloud Recording",
              "AI Meeting Summary",
              "Priority Support"
            ]
          },
          {
            id: "business",
            name: "Business",
            price_monthly: 199000,
            price_yearly: 1990000,
            max_participants: 300,
            max_duration_minutes: null,
            features: [
              "Everything in Pro",
              "Up to 300 participants",
              "20GB Cloud Storage",
              "White-label Branding",
              "Advanced Analytics",
              "API Access",
              "SSO Integration"
            ]
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    // If free plan, just redirect to dashboard
    if (plan.price_monthly === 0) {
      router.push("/");
      return;
    }

    toast({
      title: "Segera Hadir",
      description: `Pembayaran untuk paket ${plan.name} akan segera tersedia. Hubungi kami untuk informasi lebih lanjut.`,
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Pricing Plans - Chaesa Live</title>
      </Head>

      <PageHeader title="Harga" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Choose the perfect plan for your meeting needs. Start for free, upgrade when you need to scale.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? "text-gray-900" : "text-gray-500"}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm font-medium ${isAnnual ? "text-gray-900" : "text-gray-500"}`}>
              Annual <Badge variant="secondary" className="ml-1 text-green-600 bg-green-50">Save 17%</Badge>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 max-w-7xl mx-auto">
            {loading ? (
              <div className="col-span-3 flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              plans.map((plan) => {
                const price = isAnnual ? plan.price_yearly : plan.price_monthly;
                const isFree = plan.price_monthly === 0;
                
                return (
                  <Card key={plan.id} className={`flex flex-col relative ${plan.name === 'Pro' ? 'border-blue-500 shadow-xl scale-105 z-10' : ''}`}>
                    {plan.name === 'Pro' && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        <Badge className="bg-blue-600 hover:bg-blue-700">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription>
                        {isFree ? "Perfect for getting started" : 
                         plan.name === 'Pro' ? "Best for professionals & small teams" : 
                         "For growing organizations"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-6">
                        <span className="text-4xl font-bold">{formatPrice(price)}</span>
                        {!isFree && <span className="text-gray-500">/{isAnnual ? 'year' : 'mo'}</span>}
                      </div>
                      <ul className="space-y-4">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={plan.name === 'Pro' ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {isFree ? "Get Started Free" : `Subscribe to ${plan.name}`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How does the free tier limit work?</AccordionTrigger>
                <AccordionContent>
                  Free meetings are limited to 40 minutes for group calls (3+ participants). 1-on-1 meetings are unlimited. When the time limit is reached, the meeting will automatically end for everyone.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                <AccordionContent>
                  We do not offer refunds for partial use. However, if you experienced technical issues that prevented you from using the service, please contact support.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  We accept all major credit cards (Visa, Mastercard), bank transfers (BCA, Mandiri, BNI, BRI), e-wallets (GoPay, ShopeePay, OVO, Dana), QRIS, and PayLater via Mayar.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-20 text-center bg-gray-900 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Need a custom solution?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              We offer tailored plans for large enterprises, educational institutions, and government organizations.
            </p>
            <Button variant="secondary" size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}