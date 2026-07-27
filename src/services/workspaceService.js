import { supabase } from './supabaseClient'

export async function fetchMyWorkspaces() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*, workspace_members(role, user_id)')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function fetchAllWorkspaces() {
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*, workspace_members(role, user_id)')
    .order('created_at')
  if (error) throw error
  if (!workspaces?.length) return []

  const ownerIds = [...new Set(workspaces.map(w => w.owner_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', ownerIds)

  const byId = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  return workspaces.map(ws => ({ ...ws, profiles: byId[ws.owner_id] ?? null }))
}

export async function createWorkspace(name) {
  const { data, error } = await supabase.rpc('create_workspace', { workspace_name: name })
  if (error) throw error
  return data
}

export async function updateWorkspace(id, name) {
  const { data, error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkspace(id) {
  const { error } = await supabase.from('workspaces').delete().eq('id', id)
  if (error) throw error
}

export async function fetchWorkspaceMembers(workspaceId) {
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at')
  if (error) throw error
  if (!members?.length) return []

  const userIds = members.map(m => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', userIds)

  const byId = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  return members.map(m => ({ ...m, profiles: byId[m.user_id] ?? null }))
}

export async function removeMember(workspaceId, userId) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
  if (error) throw error
}

// Invitations
export async function fetchPendingInvitations(workspaceId) {
  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchMyInvitations() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('*, workspaces(name)')
    .eq('invited_email', user.email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function inviteByEmail(workspaceId, email) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({ workspace_id: workspaceId, invited_by: user.id, invited_email: email.toLowerCase().trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function respondToInvitation(invitationId, accept) {
  const status = accept ? 'accepted' : 'declined'
  const { data, error } = await supabase
    .from('workspace_invitations')
    .update({ status })
    .eq('id', invitationId)
    .select('*')
    .single()
  if (error) throw error

  if (accept) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: data.workspace_id, user_id: user.id, role: 'member' })
    if (memberError && !memberError.message.includes('duplicate')) throw memberError
  }

  return data
}

export async function cancelInvitation(invitationId) {
  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
  if (error) throw error
}

export async function fetchAllUsersWithWorkspaces() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, is_admin, created_at')
    .order('created_at')
  if (error) throw error
  if (!profiles?.length) return []

  const ids = profiles.map(p => p.id)
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, owner_id')
    .in('owner_id', ids)
    .order('created_at')

  const wsByOwner = {}
  for (const w of workspaces ?? []) {
    (wsByOwner[w.owner_id] ??= []).push(w)
  }
  return profiles.map(p => ({ ...p, workspaces: wsByOwner[p.id] ?? [] }))
}

export async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}
