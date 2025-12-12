import { supabase, handleSupabaseError } from '../lib/supabase'
import { Campaign } from '../lib/types'
import { listsService } from './lists.service'
import { tasksService } from './tasks.service'

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
   * Get a single campaign by ID
   */
  async getById(id: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          stage_dates (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      return {
        ...data,
        createdAt: data.created_at,
        projectId: data.project_id,
        campaignType: data.campaign_type,
        planningStartDate: data.planning_start_date,
        launchDate: data.launch_date,
        endDate: data.end_date,
        followUpDate: data.follow_up_date,
        archived: data.archived || false,
        stageDates: (data.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch campaign'))
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

  /**
   * Duplicate a campaign as a template with a new name and optional new project
   */
  async duplicate(
    campaignId: string, 
    newName: string, 
    targetProjectId?: string
  ): Promise<Campaign> {
    try {
      // Get the original campaign
      const originalCampaign = await this.getById(campaignId)

      // Use target project or keep same project
      const projectId = targetProjectId || originalCampaign.projectId

      // Create new campaign with campaign_stage to satisfy RLS
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          title: newName,
          description: originalCampaign.description,
          project_id: projectId,
          org_id: originalCampaign.orgId,
          campaign_type: originalCampaign.campaignType || 'other',
          campaign_stage: originalCampaign.campaignStage || 'planning',
          planning_start_date: null, // Reset dates for template
          launch_date: null,
          end_date: null,
          follow_up_date: null,
          order: originalCampaign.order,
          completed: false,
          archived: false,
        })
        .select()
        .single()

      if (createError) throw createError

      // Copy stage dates if any
      if (originalCampaign.stageDates && originalCampaign.stageDates.length > 0) {
        const newStageDates = originalCampaign.stageDates.map(sd => ({
          campaign_id: newCampaign.id,
          stage_name: sd.stageName,
          start_date: null,
          end_date: null,
          color: sd.color,
          completed: false,
        }))

        await supabase.from('stage_dates').insert(newStageDates)
      }

      // Get all lists from the original campaign
      const { data: originalLists } = await supabase
        .from('lists')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order', { ascending: true })

      if (originalLists && originalLists.length > 0) {
        // Duplicate each list and its tasks
        for (const originalList of originalLists) {
          // Create new list
          const { data: newList } = await supabase
            .from('lists')
            .insert({
              title: originalList.title,
              campaign_id: newCampaign.id,
              order: originalList.order,
            })
            .select()
            .single()

          if (newList) {
            // Get all tasks from the original list
            const { data: originalTasks } = await supabase
              .from('tasks')
              .select('*')
              .eq('list_id', originalList.id)
              .order('order', { ascending: true })

            if (originalTasks && originalTasks.length > 0) {
              // Duplicate each task (without dates, comments, attachments, labels)
              const newTasks = originalTasks.map(task => ({
                title: task.title,
                description: task.description,
                list_id: newList.id,
                campaign_id: newCampaign.id,
                project_id: projectId,
                order: task.order,
                completed: false,
                // Explicitly exclude: due_date, start_date, assigned_to, labels, priority, comments, attachments
              }))

              await supabase.from('tasks').insert(newTasks)
            }
          }
        }
      }

      return {
        ...newCampaign,
        createdAt: newCampaign.created_at,
        projectId: newCampaign.project_id,
        orgId: newCampaign.org_id,
        campaignType: newCampaign.campaign_type,
        campaignStage: newCampaign.campaign_stage,
        planningStartDate: newCampaign.planning_start_date,
        launchDate: newCampaign.launch_date,
        endDate: newCampaign.end_date,
        followUpDate: newCampaign.follow_up_date,
        stageDates: [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to duplicate campaign'))
    }
  },
}
