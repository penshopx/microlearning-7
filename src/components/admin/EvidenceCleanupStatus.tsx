import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MissionCleanupHealth } from "@/lib/mission-cleanup-health";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EvidenceCleanupStatus() {
  const [status, setStatus] = useState<MissionCleanupHealth | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    if (isActive()) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const response = await fetch("/api/admin/evidence-cleanup", {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Unavailable");
      const data: MissionCleanupHealth = await response.json();
      if (isActive()) { setStatus(data); setError(false); }
    } catch {
      if (isActive()) { setStatus(null); setError(true); }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const check = () => { void load(() => active); };
    check();
    const interval = setInterval(check, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, [load]);
  const warning = status && (status.overdueCount > 0 || status.repeatedFailureCount > 0);
  return (
    <Card className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">Pembersihan file bukti</h2>
      <p className="text-sm text-muted-foreground">
        Peringatan jika tertunda ≥24 jam sejak layak dihapus, atau ≥3 kegagalan selama ≥10 menit.
        Laporan per file dibatasi satu per 5 menit.
      </p>
      <div role={warning || error ? "alert" : "status"} aria-live="polite">
        {error ? <p>Status tidak tersedia. Jangan anggap antrean sehat; coba periksa kembali.</p>
          : status ? <>
            <p className={warning ? "font-semibold text-amber-700 dark:text-amber-300" : "font-semibold"}>
              {warning ? "Pembersihan bukti perlu diperiksa" : "Tidak ada peringatan pembersihan"}
            </p>
            <p className="text-sm">Menunggu: {status.pendingCount} · Terlambat: {status.overdueCount} · Kegagalan berulang: {status.repeatedFailureCount}</p>
            <p className="text-sm">Tertua: {status.oldestPendingAt ? new Date(status.oldestPendingAt).toLocaleString("id-ID") : "—"}</p>
            <p className="text-xs text-muted-foreground">Diperiksa: {new Date(status.checkedAt).toLocaleString("id-ID")}</p>
          </> : <p>Memuat status…</p>}
      </div>
      <p className="text-sm text-muted-foreground">
        Retry berjalan saat peserta membuka halaman kursus, bukan lewat pekerja latar otomatis.
        Jika ada peringatan, periksa ketersediaan Storage dan kebijakan penghapusan.
        Kegagalan dilaporkan klien; status ini bukan konfirmasi gangguan Storage.
        File yang berhasil dihapus otomatis keluar dari hitungan. Tidak ada isi atau path bukti yang ditampilkan.
      </p>
      <Button variant="outline" disabled={loading} onClick={() => void load()}>
        {loading ? "Memeriksa…" : "Periksa kembali"}
      </Button>
    </Card>
  );
}
