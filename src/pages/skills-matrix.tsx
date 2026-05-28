import { useState, useEffect } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Plus, Trash2, Download, Users, Target,
  BarChart3, Brain, ChevronRight, ChevronDown, Star,
  Lightbulb, User, X, Edit2, Save, Eye
} from "lucide-react";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";

interface Skill {
  id: string;
  name: string;
  currentLevel: number;
  requiredLevel: number;
}

interface SkillCategory {
  id: string;
  name: string;
  skills: Skill[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skillRatings: Record<string, number>;
}

interface Framework {
  name: string;
  categories: { name: string; skills: string[] }[];
}

const FRAMEWORKS: Framework[] = [
  {
    name: "Digital Marketing",
    categories: [
      { name: "Content Marketing", skills: ["Copywriting", "SEO Writing", "Content Strategy", "Storytelling"] },
      { name: "Social Media", skills: ["Platform Management", "Community Building", "Paid Ads", "Analytics"] },
      { name: "SEO & SEM", skills: ["Keyword Research", "On-Page SEO", "Google Ads", "Link Building"] },
      { name: "Analytics", skills: ["Google Analytics", "Data Visualization", "A/B Testing", "Reporting"] },
    ],
  },
  {
    name: "Software Development",
    categories: [
      { name: "Frontend", skills: ["HTML/CSS", "JavaScript", "React/Vue", "UI/UX Design"] },
      { name: "Backend", skills: ["Node.js/Python", "Database Design", "API Development", "Security"] },
      { name: "DevOps", skills: ["CI/CD", "Cloud Services", "Docker/K8s", "Monitoring"] },
      { name: "Practices", skills: ["Code Review", "Testing", "Documentation", "Agile/Scrum"] },
    ],
  },
  {
    name: "Project Management",
    categories: [
      { name: "Planning", skills: ["Scope Definition", "WBS", "Resource Planning", "Risk Management"] },
      { name: "Execution", skills: ["Task Management", "Stakeholder Comm.", "Budget Control", "Quality Assurance"] },
      { name: "Methodology", skills: ["Agile/Scrum", "Waterfall", "Kanban", "Lean"] },
      { name: "Tools", skills: ["Jira/Trello", "MS Project", "Gantt Charts", "Reporting"] },
    ],
  },
  {
    name: "Leadership",
    categories: [
      { name: "People Management", skills: ["Coaching", "Delegation", "Conflict Resolution", "Performance Review"] },
      { name: "Communication", skills: ["Public Speaking", "Active Listening", "Written Comm.", "Negotiation"] },
      { name: "Strategy", skills: ["Vision Setting", "Decision Making", "Change Management", "Innovation"] },
      { name: "Emotional Intelligence", skills: ["Self-Awareness", "Empathy", "Motivation", "Social Skills"] },
    ],
  },
  {
    name: "Customer Service",
    categories: [
      { name: "Communication", skills: ["Active Listening", "Empathy", "Clear Communication", "Patience"] },
      { name: "Problem Solving", skills: ["Issue Resolution", "Escalation Handling", "Root Cause Analysis", "Follow-up"] },
      { name: "Product Knowledge", skills: ["Feature Expertise", "Use Case Understanding", "Troubleshooting", "Documentation"] },
      { name: "Tools & Process", skills: ["CRM Usage", "Ticketing Systems", "SLA Management", "Reporting"] },
    ],
  },
  {
    name: "Data Analytics",
    categories: [
      { name: "Data Collection", skills: ["SQL", "Web Scraping", "API Integration", "Data Warehousing"] },
      { name: "Analysis", skills: ["Statistical Analysis", "Python/R", "Excel Advanced", "Hypothesis Testing"] },
      { name: "Visualization", skills: ["Tableau/PowerBI", "Chart Design", "Dashboard Building", "Storytelling with Data"] },
      { name: "Machine Learning", skills: ["Supervised Learning", "Unsupervised Learning", "Feature Engineering", "Model Evaluation"] },
    ],
  },
];

const STORAGE_KEY = "chaesa-skills-matrix";

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function RadarChart({ skills, size = 280 }: { skills: { name: string; current: number; required: number }[]; size?: number }) {
  if (skills.length < 3) return null;

  const center = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (2 * Math.PI) / skills.length;
  const levels = 5;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 5) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridLines = [];
  for (let level = 1; level <= levels; level++) {
    const points = skills.map((_, i) => {
      const p = getPoint(i, level);
      return `${p.x},${p.y}`;
    });
    gridLines.push(
      <polygon
        key={`grid-${level}`}
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-gray-300 dark:text-gray-700"
      />
    );
  }

