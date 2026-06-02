import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
import path from 'path'
import fs from 'fs'

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }
  return _supabase
}

const BUCKET = process.env.SUPABASE_BUCKET ?? 'clientportal365'
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads')

function localUpload(buffer: Buffer, originalName: string, folder: string): string {
  const dir = path.join(LOCAL_UPLOADS_DIR, folder)
  fs.mkdirSync(dir, { recursive: true })
  const ext = path.extname(originalName)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  fs.writeFileSync(path.join(dir, filename), buffer)
  const serverUrl = process.env.SERVER_URL ?? `http://localhost:${process.env.SERVER_PORT ?? 3001}`
  return `${serverUrl}/uploads/${folder}/${filename}`
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = 'uploads'
): Promise<string> {
  if (!process.env.SUPABASE_URL) {
    logger.warn('[storage] Supabase not configured — using local disk storage')
    return localUpload(buffer, originalName, folder)
  }

  const ext = path.extname(originalName)
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

  const { error } = await getSupabase().storage.from(BUCKET).upload(key, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    logger.error('[storage] Upload failed', { error })
    throw new Error('File upload failed')
  }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

export async function deleteFile(publicUrl: string): Promise<void> {
  if (!process.env.SUPABASE_URL) {
    try {
      const url = new URL(publicUrl)
      const filePath = path.join(LOCAL_UPLOADS_DIR, url.pathname.replace('/uploads/', ''))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch { /* ignore */ }
    return
  }
  const url = new URL(publicUrl)
  const key = url.pathname.split(`/${BUCKET}/`)[1]
  if (!key) return
  const { error } = await getSupabase().storage.from(BUCKET).remove([key])
  if (error) logger.warn('[storage] Delete failed', { error })
}
