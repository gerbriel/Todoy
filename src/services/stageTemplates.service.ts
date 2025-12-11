import { supabase } from '@/lib/supabase'
import { StageTemplate } from '@/lib/types'

export const stageTemplatesService = {
  async getAll(orgId?: string): Promise<StageTemplate[]> {
    try {
      let query = supabase
        .from('stage_templates')
        .select('*')

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query

      if (error) throw error

      // Map database columns to app interface
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        color: item.color || '#6366f1',
        order: item.order ?? 0,
        createdBy: item.created_by,
        orgId: item.org_id,
      })).sort((a, b) => a.order - b.order)
    } catch (error) {
      console.error('Error fetching stage templates:', error)
      return []
    }
  },

  async create(template: Omit<StageTemplate, 'id'>): Promise<StageTemplate> {
    const { data, error } = await supabase
      .from('stage_templates')
      .insert({
        name: template.name,
        color: template.color,
        order: template.order,
        created_by: template.createdBy,
        org_id: template.orgId,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      color: data.color || '#6366f1',
      order: data.order || 0,
      createdBy: data.created_by,
      orgId: data.org_id,
    }
  },

  async update(id: string, updates: Partial<StageTemplate>): Promise<void> {
    const updateData: Record<string, unknown> = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.order !== undefined) updateData.order = updates.order

    const { error } = await supabase
      .from('stage_templates')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('stage_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  subscribeToChanges(orgId: string | undefined, callback: () => void) {
    const channel = supabase
      .channel('stage_templates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_templates',
          filter: orgId ? `org_id=eq.${orgId}` : undefined,
        },
        () => {
          callback()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
