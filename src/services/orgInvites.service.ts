import { supabase } from '@/lib/supabase'
import { OrgInvite } from '@/lib/types'

export const orgInvitesService = {
  async getByOrg(orgId: string): Promise<OrgInvite[]> {
    const { data, error } = await supabase
      .from('org_invites')
      .select('*')
      .eq('org_id', orgId)

    if (error) throw error

    return data.map(i => ({
      id: i.id,
      orgId: i.org_id,
      email: i.email,
      role: i.role as 'owner' | 'admin' | 'member',
      invitedBy: i.invited_by,
      invitedAt: i.invited_at,
      status: i.status as 'pending' | 'accepted' | 'declined' | 'expired',
      expiresAt: i.expires_at,
    }))
  },

  async create(invite: Omit<OrgInvite, 'id'>): Promise<OrgInvite> {
    // Generate a unique invite code
    const inviteCode = `${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`
    
    const { data, error} = await supabase
      .from('org_invites')
      .insert({
        org_id: invite.orgId,
        email: invite.email,
        role: invite.role,
        invited_by: invite.invitedBy,
        status: 'pending',
        expires_at: invite.expiresAt,
        invite_code: inviteCode,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      orgId: data.org_id,
      email: data.email,
      role: data.role as 'owner' | 'admin' | 'member',
      invitedBy: data.invited_by,
      invitedAt: data.invited_at,
      status: data.status as 'pending' | 'accepted' | 'declined' | 'expired',
      expiresAt: data.expires_at,
    }
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('org_invites')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getById(id: string): Promise<OrgInvite | null> {
    const { data, error } = await supabase
      .from('org_invites')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      orgId: data.org_id,
      email: data.email,
      role: data.role as 'owner' | 'admin' | 'member',
      invitedBy: data.invited_by,
      invitedAt: data.invited_at,
      status: data.status as 'pending' | 'accepted' | 'declined' | 'expired',
      expiresAt: data.expires_at,
    }
  },

  async accept(id: string): Promise<void> {
    const { error } = await supabase
      .from('org_invites')
      .update({ status: 'accepted' })
      .eq('id', id)

    if (error) throw error
  },

  subscribe(orgId: string, callback: (data: OrgInvite[]) => void): () => void {
    const channel = supabase
      .channel(`org_invites:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'org_invites',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          this.getByOrg(orgId).then(callback)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
