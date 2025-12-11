import { supabase, handleSupabaseError } from '../lib/supabase'
import { Campaign } from '../lib/types'

export const campaignsService = {
  /**
   * Get all campaigns for an organization
   */
  async getAll(orgId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          stage_dates (*)
        `)
        .eq('org_id', orgId)
        .eq('archived', false)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(campaign => ({
        ...campaign,
        createdAt: campaign.created_at,
        projectId: campaign.project_id,
        campaignType: campaign.campaign_type,
        planningStartDate: campaign.planning_start_date,
        launchDate: campaign.launch_date,
        endDate: campaign.end_date,
        followUpDate: campaign.follow_up_date,
        stageDates: (campaign.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch campaigns'))
    }
  },

  /**
   * Get all archived campaigns for an organization
   */
  async getAllArchived(orgId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          stage_dates (*)
        `)
        .eq('org_id', orgId)
        .eq('archived', true)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(campaign => ({
        ...campaign,
        createdAt: campaign.created_at,
        projectId: campaign.project_id,
        campaignType: campaign.campaign_type,
        planningStartDate: campaign.planning_start_date,
        launchDate: campaign.launch_date,
        endDate: campaign.end_date,
        followUpDate: campaign.follow_up_date,
        stageDates: (campaign.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch archived campaigns'))
    }
  },

  /**
   * Get campaigns for a specific project
   */
  async getByProject(projectId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          stage_dates (*)
        `)
        .eq('project_id', projectId)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(campaign => ({
        ...campaign,
        createdAt: campaign.created_at,
        projectId: campaign.project_id,
        campaignType: campaign.campaign_type,
        planningStartDate: campaign.planning_start_date,
        launchDate: campaign.launch_date,
        endDate: campaign.end_date,
        followUpDate: campaign.follow_up_date,
        stageDates: (campaign.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch campaigns'))
    }
  },

  /**
   * Create a new campaign
   */
  async create(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaign.title,
          description: campaign.description,
          order: campaign.order,
          project_id: campaign.projectId,
          org_id: campaign.orgId,
          campaign_type: campaign.campaignType,
          planning_start_date: campaign.planningStartDate,
          launch_date: campaign.launchDate,
          end_date: campaign.endDate,
          follow_up_date: campaign.followUpDate,
          completed: campaign.completed || false,
          archived: campaign.archived || false,
        })
        .select()
        .single()

      if (error) throw error

      // Handle stage dates
      if (campaign.stageDates && campaign.stageDates.length > 0) {
        await this.updateStageDates(data.id, campaign.stageDates)
      }

      return {
        ...data,
        createdAt: data.created_at,
        projectId: data.project_id,
        campaignType: data.campaign_type,
        planningStartDate: data.planning_start_date,
        launchDate: data.launch_date,
        endDate: data.end_date,
        followUpDate: data.follow_up_date,
        stageDates: campaign.stageDates || [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to create campaign'))
    }
  },

  /**
   * Update an existing campaign
   */
  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    try {
      // Build update object only with provided fields
      const updateData: any = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.order !== undefined) updateData.order = updates.order
      if (updates.campaignType !== undefined) updateData.campaign_type = updates.campaignType
      if (updates.planningStartDate !== undefined) updateData.planning_start_date = updates.planningStartDate
      if (updates.launchDate !== undefined) updateData.launch_date = updates.launchDate
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate
      if (updates.followUpDate !== undefined) updateData.follow_up_date = updates.followUpDate
      if (updates.completed !== undefined) updateData.completed = updates.completed
      if (updates.archived !== undefined) updateData.archived = updates.archived
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId

      // Only update main fields if there are any changes
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('campaigns')
          .update(updateData)
          .eq('id', id)

        if (error) throw error
      }

      // Handle stage dates if provided
      if (updates.stageDates !== undefined) {
        await this.updateStageDates(id, updates.stageDates)
      }

      // Fetch updated campaign with relations
      return await this.getById(id) as Campaign
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update campaign'))
    }
  },

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to delete campaign'))
    }
  },

  /**
   * Update campaign stage dates
   */
  async updateStageDates(campaignId: string, stageDates: any[]): Promise<void> {
    try {
      // Delete existing stage dates
      await supabase
        .from('stage_dates')
        .delete()
        .eq('campaign_id', campaignId)

      // Insert new stage dates
      if (stageDates.length > 0) {
        const { error } = await supabase
          .from('stage_dates')
          .insert(
            stageDates.map(stage => ({
              campaign_id: campaignId,
              stage_name: stage.stageName,
              start_date: stage.startDate,
              end_date: stage.endDate,
              color: stage.color,
              completed: stage.completed || false,
            }))
          )

        if (error) throw error
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update stage dates'))
    }
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe(orgId: string, callback: (campaigns: Campaign[]) => void) {
    const channel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `org_id=eq.${orgId}`,
        },
        async () => {
          const campaigns = await this.getAll(orgId)
          callback(campaigns)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
