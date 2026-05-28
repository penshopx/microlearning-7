/* Indonesian Construction Standards Knowledge Base
   Inspired by: scite.ai citation intelligence system
   Each standard has: code, full name, year, issuing body, scope, type, and agent relevance */

export type StandardType = "wajib" | "disarankan" | "referensi";

export interface Standard {
  code: string;           // e.g. "SNI 2847:2019"
  aliases: string[];      // alternative ways it might appear in text
  name: string;           // full name in Bahasa Indonesia
  nameEn?: string;        // English name
  year: number;
  body: string;           // issuing body
  scope: string;          // what it covers
  type: StandardType;     // wajib=mandatory, disarankan=recommended, referensi=reference
  agents: string[];       // which agents typically cite this
  url?: string;           // official or reference URL
}

export const STANDARDS: Record<string, Standard> = {
  /* ── STRUKTUR ────────────────────────────────────────── */
  "SNI 2847:2019": {
    code: "SNI 2847:2019",
    aliases: ["SNI 2847", "2847:2019", "SNI 03-2847"],
    name: "Persyaratan Beton Struktural untuk Bangunan Gedung",
    nameEn: "Building Code Requirements for Structural Concrete (ACI 318-14 equivalent)",
    year: 2019, body: "BSN / Kementerian PUPR",
    scope: "Desain dan konstruksi elemen beton bertulang dan prategang: balok, kolom, pelat, dinding, fondasi.",
    type: "wajib", agents: ["struktur"],
    url: "https://www.bsn.go.id",
  },
  "SNI 1726:2019": {
    code: "SNI 1726:2019",
    aliases: ["SNI 1726", "1726:2019", "SNI gempa"],
    name: "Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung",
    year: 2019, body: "BSN",
    scope: "Analisis beban gempa, sistem struktur penahan lateral, spektrum respons desain.",
    type: "wajib", agents: ["struktur"],
  },
  "SNI 1727:2020": {
    code: "SNI 1727:2020",
    aliases: ["SNI 1727", "1727:2020", "SNI pembebanan"],
    name: "Beban Desain Minimum dan Kriteria Terkait untuk Bangunan Gedung",
    year: 2020, body: "BSN",
    scope: "Beban mati, hidup, angin, salju, gempa, dan kombinasi pembebanan.",
    type: "wajib", agents: ["struktur"],
  },
  "SNI 1729:2020": {
    code: "SNI 1729:2020",
    aliases: ["SNI 1729", "1729:2020", "SNI baja"],
    name: "Spesifikasi untuk Bangunan Gedung Baja Struktural",
    year: 2020, body: "BSN",
    scope: "Desain komponen baja: profil, sambungan baut dan las, stabilitas.",
    type: "wajib", agents: ["struktur"],
  },
  "SNI 7833:2012": {
    code: "SNI 7833:2012",
    aliases: ["SNI 7833", "7833:2012"],
    name: "Tata Cara Perancangan Beton Pracetak dan Beton Prategang untuk Bangunan Gedung",
    year: 2012, body: "BSN",
    scope: "Elemen pracetak, prategang, sambungan pracetak, kontrol lendutan.",
    type: "wajib", agents: ["struktur"],
  },

  /* ── K3 ─────────────────────────────────────────────── */
  "PP 50/2012": {
    code: "PP 50/2012",
    aliases: ["PP No 50", "PP50", "PP Nomor 50 Tahun 2012", "SMK3"],
    name: "Penerapan Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3)",
    year: 2012, body: "Pemerintah RI",
    scope: "Penerapan SMK3 di tempat kerja: perencanaan, pelaksanaan, pemantauan, peninjauan.",
    type: "wajib", agents: ["k3"],
  },
  "ISO 45001:2018": {
    code: "ISO 45001:2018",
    aliases: ["ISO 45001", "OHSAS 18001"],
    name: "Occupational Health and Safety Management Systems",
    year: 2018, body: "ISO",
    scope: "Sistem manajemen K3 internasional: HIRARC, pengendalian risiko, audit, improvement.",
    type: "disarankan", agents: ["k3"],
  },
  "UU 1/1970": {
    code: "UU 1/1970",
    aliases: ["UU No 1 1970", "UU No. 1/1970", "UU Keselamatan Kerja"],
    name: "Undang-Undang Keselamatan Kerja",
    year: 1970, body: "DPR RI",
    scope: "Dasar hukum K3 di Indonesia: kewajiban pengusaha, hak pekerja, pengawasan.",
    type: "wajib", agents: ["k3"],
  },
  "Permenaker 08/2010": {
    code: "Permenaker 08/2010",
    aliases: ["Permenaker 08", "Permen APD", "Permenakertrans 08"],
    name: "Alat Pelindung Diri (APD)",
    year: 2010, body: "Kemnaker RI",
    scope: "Jenis APD yang wajib disediakan, standar kualitas, cara penggunaan dan pemeliharaan.",
    type: "wajib", agents: ["k3"],
  },
  "Permenaker 01/1980": {
    code: "Permenaker 01/1980",
    aliases: ["Permenaker 01/1980", "K3 Konstruksi", "Permen K3 Bangunan"],
    name: "Keselamatan dan Kesehatan Kerja pada Konstruksi Bangunan",
    year: 1980, body: "Kemnaker RI",
    scope: "K3 khusus konstruksi: scaffolding, excavation, heavy equipment, bekisting.",
    type: "wajib", agents: ["k3"],
  },
  "SNI ISO 31000:2018": {
    code: "SNI ISO 31000:2018",
    aliases: ["ISO 31000", "SNI ISO 31000", "manajemen risiko"],
    name: "Manajemen Risiko — Pedoman",
    year: 2018, body: "BSN / ISO",
    scope: "Prinsip dan proses manajemen risiko: identifikasi, analisis, evaluasi, penanganan.",
    type: "disarankan", agents: ["k3", "pm"],
  },

  /* ── MEP ─────────────────────────────────────────────── */
  "PUIL 2011": {
    code: "PUIL 2011",
    aliases: ["SNI 0225:2011", "PUIL", "SNI 0225"],
    name: "Persyaratan Umum Instalasi Listrik 2011",
    year: 2011, body: "BSN / PLN",
    scope: "Instalasi listrik gedung: proteksi, grounding, sizing kabel, panel distribusi.",
    type: "wajib", agents: ["mep"],
  },
  "SNI 03-7065:2005": {
    code: "SNI 03-7065:2005",
    aliases: ["SNI 7065", "SNI plumbing", "instalasi air"],
    name: "Tata Cara Perencanaan Sistem Plambing",
    year: 2005, body: "BSN",
    scope: "Sistem air bersih, air kotor, air hujan, venting, dan ukuran pipa.",
    type: "wajib", agents: ["mep"],
  },
  "SNI 6572:2001": {
    code: "SNI 6572:2001",
    aliases: ["SNI 6572", "SNI AC", "HVAC SNI"],
    name: "Tata Cara Perancangan Sistem Ventilasi dan Pengkondisian Udara",
    year: 2001, body: "BSN",
    scope: "Sistem AC dan ventilasi: cooling load, ducting, fresh air requirement.",
    type: "wajib", agents: ["mep"],
  },
  "ASHRAE 62.1": {
    code: "ASHRAE 62.1",
    aliases: ["ASHRAE", "ASHRAE 62", "ventilation standard"],
    name: "Ventilation and Acceptable Indoor Air Quality in Residential Buildings",
    year: 2022, body: "ASHRAE",
    scope: "Standar ventilasi dan kualitas udara dalam ruangan untuk hunian dan komersial.",
    type: "disarankan", agents: ["mep"],
  },
  "IEC 60364": {
    code: "IEC 60364",
    aliases: ["IEC 60364", "IEC electrical"],
    name: "Low-Voltage Electrical Installations",
    year: 2023, body: "IEC",
    scope: "Instalasi listrik tegangan rendah: proteksi, sizing, testing.",
    type: "referensi", agents: ["mep"],
  },

  /* ── GEOTEKNIK ───────────────────────────────────────── */
  "SNI 8460:2017": {
    code: "SNI 8460:2017",
    aliases: ["SNI 8460", "8460:2017", "SNI geoteknik", "SNI fondasi"],
    name: "Persyaratan Perancangan Geoteknik",
    year: 2017, body: "BSN",
    scope: "Desain geoteknik: fondasi dangkal, tiang, dinding penahan tanah, stabilitas lereng.",
    type: "wajib", agents: ["geoteknik"],
  },
  "ASTM D1586": {
    code: "ASTM D1586",
    aliases: ["ASTM D1586", "SPT standard", "standard penetration test"],
    name: "Standard Test Method for Standard Penetration Test (SPT)",
    year: 2018, body: "ASTM International",
    scope: "Prosedur uji SPT di lapangan, koreksi N-value, interpretasi tanah.",
    type: "referensi", agents: ["geoteknik"],
  },
  "SNI 2827:2008": {
    code: "SNI 2827:2008",
    aliases: ["SNI 2827", "boring log", "soil investigation"],
    name: "Cara Uji Penetrasi Lapangan dengan SPT",
    year: 2008, body: "BSN",
    scope: "Prosedur uji SPT versi Indonesia, koreksi energi, interpretasi N60.",
    type: "wajib", agents: ["geoteknik"],
  },
  "SNI 8640:2018": {
    code: "SNI 8640:2018",
    aliases: ["SNI 8640", "soil classification"],
    name: "Klasifikasi untuk Tanah",
    year: 2018, body: "BSN",
    scope: "Sistem klasifikasi tanah USCS dan AASHTO versi Indonesia.",
    type: "wajib", agents: ["geoteknik"],
  },

  /* ── KONTRAK ─────────────────────────────────────────── */
  "FIDIC 1999": {
    code: "FIDIC 1999",
    aliases: ["FIDIC", "Red Book", "FIDIC Red", "FIDIC Silver", "FIDIC Yellow", "EPC Contract"],
    name: "FIDIC Conditions of Contract for Construction (Red Book 1999)",
    year: 1999, body: "FIDIC",
    scope: "Kondisi kontrak internasional: klaim, variasi, force majeure, dispute resolution.",
    type: "referensi", agents: ["kontrak"],
  },
  "Perpres 16/2018": {
    code: "Perpres 16/2018",
    aliases: ["Perpres 16", "Perpres No 16", "pengadaan barang jasa"],
    name: "Pengadaan Barang/Jasa Pemerintah",
    year: 2018, body: "Presiden RI",
    scope: "Prosedur pengadaan pemerintah: tender, kontrak, addendum, pemutusan kontrak.",
    type: "wajib", agents: ["kontrak"],
  },
  "UU 2/2017": {
    code: "UU 2/2017",
    aliases: ["UU Jasa Konstruksi", "UU No 2 2017", "UUJK"],
    name: "Undang-Undang Jasa Konstruksi",
    year: 2017, body: "DPR RI",
    scope: "Regulasi industri konstruksi Indonesia: perizinan, sertifikasi, tanggung jawab.",
    type: "wajib", agents: ["kontrak"],
  },
  "Permen PUPR 14/2020": {
    code: "Permen PUPR 14/2020",
    aliases: ["Permen PUPR 14", "standar kontrak konstruksi", "kontrak PUPR"],
    name: "Standar dan Pedoman Pengadaan Jasa Konstruksi Melalui Penyedia",
    year: 2020, body: "Kementerian PUPR",
    scope: "Dokumen kontrak standar PUPR: SPK, kontrak lump sum, kontrak unit price.",
    type: "wajib", agents: ["kontrak"],
  },

  /* ── PM ─────────────────────────────────────────────── */
  "PMBOK 7th": {
    code: "PMBOK 7th",
    aliases: ["PMBOK", "PMBOK Guide", "PMI", "PMBOK 7"],
    name: "A Guide to the Project Management Body of Knowledge, 7th Edition",
    year: 2021, body: "PMI",
    scope: "Prinsip manajemen proyek, domain kinerja, model, metode, artefak.",
    type: "referensi", agents: ["pm"],
  },
  "ISO 21500:2021": {
    code: "ISO 21500:2021",
    aliases: ["ISO 21500", "SNI ISO 21500"],
    name: "Project, Programme and Portfolio Management — Context and Concepts",
    year: 2021, body: "ISO",
    scope: "Konsep manajemen proyek internasional: WBS, jadwal, EVM, risiko.",
    type: "disarankan", agents: ["pm"],
  },
  "Permen PUPR 22/2018": {
    code: "Permen PUPR 22/2018",
    aliases: ["Permen PUPR 22", "BIM Indonesia", "BIM PUPR"],
    name: "Pembangunan Bangunan Gedung Negara",
    year: 2018, body: "Kementerian PUPR",
    scope: "Persyaratan BIM untuk gedung negara, sistem informasi manajemen proyek.",
    type: "wajib", agents: ["pm", "bim"],
  },

  /* ── RAB ─────────────────────────────────────────────── */
  "SNI Analisa 2022": {
    code: "SNI Analisa 2022",
    aliases: ["SNI analisa harga", "AHSP 2022", "analisa harga satuan", "AHSP"],
    name: "Analisa Harga Satuan Pekerjaan (AHSP) Bidang Pekerjaan Umum 2022",
    year: 2022, body: "Kementerian PUPR",
    scope: "Koefisien material, tenaga kerja, alat untuk pekerjaan beton, batu, baja, dll.",
    type: "wajib", agents: ["rab"],
  },
  "HSPK 2024": {
    code: "HSPK 2024",
    aliases: ["HSPK", "harga satuan pokok kegiatan", "HSP"],
    name: "Harga Satuan Pokok Kegiatan (HSPK) Kota/Kabupaten",
    year: 2024, body: "Pemda / Kementerian PUPR",
    scope: "Harga satuan dasar material, upah tenaga, dan alat per wilayah.",
    type: "referensi", agents: ["rab"],
  },
  "Permen PUPR 1/2022": {
    code: "Permen PUPR 1/2022",
    aliases: ["Permen PUPR 1/2022", "pedoman biaya konstruksi"],
    name: "Pedoman Penyusunan Perkiraan Biaya Pekerjaan Konstruksi",
    year: 2022, body: "Kementerian PUPR",
    scope: "Metodologi RAB, EE (Engineer's Estimate), dan dokumen anggaran konstruksi.",
    type: "wajib", agents: ["rab"],
  },

  /* ── BIM ─────────────────────────────────────────────── */
  "ISO 19650": {
    code: "ISO 19650",
    aliases: ["ISO 19650", "ISO 19650-1", "ISO 19650-2", "BIM standard"],
    name: "Organization and Digitization of Information about Buildings — BIM",
    year: 2018, body: "ISO",
    scope: "Manajemen informasi berbasis BIM: CDE, alur kerja, IFC, BEP, EIR.",
    type: "disarankan", agents: ["bim"],
  },
  "LOD Specification": {
    code: "LOD Specification",
    aliases: ["LOD", "Level of Development", "LOD 100", "LOD 200", "LOD 300", "LOD 400", "LOD 500"],
    name: "Level of Development (LOD) Specification",
    year: 2021, body: "BIMForum / AIA",
    scope: "Definisi level detail model BIM dari LOD 100 hingga LOD 500 per elemen.",
    type: "referensi", agents: ["bim"],
  },
  "IFC Standard": {
    code: "IFC Standard",
    aliases: ["IFC", "Industry Foundation Classes", "IFC4"],
    name: "Industry Foundation Classes (IFC) Open Standard",
    year: 2018, body: "buildingSMART",
    scope: "Format terbuka pertukaran data BIM antar software (Revit, ArchiCAD, Tekla, dll.).",
    type: "referensi", agents: ["bim"],
  },
};

/* ── Citation extractor ─────────────────────────────── */
export interface Citation {
  standard: Standard;
  startIdx: number;
  matchedAlias: string;
}

export function extractCitations(text: string): Citation[] {
  const found: Citation[] = [];
  const seen = new Set<string>();

  for (const [key, std] of Object.entries(STANDARDS)) {
    const allAliases = [std.code, ...std.aliases];
    for (const alias of allAliases) {
      // Escape regex special chars
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ standard: std, startIdx: match.index, matchedAlias: match[0] });
        }
      }
    }
  }

  return found.sort((a, b) => a.startIdx - b.startIdx);
}

export const TYPE_CONFIG: Record<StandardType, { label: string; color: string; dot: string }> = {
  wajib:       { label: "Wajib", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50", dot: "bg-red-500" },
  disarankan:  { label: "Disarankan", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50", dot: "bg-amber-500" },
  referensi:   { label: "Referensi", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50", dot: "bg-blue-500" },
};
