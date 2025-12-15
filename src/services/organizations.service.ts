import { supabase } from '@/lib/supabase'
import { Organization } from '@/lib/types'

export const organizationsService = {
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      createdAt: data.created_at,
      ownerId: data.owner_id,
    }
  },

  async update(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        description: updates.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      createdAt: data.created_at,
      ownerId: data.owner_id,
    }
  },
}
