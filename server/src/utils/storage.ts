import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
import path from 'path'

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

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = 'uploads'
): Promise<string> {
  if (!process.env.SUPABASE_URL) throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.')
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
  if (!process.env.SUPABASE_URL) return
  const url = new URL(publicUrl)
  const key = url.pathname.split(`/${BUCKET}/`)[1]
  if (!key) return
  const { error } = await getSupabase().storage.from(BUCKET).remove([key])
  if (error) logger.warn('[storage] Delete failed', { error })
}
