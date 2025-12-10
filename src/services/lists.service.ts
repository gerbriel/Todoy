import { supabase, handleSupabaseError } from '../lib/supabase'
import { List } from '../lib/types'

export const listsService = {
  /**
   * Get all lists for a campaign
   */
  async getByCampaign(campaignId: string): Promise<List[]> {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(list => ({
        ...list,
        campaignId: list.campaign_id,
        taskIds: [], // Tasks are loaded separately
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch lists'))
    }
  },

  /**
   * Create a new list
   */
  async create(list: Omit<List, 'id' | 'taskIds'>): Promise<List> {
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          title: list.title,
          campaign_id: list.campaignId,
          order: list.order,
        })
        .select()
        .single()

      if (error) throw error

      return {
        ...data,
        campaignId: data.campaign_id,
        taskIds: [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to create list'))
    }
  },

  /**
   * Update an existing list
   */
  async update(id: string, updates: Partial<List>): Promise<List> {
    try {
      const { data, error } = await supabase
        .from('lists')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.order !== undefined && { order: updates.order }),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        ...data,
        campaignId: data.campaign_id,
        taskIds: [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update list'))
    }
  },

  /**
   * Delete a list
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to delete list'))
    }
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe(campaignId: string, callback: (lists: List[]) => void) {
    const channel = supabase
      .channel('lists-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `campaign_id=eq.${campaignId}`,
        },
        async () => {
          const lists = await this.getByCampaign(campaignId)
          callback(lists)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
