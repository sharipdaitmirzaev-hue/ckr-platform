/** Server-side MIME + extension allowlist for document uploads. */

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const ALLOWED_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

export function validateUploadFile(file: File): string | null {
  if (file.size <= 0) {
    return "Выберите файл для загрузки.";
  }
  if (file.size > 20 * 1024 * 1024) {
    return "Максимальный размер файла — 20 МБ.";
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) {
    return "Недопустимый тип файла. Разрешены PDF, Word, Excel и изображения.";
  }

  const mime = (file.type || "").toLowerCase();
  if (mime && !ALLOWED_MIME.has(mime)) {
    return "Недопустимый MIME-тип файла.";
  }

  return null;
}
