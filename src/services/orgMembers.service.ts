import { supabase } from '@/lib/supabase'
import { OrgMember } from '@/lib/types'

export const orgMembersService = {
  async getByOrg(orgId: string): Promise<OrgMember[]> {
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)

    if (error) throw error

    return data.map(m => ({
      id: m.id,
      userId: m.user_id,
      orgId: m.org_id,
      role: m.role as 'owner' | 'admin' | 'member',
      joinedAt: m.joined_at,
    }))
  },

  async updateRole(id: string, role: 'owner' | 'admin' | 'member'): Promise<OrgMember> {
    const { data, error } = await supabase
      .from('org_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      orgId: data.org_id,
      role: data.role as 'owner' | 'admin' | 'member',
      joinedAt: data.joined_at,
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
