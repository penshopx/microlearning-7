import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, DollarSign, Video, Users, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  {
    id: "creator",
    title: "E-Course Creator",
    icon: Brain,
    description: "I want to turn meetings into courses"
  },
  {
    id: "seller",
    title: "Live Seller",
    icon: DollarSign,
    description: "I want to sell products during live streams"
  },
  {
    id: "streamer",
    title: "Content Creator",
    icon: Video,
    description: "I need OBS-friendly streaming tools"
  },
  {
    id: "corporate",
    title: "Corporate Trainer",
    icon: Users,
    description: "I manage team training & onboarding"
  }
];

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single();

    if (!profile || !profile.onboarding_completed) {
      setOpen(true);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    // Save profile
    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: session.user.id,
        display_name: name || session.user.email?.split('@')[0],
        role: role,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome to Chaesa Live!",
        description: "Your profile has been set up successfully.",
      });
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {step === 1 ? "Welcome to Chaesa Live! 👋" : "Tell us about yourself"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {step === 1 
              ? "Let's personalize your experience to help you get the most out of the platform." 
              : "This helps us recommend the right templates for you."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 ? (
            <div className="space-y-4">
              <Label className="text-lg">What's your primary goal?</Label>
              <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLES.map((r) => (
                  <div key={r.id}>
                    <RadioGroupItem value={r.id} id={r.id} className="peer sr-only" />
                    <Label
                      htmlFor={r.id}
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 hover:border-purple-500 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-900/20 cursor-pointer transition-all h-full"
                    >
                      <r.icon className="mb-3 h-8 w-8 text-purple-400" />
                      <div className="text-center">
                        <div className="font-semibold text-white">{r.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{r.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="flex items-center gap-2 font-semibold text-purple-300 mb-2">
                  <CheckCircle className="w-4 h-4" /> Based on your role:
                </h4>
                <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                  <li>We'll enable <strong>Studio Mode</strong> by default</li>
                  <li>You'll get <strong>Course Templates</strong></li>
                  <li><strong>AI Chunking</strong> will be optimized for your niche</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-gray-400 hover:text-white">
              Back
            </Button>
          ) : (
            <div></div> // Spacer
          )}
          
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)} 
              disabled={!role}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={loading || !name}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? "Setting up..." : "Get Started 🚀"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}