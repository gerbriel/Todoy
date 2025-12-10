import { supabase, handleSupabaseError } from '../lib/supabase'
import { Label } from '../lib/types'

export const labelsService = {
  /**
   * Get all labels for an organization
   */
  async getByOrg(orgId: string): Promise<Label[]> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('org_id', orgId)

      if (error) throw error

      // Transform to match existing type (without orgId)
      return (data || []).map(({ org_id, ...label }) => label)
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch labels'))
    }
  },

  /**
   * Create a new label
   */
  async create(label: Omit<Label, 'id'>, orgId: string): Promise<Label> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({
          name: label.name,
          color: label.color,
          org_id: orgId,
        })
        .select()
        .single()

      if (error) throw error

      const { org_id, ...result } = data
      return result
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to create label'))
    }
  },

  /**
   * Update an existing label
   */
  async update(id: string, updates: Partial<Label>): Promise<Label> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.color && { color: updates.color }),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { org_id, ...result } = data
      return result
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update label'))
    }
  },

  /**
   * Delete a label
   */
  async delete(id: string): Promise<void> {
    try {
      const { error} = await supabase
        .from('labels')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to delete label'))
    }
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe(orgId: string, callback: (labels: Label[]) => void) {
    const channel = supabase
      .channel('labels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels',
          filter: `org_id=eq.${orgId}`,
        },
        async () => {
          const labels = await this.getByOrg(orgId)
          callback(labels)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
