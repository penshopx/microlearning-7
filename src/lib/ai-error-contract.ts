export const AI_API_KEY_ERROR_CODE = "invalid_api_key" as const;
export const AI_API_KEY_ERROR_MESSAGE =
  "AI sedang tidak tersedia sementara karena kunci API provider tidak valid. Silakan coba lagi nanti. Jika Anda admin, buka /admin untuk memperbarui konfigurasi AI.";
export const AI_ADMIN_URL = "/admin";

export interface AIUnavailableDetails {
  code?: string;
  error?: string;
  adminUrl?: string;
}