import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gjhxgiyahvbxunqhliol.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaHhnaXlhaHZieHVucWhsaW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjU0NjQsImV4cCI6MjA3MDI0MTQ2NH0.wtsHaN7PR9bp1Ssq0qGgLWAeYdIObcabCQZPtj0T9xY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Upload file to Supabase Storage
export const uploadFile = async (file, folder = 'certificates') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(filePath, file)

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        path: filePath,
        publicUrl: publicUrl,
        fileName: fileName
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}