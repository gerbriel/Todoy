import { supabase, handleSupabaseError } from '../lib/supabase'
import { Project } from '../lib/types'

export const projectsService = {
  /**
   * Get all projects for an organization
   */
  async getAll(orgId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          stage_dates (*),
          project_assignees (user_id)
        `)
        .eq('org_id', orgId)
        .eq('archived', false)
        .order('order', { ascending: true })

      if (error) throw error

      // Transform the data to match our existing Project type
      return (data || []).map(project => ({
        ...project,
        createdAt: project.created_at,
        stageDates: (project.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
        assignedTo: project.project_assignees?.map((a: any) => a.user_id) || [],
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch projects'))
    }
  },

  /**
   * Get all archived projects for an organization
   */
  async getAllArchived(orgId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          stage_dates (*),
          project_assignees (user_id)
        `)
        .eq('org_id', orgId)
        .eq('archived', true)
        .order('order', { ascending: true })

      if (error) throw error

      // Transform the data to match our existing Project type
      return (data || []).map(project => ({
        ...project,
        createdAt: project.created_at,
        stageDates: (project.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false
        })),
        archived: project.archived || false,
        assignedTo: project.project_assignees?.map((a: any) => a.user_id) || [],
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch archived projects'))
    }
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          stage_dates (*),
          project_assignees (user_id)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      return {
        ...data,
        createdAt: data.created_at,
        archived: data.archived || false,
        stageDates: (data.stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
        assignedTo: data.project_assignees?.map((a: any) => a.user_id) || [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch project'))
    }
  },

  /**
   * Create a new project
   */
  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: project.title,
          description: project.description,
          order: project.order,
          org_id: project.orgId,
          owner_id: project.ownerId,
          visibility: project.visibility || 'organization',
          completed: project.completed || false,
          archived: project.archived || false,
        })
        .select()
        .single()

      if (error) throw error

      // Handle assigned users
      if (project.assignedTo && project.assignedTo.length > 0) {
        await this.updateAssignees(data.id, project.assignedTo)
      }

      // Handle stage dates
      if (project.stageDates && project.stageDates.length > 0) {
        await this.updateStageDates(data.id, project.stageDates)
      }

      return {
        ...data,
        createdAt: data.created_at,
        stageDates: project.stageDates || [],
        assignedTo: project.assignedTo || [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to create project'))
    }
  },

  /**
   * Update an existing project
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      // Build update object only with provided fields
      const updateData: any = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.order !== undefined) updateData.order = updates.order
      if (updates.completed !== undefined) updateData.completed = updates.completed
      if (updates.archived !== undefined) updateData.archived = updates.archived
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility

      // Only update main fields if there are any changes
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id)

        if (error) throw error
      }

      // Handle assigned users if provided
      if (updates.assignedTo !== undefined) {
        await this.updateAssignees(id, updates.assignedTo)
      }

      // Handle stage dates if provided
      if (updates.stageDates !== undefined) {
        await this.updateStageDates(id, updates.stageDates)
      }

      // Fetch updated project with relations
      return await this.getById(id) as Project
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update project'))
    }
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to delete project'))
    }
  },

  /**
   * Update project assignees
   */
  async updateAssignees(projectId: string, userIds: string[]): Promise<void> {
    try {
      // Delete existing assignees
      await supabase
        .from('project_assignees')
        .delete()
        .eq('project_id', projectId)

      // Insert new assignees
      if (userIds.length > 0) {
        const { error } = await supabase
          .from('project_assignees')
          .insert(
            userIds.map(userId => ({
              project_id: projectId,
              user_id: userId,
            }))
          )

        if (error) throw error
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update project assignees'))
    }
  },

  /**
   * Update project stage dates
   */
  async updateStageDates(projectId: string, stageDates: any[]): Promise<void> {
    try {
      // Delete existing stage dates
      await supabase
        .from('stage_dates')
        .delete()
        .eq('project_id', projectId)

      // Insert new stage dates
      if (stageDates.length > 0) {
        const { error } = await supabase
          .from('stage_dates')
          .insert(
            stageDates.map(stage => ({
              project_id: projectId,
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
   * Subscribe to real-time changes for projects in an organization
   */
  subscribe(orgId: string, callback: (projects: Project[]) => void) {
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `org_id=eq.${orgId}`,
        },
        async () => {
          // Refetch all projects when any change occurs
          const projects = await this.getAll(orgId)
          callback(projects)
        }
      )
      .subscribe()

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
