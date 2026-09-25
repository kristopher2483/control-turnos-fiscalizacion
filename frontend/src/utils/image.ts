const MAX_DIMENSION_PX = 1600
const JPEG_QUALITY = 0.72

/**
 * Downscales and re-encodes a photo as JPEG before upload, so a typical multi-MB phone photo
 * shrinks to a few hundred KB — keeps evidence photos legible while stretching the free-tier
 * Supabase Storage quota much further. Falls back to the original file on any failure (unsupported
 * format, decode error) or if compression didn't actually shrink it, so a photo never gets blocked
 * by this step.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
