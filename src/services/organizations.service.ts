import { supabase } from '@/lib/supabase'
import { Organization } from '@/lib/types'

export const organizationsService = {
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
