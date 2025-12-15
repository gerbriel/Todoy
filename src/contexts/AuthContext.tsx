import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as AuthUser } from '@supabase/supabase-js'
import { User, Organization, OrgMember } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface OrganizationData {
  option: 'create' | 'join' | 'solo'
  orgName?: string
  orgDescription?: string
  workspaceName?: string
  inviteCode?: string
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  orgMembers: OrgMember[]
  users: User[]
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, organizationData: OrganizationData) => Promise<void>
  logout: () => void
  setOrganization: (org: Organization | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize auth state from Supabase session
  useEffect(() => {
    let mounted = true
    
    // Safety timeout in case queries hang
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false)
      }
    }, 10000) // 10 seconds max

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      if (session?.user) {
        loadUserData(session.user.id).catch(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      // Ignore INITIAL_SESSION and SIGNED_IN on page load
      // These happen before session is fully ready, causing query timeouts
      // Only rely on getSession() for initial load
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') return
      
      // Handle actual auth changes like SIGNED_OUT, TOKEN_REFRESHED
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setOrganization(null)
        setOrgMembers([])
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Load user profile and organization data
  const loadUserData = async (userId: string) => {
    try {
      console.log('[AuthContext] Loading user data for:', userId)
      
      // Create a timeout promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )

      // Load user profile with timeout
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data: profile, error: profileError } = await Promise.race([
        profileQuery,
        timeout
      ]) as any

      console.log('[AuthContext] Profile result:', { profile, profileError })

      if (profileError) {
        console.error('[AuthContext] Profile error:', profileError)
        // Don't sign out on errors - just show login screen
        setUser(null)
        setOrganization(null)
        setLoading(false)
        return
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          createdAt: profile.created_at,
        }
        setUser(userData)
        console.log('[AuthContext] User data set:', userData)

        // Load user's organization memberships (without JOIN to avoid RLS recursion)
        const { data: memberships, error: memberError } = await supabase
          .from('org_members')
          .select('*')
          .eq('user_id', userId)

        console.log('[AuthContext] Memberships result:', { memberships, memberError })

        if (memberships && memberships.length > 0) {
          // Use first org for now (TODO: support multiple orgs)
          const firstMembership = memberships[0]
          console.log('[AuthContext] First membership:', firstMembership)
          
          // Load organization separately to avoid RLS recursion issues
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', firstMembership.org_id)
            .single()

          console.log('[AuthContext] Organization result:', { orgData, orgError })

          if (orgData) {
            const org: Organization = {
              id: orgData.id,
              name: orgData.name,
              description: orgData.description || '',
              createdAt: orgData.created_at,
              ownerId: orgData.owner_id,
            }
            setOrganization(org)
            console.log('[AuthContext] Organization set:', org)

            // Load all org members using RPC function to bypass RLS
            const { data: allMembers } = await supabase
              .rpc('get_my_org_members')

            if (allMembers) {
              setOrgMembers(
                allMembers.map((m) => ({
                  id: m.id,
                  userId: m.user_id,
                  orgId: m.org_id,
                  role: m.role,
                  joinedAt: m.joined_at,
                }))
              )
            }
          }
        }
      }
    } catch (error) {
      // Log errors for debugging
      console.error('[AuthContext] Error in loadUserData:', error)
      setUser(null)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      // Check for pending invites for this email and auto-accept them
      console.log('[AuthContext] Checking for pending/accepted invites after login')
      
      const { data: pendingInvites } = await supabase
        .from('org_invites')
        .select('*')
        .eq('email', data.user.email)
        .in('status', ['pending', 'accepted'])  // Include already accepted invites
        .gt('expires_at', new Date().toISOString())
      
      if (pendingInvites && pendingInvites.length > 0) {
        console.log('[AuthContext] Found invites to process:', pendingInvites)
        
        for (const invite of pendingInvites) {
          try {
            // Check if user is already a member
            const { data: existing } = await supabase
              .from('org_members')
              .select('id')
              .eq('user_id', data.user.id)
              .eq('org_id', invite.org_id)
              .single()
            
            if (!existing) {
              // Add user to organization
              await supabase
                .from('org_members')
                .insert({
                  user_id: data.user.id,
                  org_id: invite.org_id,
                  role: invite.role,
                  joined_at: new Date().toISOString(),
                })
              
              console.log('[AuthContext] Added user to org:', invite.org_id)
            }
            
            // Mark invite as accepted if it wasn't already
            if (invite.status === 'pending') {
              await supabase
                .from('org_invites')
                .update({ status: 'accepted' })
                .eq('id', invite.id)
              
              console.log('[AuthContext] Invite marked as accepted:', invite.id)
            }
          } catch (err) {
            console.error('[AuthContext] Error processing invite:', err)
          }
        }
      }
      
      await loadUserData(data.user.id)
    }
  }

  const signup = async (email: string, password: string, name: string, organizationData: OrganizationData) => {
    // Sign up the user
    const redirectUrl = import.meta.env.PROD 
      ? 'https://gerbriel.github.io/Todoy' 
      : `${window.location.origin}/`
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: redirectUrl,
      },
    })

    if (signUpError) {
      throw new Error(signUpError.message)
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // Check if email confirmation is required
    if (authData.session === null) {
      // Email confirmation required - don't create org yet
      throw new Error('CONFIRM_EMAIL')
    }

    // If we have a session, user is confirmed - continue with org creation
    // Note: Profile is auto-created by database trigger

    // Create or join organization based on user's choice
    if (organizationData.option === 'create' || organizationData.option === 'solo') {
      // Create a new organization
      const orgName =
        organizationData.option === 'create'
          ? organizationData.orgName || 'My Organization'
          : organizationData.workspaceName || `${name}'s Workspace`

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          description: organizationData.orgDescription || (organizationData.option === 'solo' ? 'Personal workspace' : ''),
          owner_id: authData.user.id,
        })
        .select()
        .single()

      if (orgError) {
        throw new Error(orgError.message)
      }

      // Add user as owner/member
      const { error: memberError } = await supabase.from('org_members').insert({
        user_id: authData.user.id,
        org_id: org.id,
        role: 'owner',
      })

      if (memberError) {
        throw new Error(memberError.message)
      }
    } else if (organizationData.option === 'join') {
      // Join organization using invite code
      if (!organizationData.inviteCode) {
        throw new Error('Invite code is required')
      }

      // Find the invite by code
      const { data: inviteData, error: inviteError } = await supabase
        .from('org_invites')
        .select('*')
        .eq('invite_code', organizationData.inviteCode)
        .eq('status', 'pending')
        .single()

      if (inviteError || !inviteData) {
        throw new Error('Invalid or expired invite code')
      }

      // Check if invite is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        throw new Error('This invite code has expired')
      }

      // Check if the invite email matches (if specified)
      if (inviteData.email && authData.user.email !== inviteData.email) {
        throw new Error(`This invite is for ${inviteData.email}. Please sign up with that email.`)
      }

      // Add user as organization member
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          user_id: authData.user.id,
          org_id: inviteData.org_id,
          role: inviteData.role,
          joined_at: new Date().toISOString(),
        })

      if (memberError) {
        throw new Error(memberError.message)
      }

      // Mark invite as accepted
      await supabase
        .from('org_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteData.id)
    }

    // Check for pending invite from session storage (after invite link → signup flow)
    const pendingInviteId = sessionStorage.getItem('pendingInviteId')
    console.log('[AuthContext] Checking for pending invite:', { pendingInviteId })
    
    if (pendingInviteId) {
      sessionStorage.removeItem('pendingInviteId')
      sessionStorage.removeItem('pendingInviteEmail')
      
      try {
        console.log('[AuthContext] Processing pending invite:', pendingInviteId)
        
        // Get the invite
        const { data: inviteData, error: inviteError } = await supabase
          .from('org_invites')
          .select('*')
          .eq('id', pendingInviteId)
          .eq('status', 'pending')
          .single()

        console.log('[AuthContext] Invite lookup result:', { inviteData, inviteError })

        if (!inviteError && inviteData) {
          // Check if expired
          if (new Date(inviteData.expires_at) > new Date()) {
            console.log('[AuthContext] Adding user to organization:', {
              userId: authData.user.id,
              orgId: inviteData.org_id,
              role: inviteData.role
            })
            
            // Add user to organization
            const { error: memberError } = await supabase
              .from('org_members')
              .insert({
                user_id: authData.user.id,
                org_id: inviteData.org_id,
                role: inviteData.role,
                joined_at: new Date().toISOString(),
              })

            if (memberError) {
              console.error('[AuthContext] Error adding to org_members:', memberError)
            } else {
              console.log('[AuthContext] Successfully added to organization')
            }

            // Mark invite as accepted
            const { error: updateError } = await supabase
              .from('org_invites')
              .update({ status: 'accepted' })
              .eq('id', inviteData.id)

            if (updateError) {
              console.error('[AuthContext] Error updating invite status:', updateError)
            } else {
              console.log('[AuthContext] Invite marked as accepted')
            }
          } else {
            console.warn('[AuthContext] Invite has expired')
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error processing pending invite:', error)
      }
    }

    // Load user data
    await loadUserData(authData.user.id)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrganization(null)
    setOrgMembers([])
  }

  const handleSetOrganization = async (org: Organization | null) => {
    setOrganization(org)
    
    if (org && user) {
      // Load org members when switching organizations
      const { data: allMembers } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', org.id)

      if (allMembers) {
        setOrgMembers(
          allMembers.map((m) => ({
            id: m.id,
            userId: m.user_id,
            orgId: m.org_id,
            role: m.role,
            joinedAt: m.joined_at,
          }))
        )
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        orgMembers,
        users,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setOrganization: handleSetOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