  const axisLines = skills.map((_, i) => {
    const p = getPoint(i, 5);
    return (
      <line
        key={`axis-${i}`}
        x1={center}
        y1={center}
        x2={p.x}
        y2={p.y}
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-gray-300 dark:text-gray-700"
      />
    );
  });

  const requiredPoints = skills.map((s, i) => {
    const p = getPoint(i, s.required);
    return `${p.x},${p.y}`;
  });

  const currentPoints = skills.map((s, i) => {
    const p = getPoint(i, s.current);
    return `${p.x},${p.y}`;
  });

  const labels = skills.map((s, i) => {
    const p = getPoint(i, 5.8);
    const anchor = p.x < center - 10 ? "end" : p.x > center + 10 ? "start" : "middle";
    return (
      <text
        key={`label-${i}`}
        x={p.x}
        y={p.y}
        textAnchor={anchor}
        dominantBaseline="middle"
        className="fill-gray-600 dark:fill-gray-400"
        fontSize="9"
        fontWeight="500"
      >
        {s.name.length > 14 ? s.name.substring(0, 12) + "..." : s.name}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto">
      {gridLines}
      {axisLines}
      <polygon
        points={requiredPoints.join(" ")}
        fill="rgba(239, 68, 68, 0.1)"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <polygon
        points={currentPoints.join(" ")}
        fill="rgba(139, 92, 246, 0.2)"
        stroke="#8b5cf6"
        strokeWidth="2"
      />
      {skills.map((s, i) => {
        const p = getPoint(i, s.current);
        return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="3" fill="#8b5cf6" />;
      })}
      {labels}
    </svg>
  );
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(level)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`w-4 h-4 ${
              level <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function SkillsMatrix() {
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<"matrix" | "passport" | "gap">("matrix");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingRequired, setEditingRequired] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    try {
      const saved = localStorage.getItem(getUserStorageKey(userId, "skills-matrix"));
      if (saved) {
        const data = JSON.parse(saved);
        setCategories(data.categories || []);
        setTeamMembers(data.teamMembers || []);
      }
    } catch {}
  }, [userId, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (categories.length > 0 || teamMembers.length > 0) {
      localStorage.setItem(getUserStorageKey(userId, "skills-matrix"), JSON.stringify({ categories, teamMembers }));
    }
  }, [categories, teamMembers, userId, authLoading]);

  const loadFramework = (frameworkName: string) => {
    const fw = FRAMEWORKS.find((f) => f.name === frameworkName);
    if (!fw) return;
    const newCategories: SkillCategory[] = fw.categories.map((cat) => ({
      id: generateId(),
      name: cat.name,
      skills: cat.skills.map((s) => ({
        id: generateId(),
        name: s,
        currentLevel: 0,
        requiredLevel: 3,
      })),
    }));
    setCategories(newCategories);
    setSelectedFramework(frameworkName);
    setExpandedCategories(new Set(newCategories.map((c) => c.id)));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat: SkillCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
      skills: [],
    };
    setCategories([...categories, cat]);
    setNewCategoryName("");
    setShowAddCategory(false);
    setExpandedCategories((prev) => new Set([...prev, cat.id]));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const addSkill = (categoryId: string) => {
    if (!newSkillName.trim()) return;
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              skills: [
                ...c.skills,
                { id: generateId(), name: newSkillName.trim(), currentLevel: 0, requiredLevel: 3 },
              ],
            }
          : c
      )
    );
    setNewSkillName("");
    setShowAddSkill(null);
  };

  const removeSkill = (categoryId: string, skillId: string) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId ? { ...c, skills: c.skills.filter((s) => s.id !== skillId) } : c
      )
    );
  };

  const updateRequiredLevel = (categoryId: string, skillId: string, level: number) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? { ...c, skills: c.skills.map((s) => (s.id === skillId ? { ...s, requiredLevel: level } : s)) }
          : c
      )
    );
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    const member: TeamMember = {
      id: generateId(),
      name: newMemberName.trim(),
      role: newMemberRole.trim() || "Team Member",
      skillRatings: {},
    };
    setTeamMembers([...teamMembers, member]);
    setNewMemberName("");
    setNewMemberRole("");
    setShowAddMember(false);
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
    if (selectedMember === id) setSelectedMember(null);
  };

  const updateMemberRating = (memberId: string, skillId: string, rating: number) => {
    setTeamMembers(
      teamMembers.map((m) =>
        m.id === memberId ? { ...m, skillRatings: { ...m.skillRatings, [skillId]: rating } } : m
      )
    );
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSkills = categories.flatMap((c) => c.skills);

  const getMemberRadarData = (member: TeamMember) => {
    return allSkills.map((s) => ({
      name: s.name,
      current: member.skillRatings[s.id] || 0,
      required: s.requiredLevel,
    }));
  };

  const getGapAnalysis = (member: TeamMember) => {
    return allSkills
      .map((s) => {
        const current = member.skillRatings[s.id] || 0;
        const gap = s.requiredLevel - current;
        const category = categories.find((c) => c.skills.some((sk) => sk.id === s.id));
        return { skill: s, gap, current, required: s.requiredLevel, categoryName: category?.name || "" };
      })
      .sort((a, b) => b.gap - a.gap);
  };

  const getAIRecommendations = (member: TeamMember) => {
    const gaps = getGapAnalysis(member).filter((g) => g.gap > 0);
    if (gaps.length === 0) return [];

    const recommendations: { skill: string; gap: number; recommendation: string; priority: string }[] = [];

    gaps.slice(0, 5).forEach((g) => {
      let rec = "";
      let priority = "Medium";

      if (g.gap >= 3) {
        rec = `Ikuti pelatihan intensif "${g.skill.name}" dari level dasar. Disarankan kursus terstruktur 40+ jam dengan mentor.`;
        priority = "Tinggi";
      } else if (g.gap === 2) {
        rec = `Tingkatkan "${g.skill.name}" dengan workshop praktis dan proyek hands-on. Target 20 jam latihan.`;
        priority = "Sedang";
      } else {
        rec = `Asah "${g.skill.name}" melalui peer learning dan review berkala. Micro-learning 5-10 jam cukup.`;
        priority = "Rendah";
      }

      recommendations.push({ skill: g.skill.name, gap: g.gap, recommendation: rec, priority });
    });

    return recommendations;
  };

  const getTeamAverage = (skillId: string) => {
    if (teamMembers.length === 0) return 0;
    const total = teamMembers.reduce((sum, m) => sum + (m.skillRatings[skillId] || 0), 0);
    return total / teamMembers.length;
  };

  const exportSummary = () => {
    let text = "=== SKILLS MATRIX SUMMARY ===\n\n";
    text += `Total Kategori: ${categories.length}\n`;
    text += `Total Skills: ${allSkills.length}\n`;
    text += `Total Anggota Tim: ${teamMembers.length}\n\n`;

    categories.forEach((cat) => {
      text += `--- ${cat.name} ---\n`;
      cat.skills.forEach((s) => {
        const avg = getTeamAverage(s.id);
        text += `  ${s.name}: Rata-rata ${avg.toFixed(1)}/5 | Target: ${s.requiredLevel}/5 | Gap: ${Math.max(0, s.requiredLevel - avg).toFixed(1)}\n`;
      });
      text += "\n";
    });

    teamMembers.forEach((m) => {
      text += `\n=== ${m.name} (${m.role}) ===\n`;
      const gaps = getGapAnalysis(m);
      const totalGap = gaps.reduce((s, g) => s + Math.max(0, g.gap), 0);
      const avgRating = allSkills.length > 0
        ? (allSkills.reduce((s, sk) => s + (m.skillRatings[sk.id] || 0), 0) / allSkills.length).toFixed(1)
        : "0";
      text += `Rata-rata Rating: ${avgRating}/5\n`;
      text += `Total Gap: ${totalGap}\n`;
      gaps.filter((g) => g.gap > 0).forEach((g) => {
        text += `  [GAP ${g.gap}] ${g.skill.name}: ${g.current}/${g.required}\n`;
      });

      const recs = getAIRecommendations(m);
      if (recs.length > 0) {
        text += `\nRekomendasi Pelatihan:\n`;
        recs.forEach((r) => {
          text += `  [${r.priority}] ${r.recommendation}\n`;
        });
      }
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skills-matrix-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentMember = teamMembers.find((m) => m.id === selectedMember);

  return (
    <>
      <SEO
        title="Skills Matrix & Gap Analysis - Chaesa Live"
        description="Peta kompetensi tim, analisis gap keterampilan, dan rekomendasi pelatihan berbasis AI"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Skills Matrix" icon={Target} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills Matrix & Gap Analysis</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Peta kompetensi tim dan analisis kebutuhan pelatihan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportSummary} variant="outline" size="sm" disabled={categories.length === 0}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 w-fit">
            {([
              { key: "matrix" as const, label: "Matrix", icon: BarChart3 },
              { key: "passport" as const, label: "Skill Passport", icon: User },
              { key: "gap" as const, label: "Gap Analysis", icon: Brain },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {categories.length === 0 && (
            <Card className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
              <div className="text-center">
                <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Mulai dengan Framework Kompetensi
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Pilih framework yang sudah jadi atau buat kategori skill sendiri
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.name}
                      onClick={() => loadFramework(fw.name)}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{fw.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {fw.categories.length} kategori, {fw.categories.reduce((s, c) => s + c.skills.length, 0)} skills
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 justify-center">
                  <span className="text-sm text-gray-400">atau</span>
                  <Button onClick={() => setShowAddCategory(true)} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Buat Kategori Sendiri
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "matrix" && categories.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kategori & Skills</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedFramework}
                      onChange={(e) => {
                        if (e.target.value) loadFramework(e.target.value);
                      }}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    >
                      <option value="">Ganti Framework</option>
                      {FRAMEWORKS.map((fw) => (
                        <option key={fw.name} value={fw.name}>{fw.name}</option>
                      ))}
                    </select>
                    <Button onClick={() => setShowAddCategory(true)} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" /> Kategori
                    </Button>
                  </div>
                </div>

                {showAddCategory && (
                  <Card className="p-4 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCategory()}
                        placeholder="Nama kategori..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      <Button onClick={addCategory} size="sm">
                        <Save className="w-4 h-4 mr-1" /> Simpan
                      </Button>
                      <Button onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }} variant="ghost" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                )}

                {categories.map((cat) => (
                  <Card key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedCategories.has(cat.id) ? "" : "-rotate-90"
                          }`}
                        />
                        <h4 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h4>
                        <Badge variant="outline" className="text-xs">{cat.skills.length} skills</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => { e.stopPropagation(); setShowAddSkill(cat.id); setNewSkillName(""); }}
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 dark:text-purple-400"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Skill
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); removeCategory(cat.id); }}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {expandedCategories.has(cat.id) && (
                      <div className="border-t border-gray-200 dark:border-gray-800">
                        {showAddSkill === cat.id && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 flex gap-2">
                            <input
                              type="text"
                              value={newSkillName}
                              onChange={(e) => setNewSkillName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addSkill(cat.id)}
                              placeholder="Nama skill..."
                              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                            />
                            <Button onClick={() => addSkill(cat.id)} size="sm" className="text-xs">Tambah</Button>
                            <Button onClick={() => setShowAddSkill(null)} variant="ghost" size="sm">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {cat.skills.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-400">Belum ada skill</div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {cat.skills.map((skill) => (
                              <div key={skill.id} className="px-4 py-3 flex items-center gap-4">
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{skill.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Target:</span>
                                  <StarRating
                                    value={skill.requiredLevel}
                                    onChange={(v) => updateRequiredLevel(cat.id, skill.id, v)}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Avg:</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-center">
                                    {getTeamAverage(skill.id).toFixed(1)}
                                  </span>
                                </div>
                                <Button
                                  onClick={() => removeSkill(cat.id, skill.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-600 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" /> Anggota Tim
                  </h3>
                  <Button onClick={() => setShowAddMember(true)} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Tambah
                  </Button>
                </div>

                {showAddMember && (
                  <Card className="p-4 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Nama..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addMember()}
                        placeholder="Role/Jabatan..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex gap-2">
                        <Button onClick={addMember} size="sm" className="flex-1">
                          <Save className="w-4 h-4 mr-1" /> Simpan
                        </Button>
                        <Button onClick={() => { setShowAddMember(false); setNewMemberName(""); setNewMemberRole(""); }} variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {teamMembers.length === 0 ? (
                  <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
                    <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Tambah anggota tim untuk mulai rating</p>
                  </Card>
                ) : (
                  teamMembers.map((member) => (
                    <Card
                      key={member.id}
                      className={`p-4 bg-white dark:bg-gray-900 border transition-all cursor-pointer ${
                        selectedMember === member.id
                          ? "border-purple-400 dark:border-purple-600 ring-1 ring-purple-400"
                          : "border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                      onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{member.role}</div>
                        </div>
                        <Button
                          onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {allSkills.length > 0 && (
                        <div className="text-xs text-gray-400">
                          Rated: {Object.keys(member.skillRatings).filter((k) => member.skillRatings[k] > 0).length}/{allSkills.length} skills
                        </div>
                      )}
                    </Card>
                  ))
                )}

                {selectedMember && currentMember && allSkills.length > 0 && (
                  <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Rating: {currentMember.name}
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat.id}>
                          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wider">
                            {cat.name}
                          </div>
                          {cat.skills.map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between py-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate mr-2 flex-1">
                                {skill.name}
                              </span>
                              <StarRating
                                value={currentMember.skillRatings[skill.id] || 0}
                                onChange={(v) => updateMemberRating(currentMember.id, skill.id, v)}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "passport" && (
            <div className="space-y-6">
              {teamMembers.length === 0 ? (
                <Card className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
                  <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Belum Ada Anggota</h3>
                  <p className="text-sm text-gray-400">Tambahkan anggota tim di tab Matrix terlebih dahulu</p>
                </Card>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {teamMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMember(m.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedMember === m.id
                            ? "bg-purple-600 text-white"
                            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-300"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  {currentMember && allSkills.length >= 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
                            {currentMember.name.charAt(0)}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentMember.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{currentMember.role}</p>
                        </div>
                        <RadarChart skills={getMemberRadarData(currentMember)} />
                        <div className="flex items-center justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Saat Ini</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400 opacity-60" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Target</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Detail Kompetensi</h4>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                          {categories.map((cat) => (
                            <div key={cat.id}>
                              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider">
                                {cat.name}
                              </div>
                              {cat.skills.map((skill) => {
                                const current = currentMember.skillRatings[skill.id] || 0;
                                const gap = skill.requiredLevel - current;
                                return (
                                  <div key={skill.id} className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{skill.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{current}/{skill.requiredLevel}</span>
                                        {gap > 0 && (
                                          <Badge className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                                            -{gap}
                                          </Badge>
                                        )}
                                        {gap <= 0 && current > 0 && (
                                          <Badge className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                            OK
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          gap > 0 ? "bg-orange-500" : "bg-green-500"
                                        }`}
                                        style={{ width: `${Math.min(100, (current / 5) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}

                  {currentMember && allSkills.length < 3 && (
                    <Card className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
                      <p className="text-gray-400">Minimal 3 skill diperlukan untuk menampilkan radar chart</p>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "gap" && (
            <div className="space-y-6">
              {teamMembers.length === 0 || allSkills.length === 0 ? (
                <Card className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
                  <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Belum Ada Data</h3>
                  <p className="text-sm text-gray-400">Tambahkan skill dan anggota tim di tab Matrix terlebih dahulu</p>
                </Card>
              ) : (
                <>
                  <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Perbandingan Level Saat Ini vs Target
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Skill</th>
                            <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Target</th>
                            {teamMembers.map((m) => (
                              <th key={m.id} className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">
                                {m.name}
                              </th>
                            ))}
                            <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((cat) => (
                            <>
                              <tr key={`cat-${cat.id}`}>
                                <td colSpan={3 + teamMembers.length} className="pt-4 pb-1">
                                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                    {cat.name}
                                  </span>
                                </td>
                              </tr>
                              {cat.skills.map((skill) => {
                                const avg = getTeamAverage(skill.id);
                                const avgGap = skill.requiredLevel - avg;
                                return (
                                  <tr key={skill.id} className="border-b border-gray-100 dark:border-gray-800/50">
                                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{skill.name}</td>
                                    <td className="py-2 px-2 text-center font-medium text-gray-900 dark:text-white">
                                      {skill.requiredLevel}
                                    </td>
                                    {teamMembers.map((m) => {
                                      const val = m.skillRatings[skill.id] || 0;
                                      const gap = skill.requiredLevel - val;
                                      return (
                                        <td key={m.id} className="py-2 px-2 text-center">
                                          <span className={`font-medium ${
                                            gap > 0
                                              ? "text-red-600 dark:text-red-400"
                                              : val > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-gray-400"
                                          }`}>
                                            {val || "-"}
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="py-2 px-2 text-center">
                                      <span className={`font-medium ${
                                        avgGap > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                                      }`}>
                                        {avg > 0 ? avg.toFixed(1) : "-"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {teamMembers.map((member) => {
                    const recs = getAIRecommendations(member);
                    if (recs.length === 0) return null;
                    return (
                      <Card key={member.id} className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Rekomendasi Pelatihan: {member.name}
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {recs.map((rec, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border ${
                                rec.priority === "Tinggi"
                                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                                  : rec.priority === "Sedang"
                                    ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
                                    : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{rec.skill}</span>
                                <Badge className={`text-[10px] ${
                                  rec.priority === "Tinggi"
                                    ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
                                    : rec.priority === "Sedang"
                                      ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30"
                                      : "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
                                }`}>
                                  Gap: {rec.gap} | {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{rec.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
