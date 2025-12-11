import { supabase } from '@/lib/supabase'

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

class AttachmentsService {
  private bucketName = 'attachments'

  /**
   * Upload a file to Supabase Storage
   * @param file - The file to upload
   * @param orgId - Organization ID for file organization
   * @param taskId - Task ID for file organization
   * @returns Attachment object with public URL
   */
  async upload(file: File, orgId: string, taskId: string): Promise<Attachment> {
    // Create unique file path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${orgId}/${taskId}/${timestamp}_${sanitizedName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path)

    return {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date(),
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - The storage path of the file
   */
  async delete(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  /**
   * Get public URL for a file
   * @param filePath - The storage path of the file
   * @returns Public URL for the file
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }
}

export const attachmentsService = new AttachmentsService()
