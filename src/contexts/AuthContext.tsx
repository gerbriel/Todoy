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
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing completion')
      setLoading(false)
    }, 5000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        setLoading(false)
        return
      }
      
      if (session?.user) {
        loadUserData(session.user.id).finally(() => {
          clearTimeout(timeout)
        })
      } else {
        setLoading(false)
        clearTimeout(timeout)
      }
    }).catch((error) => {
      console.error('Failed to get session:', error)
      setLoading(false)
      clearTimeout(timeout)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setUser(null)
        setOrganization(null)
        setOrgMembers([])
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // Load user profile and organization data
  const loadUserData = async (userId: string) => {
    console.log('Loading user data for:', userId)
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        // If profile doesn't exist, clear the session and show login
        await supabase.auth.signOut()
        setUser(null)
        setOrganization(null)
        setLoading(false)
        return
      }

      if (profile) {
        console.log('Profile loaded:', profile)
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          createdAt: profile.created_at,
        }
        setUser(userData)

        // Load user's organization memberships
        const { data: memberships, error: memberError } = await supabase
          .from('org_members')
          .select('*, organizations(*)')
          .eq('user_id', userId)

        if (memberError) {
          console.error('Membership error:', memberError)
        }

        if (memberships && memberships.length > 0) {
          console.log('Memberships loaded:', memberships.length)
          // Use first org for now (TODO: support multiple orgs)
          const firstMembership = memberships[0]
          const orgData = firstMembership.organizations

          if (orgData) {
            const org: Organization = {
              id: orgData.id,
              name: orgData.name,
              description: orgData.description || '',
              createdAt: orgData.created_at,
              ownerId: orgData.owner_id,
            }
            setOrganization(org)

            // Load all org members
            const { data: allMembers } = await supabase
              .from('org_members')
              .select('*')
              .eq('org_id', orgData.id)

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
        } else {
          console.log('No organization memberships found')
        }
      } else {
        console.log('No profile found')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      console.log('Finished loading user data')
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
      await loadUserData(data.user.id)
    }
  }

  const signup = async (email: string, password: string, name: string, organizationData: OrganizationData) => {
    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/`,
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
      // TODO: Implement join organization logic with invite code
      throw new Error('Join organization feature coming soon')
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
