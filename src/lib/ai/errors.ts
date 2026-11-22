/**
 * Ubah error mentah provider jadi kalimat yang bisa dipakai pengguna.
 * Kode dan isi respons tidak pernah ditampilkan; halaman pemanggil mencatatnya
 * ke konsol untuk diagnosis.
 */
export function humanError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "")
  const name = e instanceof Error ? e.name : ""

  if (/api key.*(belum|kosong)|belum diisi/i.test(raw)) {
    return "API key belum diisi. Buka Pengaturan > Cara mendapatkan API key untuk panduan tiap provider."
  }
  if (/401|unauthorized|invalid api key|incorrect api key/i.test(raw)) {
    return "API key ditolak provider. Periksa di menu Pengaturan, atau lihat panduan di Pengaturan > Cara mendapatkan API key."
  }
  if (/402|payment required|insufficient_quota|insufficient balance|saldo habis|kuota habis/i.test(raw)) {
    return "Kuota atau saldo provider habis. Isi saldo di akun provider, atau ganti provider di Pengaturan."
  }
  if (/403|forbidden|permission denied/i.test(raw)) {
    return "Provider menolak akses ke model ini. Periksa izin key di akun provider, atau ganti provider di Pengaturan."
  }
  if (/404|model.*not found|not found/i.test(raw)) {
    return "Model yang dipilih tidak tersedia di provider ini. Ganti provider di Pengaturan."
  }
  if (/413|too large|maximum file size|file too large/i.test(raw)) {
    return "File terlalu besar untuk diproses. Batasnya 25 MB."
  }
  if (/429|rate limit|too many requests/i.test(raw)) {
    return "Terlalu banyak permintaan ke provider. Tunggu sebentar lalu coba lagi."
  }
  if (/^5\d\d\b|internal server|bad gateway|service unavailable|gateway timeout|overloaded/i.test(raw)) {
    return "Server provider sedang bermasalah. Tunggu sebentar, lalu coba lagi."
  }
  if (/timeout|timed out|aborted|abort error|signal is aborted/i.test(raw)) {
    return "Provider tidak merespons tepat waktu. Coba lagi."
  }
  if (/failed to fetch|networkerror|load failed|cors/i.test(raw)) {
    return "Tidak bisa menghubungi provider. Periksa koneksi internet."
  }
  if (/ECONNREFUSED|ENOTFOUND|certificate/i.test(raw)) {
    return "Server provider tidak terjangkau. Coba lagi nanti."
  }
  if (/jawaban kosong|empty (response|content)/i.test(raw)) {
    return "Provider mengembalikan jawaban kosong. Coba lagi."
  }
  if (
    name === "ZodError" ||
    /unexpected token|invalid json|json parse|invalid_type|too_small|too_big|expected .* received/i.test(raw)
  ) {
    return "Provider mengembalikan jawaban yang tidak bisa dibaca. Coba lagi, biasanya percobaan kedua berhasil."
  }
  if (/invalid_request_error|unsupported_|json_validate_failed|too many states/i.test(raw)) {
    return "Provider menolak format permintaan ini. Mindo sudah mencoba tanpa paksaan format; kalau tetap gagal, ganti provider di Pengaturan."
  }
  return "Proses gagal. Coba lagi. Kalau tetap gagal, ganti provider di Pengaturan."
}
