import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, DollarSign, Video, Users, ArrowRight, Plus } from "lucide-react";
import { useRouter } from "next/router";

const TEMPLATES = [
  {
    id: "course",
    title: "Create a Course",
    icon: Brain,
    color: "blue",
    description: "Record a session and auto-generate modules",
    features: ["Auto-Recording On", "AI Chunking Enabled", "Quiz Gen Ready"]
  },
  {
    id: "sales",
    title: "Live Sales Webinar",
    icon: DollarSign,
    color: "orange",
    description: "Push products and track conversions",
    features: ["CTA Panel Open", "Timer Widget", "Payment Ready"]
  },
  {
    id: "studio",
    title: "Studio Stream",
    icon: Video,
    color: "green",
    description: "Clean feed for OBS streaming",
    features: ["UI Hidden", "Original Sound On", "HD Video"]
  },
  {
    id: "training",
    title: "Team Training",
    icon: Users,
    color: "purple",
    description: "Interactive workshop for teams",
    features: ["Breakout Rooms", "Whiteboard", "Attendance"]
  }
];

export function QuickStartTemplates() {
  const router = useRouter();

  const handleStartTemplate = (templateId: string) => {
    // Generate ID
    const meetingId = Math.random().toString(36).substring(2, 15);
    
    // In a real app, we would save the template settings to DB here
    // For now, we just redirect with a query param
    router.push(`/meeting/${meetingId}?template=${templateId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {TEMPLATES.map((template) => (
        <Card 
          key={template.id}
          className={`p-6 bg-${template.color}-900/10 border-${template.color}-500/20 hover:border-${template.color}-500/50 hover:bg-${template.color}-900/20 transition-all cursor-pointer group`}
          onClick={() => handleStartTemplate(template.id)}
        >
          <div className={`w-12 h-12 rounded-lg bg-${template.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <template.icon className={`w-6 h-6 text-${template.color}-400`} />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-${template.color}-300">
            {template.title}
          </h3>
          
          <p className="text-sm text-gray-400 mb-4 h-10">
            {template.description}
          </p>

          <div className="space-y-2 mb-4">
            {template.features.map((feature, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full bg-${template.color}-500 mr-2`} />
                {feature}
              </div>
            ))}
          </div>

          <Button 
            className={`w-full bg-${template.color}-600/20 text-${template.color}-300 hover:bg-${template.color}-600/30 border border-${template.color}-500/30`}
          >
            Use Template <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      ))}

      {/* Blank Meeting */}
      <Card 
        className="p-6 bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-all cursor-pointer flex flex-col items-center justify-center text-center dashed border-2 border-dashed"
        onClick={() => handleStartTemplate("blank")}
      >
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Start Blank</h3>
        <p className="text-sm text-gray-400">Custom setup</p>
      </Card>
    </div>
  );
}