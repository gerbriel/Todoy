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
   * Subscribe to real-time changes for a specific campaign
   */
  subscribe(campaignId: string, callback: (lists: List[]) => void) {
    const channel = supabase
      .channel(`lists-changes-${campaignId}`)
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

  /**
   * Subscribe to all lists for an organization (across all campaigns)
   */
  subscribeAll(orgId: string, callback: (lists: List[]) => void) {
    const channel = supabase
      .channel(`lists-org-changes-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
        },
        async () => {
          // Load lists for all campaigns in this org
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id')
            .eq('org_id', orgId)
          
          if (campaigns) {
            const listPromises = campaigns.map(c => this.getByCampaign(c.id))
            const listArrays = await Promise.all(listPromises)
            const allLists = listArrays.flat()
            callback(allLists)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Duplicate a list as a template with a new name and optional new campaign
   */
  async duplicate(
    listId: string, 
    newTitle: string, 
    targetCampaignId?: string
  ): Promise<List> {
    try {
      // Get the original list
      const { data: originalList, error: fetchError } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (fetchError) throw fetchError

      // Use target campaign or keep same campaign
      const campaignId = targetCampaignId || originalList.campaign_id

      // Create new list
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert({
          title: newTitle,
          campaign_id: campaignId,
          order: originalList.order,
        })
        .select()
        .single()

      if (createError) throw createError

      // Get all tasks from the original list
      const { data: originalTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('list_id', listId)
        .order('order', { ascending: true })

      if (originalTasks && originalTasks.length > 0) {
        // Duplicate each task (without dates, comments, attachments, labels)
        const newTasks = originalTasks.map(task => ({
          title: task.title,
          description: task.description || '',
          list_id: newList.id,
          campaign_id: campaignId,
          order: task.order,
          completed: false,
          // Explicitly exclude: due_date, start_date, assigned_to, labels, priority, comments, attachments
        }))

        await supabase.from('tasks').insert(newTasks)
      }

      return {
        ...newList,
        campaignId: newList.campaign_id,
        taskIds: [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to duplicate list'))
    }
  },
}
