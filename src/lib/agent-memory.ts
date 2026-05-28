/* Agent Memory System — localStorage-backed long-term project memory
   Inspired by: "Memory allows agents to retain domain-specific information
   across interactions." — Event-Driven Design for Agents, Confluent 2025 */

export interface MemoryFact {
  key: string;
  label: string;
  value: string;
  icon: string;
  addedAt: number;
  source: "auto" | "manual";
}

const STORAGE_KEY = "chaesa_agent_memory_v2";

export function loadMemory(): MemoryFact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveMemory(facts: MemoryFact[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(facts)); } catch {}
}

export function clearMemory(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function deleteFact(facts: MemoryFact[], key: string): MemoryFact[] {
  return facts.filter(f => f.key !== key);
}

/* Auto-extract facts from user messages using pattern matching */
export function extractFacts(text: string): MemoryFact[] {
  const facts: MemoryFact[] = [];
  const now = Date.now();

  const KOTA = ["Jakarta","Surabaya","Bandung","Medan","Semarang","Yogyakarta","Makassar","Palembang","Batam","Bekasi","Depok","Tangerang","Bogor","Balikpapan","Pekanbaru","Malang","Denpasar","Manado","Kupang","Ambon"];
  const lokasiMatch = text.match(new RegExp(`di\\s+(${KOTA.join("|")})`, "i"));
  if (lokasiMatch) facts.push({ key:"lokasi", label:"Lokasi Proyek", value:lokasiMatch[1], icon:"📍", addedAt:now, source:"auto" });

  const lantaiMatch = text.match(/(\d+)\s*lantai/i);
  if (lantaiMatch) facts.push({ key:"lantai", label:"Jumlah Lantai", value:lantaiMatch[1]+" lantai", icon:"🏢", addedAt:now, source:"auto" });

  const betonMatch = text.match(/fc['\s]*[=:]\s*(\d+)\s*(?:MPa|mpa)/i);
  if (betonMatch) facts.push({ key:"beton", label:"Mutu Beton", value:"fc'="+betonMatch[1]+" MPa", icon:"🧱", addedAt:now, source:"auto" });

  const bajaPMatch = text.match(/fy['\s]*[=:]\s*(\d+)\s*(?:MPa|mpa)/i);
  if (bajaPMatch) facts.push({ key:"baja", label:"Mutu Baja", value:"fy="+bajaPMatch[1]+" MPa", icon:"⚙️", addedAt:now, source:"auto" });

  const tahunMatch = text.match(/tahun\s*(20\d{2})/i);
  if (tahunMatch) facts.push({ key:"tahun", label:"Tahun Anggaran", value:tahunMatch[1], icon:"📅", addedAt:now, source:"auto" });

  const namaMatch = text.match(/proyek\s+([A-Z][A-Za-z\s]+?)(?:\s+di|\s+untuk|\s+senilai|$)/);
  if (namaMatch && namaMatch[1].length > 3) facts.push({ key:"nama", label:"Nama Proyek", value:namaMatch[1].trim(), icon:"📋", addedAt:now, source:"auto" });

  if (/gedung\s*(?:perkantoran|kantor)/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Gedung Perkantoran", icon:"🏗️", addedAt:now, source:"auto" });
  else if (/apartemen|hunian|residensial/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Apartemen/Hunian", icon:"🏠", addedAt:now, source:"auto" });
  else if (/jalan\s*tol|jalan\s*nasional|infrastruktur/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Infrastruktur Jalan", icon:"🛣️", addedAt:now, source:"auto" });
  else if (/jembatan/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Jembatan", icon:"🌉", addedAt:now, source:"auto" });
  else if (/ruko|retail/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Ruko/Retail", icon:"🏪", addedAt:now, source:"auto" });
  else if (/rumah\s*sakit|rs\b/i.test(text)) facts.push({ key:"jenis", label:"Jenis Proyek", value:"Rumah Sakit", icon:"🏥", addedAt:now, source:"auto" });

  const luas = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:m²|m2|meter\s*persegi)/i);
  if (luas) facts.push({ key:"luas", label:"Luas Area", value:luas[1]+" m²", icon:"📐", addedAt:now, source:"auto" });

  const budget = text.match(/Rp\s*([\d.,]+\s*(?:juta|miliar|M|T|ribu)?)/i);
  if (budget) facts.push({ key:"budget", label:"Estimasi Anggaran", value:"Rp "+budget[1], icon:"💰", addedAt:now, source:"auto" });

  const kontrak = text.match(/(FIDIC|SPK|kontrak\s+lump\s*sum|kontrak\s+unit\s*price)/i);
  if (kontrak) facts.push({ key:"kontrak", label:"Jenis Kontrak", value:kontrak[1], icon:"📜", addedAt:now, source:"auto" });

  return facts;
}

export function mergeMemory(existing: MemoryFact[], newFacts: MemoryFact[]): MemoryFact[] {
  const map = new Map(existing.map(f => [f.key, f]));
  for (const f of newFacts) {
    map.set(f.key, f); // newer overwrites
  }
  return Array.from(map.values());
}

export function memoryToContext(facts: MemoryFact[]): string {
  if (facts.length === 0) return "";
  return `[KONTEKS PROYEK PENGGUNA: ${facts.map(f => `${f.label}=${f.value}`).join(", ")}]`;
}
