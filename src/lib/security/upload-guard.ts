/**
 * Server-side image upload guard.
 *
 * Never trust the Content-Type header or file extension — always inspect the
 * raw bytes with file-type to determine the actual MIME type.
 *
 * Pipeline for every uploaded image:
 *   1. Size check  — reject > MAX_BYTES before any processing
 *   2. MIME check  — read magic bytes; reject non-image or disallowed types
 *   3. EXIF strip  — run through sharp .rotate() which auto-orients and drops metadata
 *   4. Return safe buffer ready to upload to Supabase Storage
 */

import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB — matches MAX_IMAGE_SIZE_MB constant
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// ---------------------------------------------------------------------------
// UploadValidationError
// ---------------------------------------------------------------------------

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

// ---------------------------------------------------------------------------
// validateAndSanitiseImage
// ---------------------------------------------------------------------------
// Accepts a Buffer (read from the uploaded File), validates it, strips EXIF,
// and returns a safe buffer whose MIME type is confirmed.
//
// Usage in a Server Action:
//   const bytes  = await file.arrayBuffer();
//   const buffer = Buffer.from(bytes);
//   const safe   = await validateAndSanitiseImage(buffer, file.name);
//   // upload `safe` to Supabase Storage
// ---------------------------------------------------------------------------
export async function validateAndSanitiseImage(
  buffer: Buffer,
  filename: string
): Promise<Buffer> {
  // 1. Size check — bail early before any parsing overhead.
  if (buffer.byteLength > MAX_BYTES) {
    const mb = (buffer.byteLength / 1024 / 1024).toFixed(1);
    throw new UploadValidationError(
      `"${filename}" is ${mb} MB — images must be under 5 MB.`
    );
  }

  // 2. MIME check — read actual magic bytes, ignore declared Content-Type.
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    throw new UploadValidationError(
      `"${filename}" could not be identified as an image. Use JPEG, PNG, or WebP.`
    );
  }

  if (!ALLOWED_MIME.has(detected.mime)) {
    throw new UploadValidationError(
      `"${filename}" is a ${detected.mime} file — only JPEG, PNG, and WebP are allowed.`
    );
  }

  // 3. Strip EXIF / metadata.
  //    .rotate() with no argument applies auto-orientation from EXIF and then
  //    discards all metadata (GPS, camera model, timestamps, thumbnails).
  //    We re-encode to the original format to preserve the declared type.
  let safeBuffer: Buffer;

  try {
    const processor = sharp(buffer).rotate(); // auto-orient + strip metadata

    switch (detected.mime) {
      case "image/jpeg":
        safeBuffer = await processor.jpeg({ quality: 90 }).toBuffer();
        break;
      case "image/png":
        safeBuffer = await processor.png({ compressionLevel: 8 }).toBuffer();
        break;
      case "image/webp":
        safeBuffer = await processor.webp({ quality: 90 }).toBuffer();
        break;
      default:
        // Unreachable given the ALLOWED_MIME guard above, but satisfies TS.
        throw new UploadValidationError(`Unsupported image type: ${detected.mime}`);
    }
  } catch (err) {
    if (err instanceof UploadValidationError) throw err;
    // sharp failed — file is likely corrupt.
    throw new UploadValidationError(
      `"${filename}" could not be processed. The file may be corrupt.`
    );
  }

  return safeBuffer;
}
