import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import {
  Award, ArrowLeft, Video, Search, Eye, Printer,
  Download, Shield, CheckCircle, XCircle, Calendar,
  Star, Hash, Building2, FileText, QrCode, Tags,
  Plus, Trash2, ChevronRight
} from "lucide-react";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";

interface Certificate {
  id: string;
  recipientName: string;
  examTitle: string;
  courseTitle?: string;
  date: string;
  score: number;
  passingScore: number;
  organizationName: string;
  issuerName: string;
  issuerTitle: string;
  competencyTags: string[];
  certificateType: "exam" | "course";
  status: "valid" | "revoked";
  createdAt: string;
}

type ActiveTab = "my-certificates" | "generate" | "verify" | "view";

const STORAGE_KEY = "chaesa_certificates";

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "CL-";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) result += "-";
  }
  return result;
}

function loadCertificates(uid: string | null): Certificate[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(getUserStorageKey(uid, "certificates"));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCertificates(uid: string | null, certs: Certificate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getUserStorageKey(uid, "certificates"), JSON.stringify(certs));
}

function QRCodeSVG({ value, size = 120 }: { value: string; size?: number }) {
  const modules = 21;
  const cellSize = size / modules;

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  const grid: boolean[][] = [];
  for (let r = 0; r < modules; r++) {
    grid[r] = [];
    for (let c = 0; c < modules; c++) {
      grid[r][c] = false;
    }
  }

  const setFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startR + r][startC + c] = true;
        }
      }
    }
  };

  setFinderPattern(0, 0);
  setFinderPattern(0, modules - 7);
  setFinderPattern(modules - 7, 0);

  let seed = Math.abs(hash);
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= modules - 8) ||
        (r >= modules - 8 && c < 8)
      ) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      grid[r][c] = seed % 3 !== 0;
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function CertificateView({
  cert,
  onBack,
  onPrint,
}: {
  cert: Certificate;
  onBack: () => void;
  onPrint: () => void;
}) {
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sertifikat?verify=${cert.id}`
    : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={onBack} className="text-gray-600 dark:text-gray-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" /> Cetak / Download PDF
          </Button>
        </div>
      </div>

      <div id="certificate-content" className="certificate-print-area">
        <div className="bg-white border-4 border-double border-amber-600 rounded-lg p-8 md:p-12 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-500" />
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-500" />

          <div className="absolute top-4 left-4 w-16 h-16 opacity-10">
            <Award className="w-full h-full text-amber-600" />
          </div>
          <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
            <Award className="w-full h-full text-amber-600" />
          </div>
          <div className="absolute bottom-4 left-4 w-16 h-16 opacity-10">
            <Star className="w-full h-full text-amber-600" />
          </div>
          <div className="absolute bottom-4 right-4 w-16 h-16 opacity-10">
            <Star className="w-full h-full text-amber-600" />
          </div>

          <div className="text-center relative z-10">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-1">
              {cert.organizationName}
            </h3>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-700 mb-1 tracking-wide">
              SERTIFIKAT
            </h1>
            <p className="text-sm text-gray-500 mb-8 tracking-wider uppercase">
              {cert.certificateType === "exam" ? "Kelulusan Ujian" : "Penyelesaian Kursus"}
            </p>

            <p className="text-gray-600 mb-2">Diberikan kepada:</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-6 border-b-2 border-amber-400 pb-3 inline-block px-8">
              {cert.recipientName}
            </h2>

            <p className="text-gray-600 mb-2 mt-4">Atas keberhasilannya menyelesaikan:</p>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {cert.examTitle}
            </h3>

            <div className="flex justify-center gap-8 mb-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-gray-800 text-lg">{cert.score}%</div>
                <div>Nilai</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800 text-lg">{cert.passingScore}%</div>
                <div>Passing Score</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-800 text-lg">
                  {new Date(cert.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div>Tanggal</div>
              </div>
            </div>

            {cert.competencyTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {cert.competencyTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 items-end mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="border-b border-gray-400 pb-1 mb-1 mx-4">
                  <span className="text-sm font-medium text-gray-700">{cert.issuerName}</span>
                </div>
                <p className="text-xs text-gray-500">{cert.issuerTitle}</p>
              </div>

              <div className="flex flex-col items-center">
                <QRCodeSVG value={verificationUrl} size={80} />
                <p className="text-[10px] text-gray-400 mt-1">Scan untuk verifikasi</p>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-mono">{cert.id}</p>
                <p className="text-[10px] text-gray-400 mt-1">Certificate ID</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SertifikatPage() {
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("my-certificates");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null | "not_found" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formRecipient, setFormRecipient] = useState("");
  const [formExamTitle, setFormExamTitle] = useState("");
  const [formScore, setFormScore] = useState("85");
  const [formPassingScore, setFormPassingScore] = useState("70");
  const [formOrganization, setFormOrganization] = useState("Chaesa Live Academy");
  const [formIssuerName, setFormIssuerName] = useState("");
  const [formIssuerTitle, setFormIssuerTitle] = useState("Instruktur");
  const [formCertType, setFormCertType] = useState<"exam" | "course">("exam");
  const [formTags, setFormTags] = useState("");

  useEffect(() => {
    if (authLoading) return;
    setCertificates(loadCertificates(userId));
  }, [userId, authLoading]);

  useEffect(() => {
    if (router.query.verify && typeof router.query.verify === "string") {
      setVerifyId(router.query.verify);
      setActiveTab("verify");
      const certs = loadCertificates(userId);
      const found = certs.find((c) => c.id === router.query.verify);
      setVerifyResult(found || "not_found");
    }
  }, [router.query.verify]);

  const handleGenerate = () => {
    if (!formRecipient.trim() || !formExamTitle.trim()) return;

    const newCert: Certificate = {
      id: generateId(),
      recipientName: formRecipient.trim(),
      examTitle: formExamTitle.trim(),
      date: new Date().toISOString().split("T")[0],
      score: parseInt(formScore) || 85,
      passingScore: parseInt(formPassingScore) || 70,
      organizationName: formOrganization.trim() || "Chaesa Live Academy",
      issuerName: formIssuerName.trim() || "Administrator",
      issuerTitle: formIssuerTitle.trim() || "Instruktur",
      competencyTags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      certificateType: formCertType,
      status: "valid",
      createdAt: new Date().toISOString(),
    };

    const updated = [newCert, ...certificates];
    setCertificates(updated);
    saveCertificates(userId, updated);

    setSelectedCert(newCert);
    setActiveTab("view");

    setFormRecipient("");
    setFormExamTitle("");
    setFormScore("85");
    setFormPassingScore("70");
    setFormIssuerName("");
    setFormTags("");
  };

  const handleDelete = (id: string) => {
    const updated = certificates.filter((c) => c.id !== id);
    setCertificates(updated);
    saveCertificates(userId, updated);
  };

  const handleVerify = () => {
    const found = certificates.find((c) => c.id === verifyId.trim().toUpperCase());
    setVerifyResult(found || "not_found");
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredCerts = certificates.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: "my-certificates", label: "Sertifikat Saya", icon: Award },
    { id: "generate", label: "Buat Sertifikat", icon: Plus },
    { id: "verify", label: "Verifikasi", icon: Shield },
  ];

  return (
    <>
      <SEO
        title="Sertifikat Digital - Chaesa Live"
        description="Generate, kelola, dan verifikasi sertifikat digital profesional"
      />

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .certificate-print-area,
          .certificate-print-area * {
            visibility: visible !important;
          }
          .certificate-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: landscape;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Sertifikat Digital" icon={Award} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "view" && selectedCert ? (
            <CertificateView
              cert={selectedCert}
              onBack={() => {
                setSelectedCert(null);
                setActiveTab("my-certificates");
              }}
              onPrint={handlePrint}
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 print:hidden">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sertifikat Digital</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Buat, kelola, dan verifikasi sertifikat profesional
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-6 print:hidden overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setVerifyResult(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "my-certificates" && (
                <div>
                  <div className="mb-4">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari sertifikat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {filteredCerts.length === 0 ? (
                    <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                      <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Belum Ada Sertifikat
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Buat sertifikat pertama Anda atau selesaikan ujian untuk mendapatkan sertifikat.
                      </p>
                      <Button
                        onClick={() => setActiveTab("generate")}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Buat Sertifikat
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCerts.map((cert) => (
                        <Card
                          key={cert.id}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                        >
                          <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <Badge
                                variant="outline"
                                className={
                                  cert.status === "valid"
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                }
                              >
                                {cert.status === "valid" ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Valid</>
                                ) : (
                                  <><XCircle className="w-3 h-3 mr-1" /> Revoked</>
                                )}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {cert.certificateType === "exam" ? "Ujian" : "Kursus"}
                              </Badge>
                            </div>

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                              {cert.examTitle}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {cert.recipientName}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(cert.date).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Nilai: {cert.score}%
                              </span>
                            </div>

                            {cert.competencyTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {cert.competencyTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-[10px] font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {cert.competencyTags.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded text-[10px]">
                                    +{cert.competencyTags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="text-[10px] font-mono text-gray-400 mb-3">{cert.id}</div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setActiveTab("view");
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" /> Lihat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDelete(cert.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "generate" && (
                <div className="max-w-2xl mx-auto">
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Buat Sertifikat Baru
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nama Penerima *
                          </label>
                          <Input
                            value={formRecipient}
                            onChange={(e) => setFormRecipient(e.target.value)}
                            placeholder="Masukkan nama lengkap penerima"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Judul Ujian / Kursus *
                          </label>
                          <Input
                            value={formExamTitle}
                            onChange={(e) => setFormExamTitle(e.target.value)}
                            placeholder="Contoh: Sertifikasi Digital Marketing"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipe Sertifikat
                          </label>
                          <select
                            value={formCertType}
                            onChange={(e) => setFormCertType(e.target.value as "exam" | "course")}
                            className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            <option value="exam">Kelulusan Ujian</option>
                            <option value="course">Penyelesaian Kursus</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nama Organisasi
                          </label>
                          <Input
                            value={formOrganization}
                            onChange={(e) => setFormOrganization(e.target.value)}
                            placeholder="Chaesa Live Academy"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nilai (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formScore}
                            onChange={(e) => setFormScore(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Passing Score (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formPassingScore}
                            onChange={(e) => setFormPassingScore(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nama Penerbit
                          </label>
                          <Input
                            value={formIssuerName}
                            onChange={(e) => setFormIssuerName(e.target.value)}
                            placeholder="Nama instruktur/penerbit"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Jabatan Penerbit
                          </label>
                          <Input
                            value={formIssuerTitle}
                            onChange={(e) => setFormIssuerTitle(e.target.value)}
                            placeholder="Instruktur"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Tags className="w-4 h-4 inline mr-1" />
                            Kompetensi (pisahkan dengan koma)
                          </label>
                          <Input
                            value={formTags}
                            onChange={(e) => setFormTags(e.target.value)}
                            placeholder="Contoh: SEO, Content Strategy, Analytics"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={!formRecipient.trim() || !formExamTitle.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-4"
                      >
                        <Award className="w-4 h-4 mr-2" /> Generate Sertifikat
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "verify" && (
                <div className="max-w-xl mx-auto">
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-500" />
                      Verifikasi Sertifikat
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Masukkan ID sertifikat untuk memverifikasi keasliannya.
                    </p>

                    <div className="flex gap-2 mb-6">
                      <Input
                        value={verifyId}
                        onChange={(e) => {
                          setVerifyId(e.target.value);
                          setVerifyResult(null);
                        }}
                        placeholder="Contoh: CL-ABCD-1234-EFGH-5678"
                        className="font-mono"
                      />
                      <Button
                        onClick={handleVerify}
                        disabled={!verifyId.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Search className="w-4 h-4 mr-2" /> Verifikasi
                      </Button>
                    </div>

                    {verifyResult && verifyResult !== "not_found" && (
                      <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-300 text-lg">
                              Sertifikat Valid
                            </h4>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Sertifikat ini terverifikasi dan asli
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Penerima:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {verifyResult.recipientName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Ujian/Kursus:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {verifyResult.examTitle}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Nilai:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {verifyResult.score}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tanggal:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {new Date(verifyResult.date).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Organisasi:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {verifyResult.organizationName}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => {
                            setSelectedCert(verifyResult);
                            setActiveTab("view");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Lihat Sertifikat
                        </Button>
                      </div>
                    )}

                    {verifyResult === "not_found" && (
                      <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-8 h-8 text-red-500" />
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-300 text-lg">
                              Sertifikat Tidak Ditemukan
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              ID sertifikat tidak valid atau tidak terdaftar dalam sistem.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}