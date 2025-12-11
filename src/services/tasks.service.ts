import { supabase, handleSupabaseError } from '../lib/supabase'
import { Task } from '../lib/types'

export const tasksService = {
  /**
   * Get all tasks for a campaign
   */
  async getByCampaign(campaignId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignees (user_id),
          task_labels (label_id),
          task_stage_dates (*),
          subtasks (*),
          comments (*),
          attachments (*)
        `)
        .eq('campaign_id', campaignId)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(task => ({
        ...task,
        createdAt: task.created_at,
        listId: task.list_id,
        campaignId: task.campaign_id,
        dueDate: task.due_date,
        currentStage: task.current_stage,
        assignedTo: task.task_assignees?.map((a: any) => a.user_id) || [],
        labelIds: task.task_labels?.map((l: any) => l.label_id) || [],
        stageDates: (task.task_stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
        subtasks: task.subtasks || [],
        comments: task.comments || [],
        attachments: task.attachments || [],
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch tasks'))
    }
  },

  /**
   * Get all tasks for an organization
   */
  async getByOrg(orgId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          campaigns!inner(org_id),
          task_assignees (user_id),
          task_labels (label_id),
          task_stage_dates (*)
        `)
        .eq('campaigns.org_id', orgId)
        .order('order', { ascending: true })

      if (error) throw error

      return (data || []).map(task => ({
        ...task,
        createdAt: task.created_at,
        listId: task.list_id,
        campaignId: task.campaign_id,
        dueDate: task.due_date,
        currentStage: task.current_stage,
        assignedTo: task.task_assignees?.map((a: any) => a.user_id) || [],
        labelIds: task.task_labels?.map((l: any) => l.label_id) || [],
        stageDates: (task.task_stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
      }))
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch tasks'))
    }
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignees (user_id),
          task_labels (label_id),
          task_stage_dates (*),
          subtasks (*),
          comments (*),
          attachments (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        createdAt: data.created_at,
        listId: data.list_id,
        campaignId: data.campaign_id,
        dueDate: data.due_date,
        currentStage: data.current_stage,
        assignedTo: data.task_assignees?.map((a: any) => a.user_id) || [],
        labelIds: data.task_labels?.map((l: any) => l.label_id) || [],
        stageDates: (data.task_stage_dates || []).map((sd: any) => ({
          id: sd.id,
          stageName: sd.stage_name,
          startDate: sd.start_date,
          endDate: sd.end_date,
          color: sd.color,
          completed: sd.completed || false,
        })),
        subtasks: data.subtasks || [],
        comments: data.comments || [],
        attachments: data.attachments || [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to fetch task'))
    }
  },

  /**
   * Create a new task
   */
  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          list_id: task.listId,
          campaign_id: task.campaignId,
          order: task.order,
          due_date: task.dueDate,
          current_stage: task.currentStage,
          completed: task.completed || false,
        })
        .select()
        .single()

      if (error) throw error

      // Handle assigned users
      if (task.assignedTo && task.assignedTo.length > 0) {
        await this.updateAssignees(data.id, task.assignedTo)
      }

      // Handle labels
      if (task.labelIds && task.labelIds.length > 0) {
        await this.updateLabels(data.id, task.labelIds)
      }

      return {
        ...data,
        createdAt: data.created_at,
        listId: data.list_id,
        campaignId: data.campaign_id,
        dueDate: data.due_date,
        currentStage: data.current_stage,
        assignedTo: task.assignedTo || [],
        labelIds: task.labelIds || [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to create task'))
    }
  },

  /**
   * Update an existing task
   */
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      // Build update object only with provided fields
      const updateData: any = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.order !== undefined) updateData.order = updates.order
      if (updates.listId !== undefined) updateData.list_id = updates.listId
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
      if (updates.currentStage !== undefined) updateData.current_stage = updates.currentStage
      if (updates.completed !== undefined) updateData.completed = updates.completed

      // Only update main fields if there are any changes
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id)

        if (error) throw error
      }

      // Handle assigned users if provided
      if (updates.assignedTo !== undefined) {
        await this.updateAssignees(id, updates.assignedTo)
      }

      // Handle labels if provided
      if (updates.labelIds !== undefined) {
        await this.updateLabels(id, updates.labelIds)
      }

      // Fetch updated task with relations
      return await this.getById(id) as Task
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update task'))
    }
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to delete task'))
    }
  },

  /**
   * Update task assignees
   */
  async updateAssignees(taskId: string, userIds: string[]): Promise<void> {
    try {
      await supabase.from('task_assignees').delete().eq('task_id', taskId)

      if (userIds.length > 0) {
        const { error } = await supabase
          .from('task_assignees')
          .insert(userIds.map(userId => ({ task_id: taskId, user_id: userId })))

        if (error) throw error
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update task assignees'))
    }
  },

  /**
   * Update task labels
   */
  async updateLabels(taskId: string, labelIds: string[]): Promise<void> {
    try {
      await supabase.from('task_labels').delete().eq('task_id', taskId)

      if (labelIds.length > 0) {
        const { error } = await supabase
          .from('task_labels')
          .insert(labelIds.map(labelId => ({ task_id: taskId, label_id: labelId })))

        if (error) throw error
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to update task labels'))
    }
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe(campaignId: string, callback: (tasks: Task[]) => void) {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `campaign_id=eq.${campaignId}`,
        },
        async () => {
          const tasks = await this.getByCampaign(campaignId)
          callback(tasks)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Duplicate a task as a template with a new title and optional new list/campaign
   */
  async duplicate(
    taskId: string, 
    newTitle: string, 
    targetListId?: string,
    targetCampaignId?: string
  ): Promise<Task> {
    try {
      // Get the original task
      const originalTask = await this.getById(taskId)

      // Use target list/campaign or keep same
      const listId = targetListId || originalTask.listId
      const campaignId = targetCampaignId || originalTask.campaignId

      // Create new task (without dates, assignments, labels - fresh template)
      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: newTitle,
          description: originalTask.description,
          list_id: listId,
          campaign_id: campaignId,
          order: originalTask.order,
          due_date: null, // Reset for template
          current_stage: originalTask.currentStage,
          completed: false,
        })
        .select()
        .single()

      if (createError) throw createError

      // Optionally copy stage dates structure (but reset dates)
      if (originalTask.stageDates && originalTask.stageDates.length > 0) {
        const newStageDates = originalTask.stageDates.map(sd => ({
          task_id: newTask.id,
          stage_name: sd.stageName,
          start_date: null,
          end_date: null,
          color: sd.color,
          completed: false,
        }))

        await supabase.from('task_stage_dates').insert(newStageDates)
      }

      return {
        ...newTask,
        createdAt: newTask.created_at,
        listId: newTask.list_id,
        campaignId: newTask.campaign_id,
        dueDate: newTask.due_date,
        currentStage: newTask.current_stage,
        assignedTo: [],
        labelIds: [],
        stageDates: [],
        subtasks: [],
        comments: [],
        attachments: [],
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error, 'Failed to duplicate task'))
    }
  },
}
