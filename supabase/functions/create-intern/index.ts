import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Missing Authorization header")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // 1. Initialize admin client (for user creation)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 2. Initialize normal client with caller's JWT to verify Admin status
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) throw new Error("Unauthorized caller")

    const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      throw new Error("Forbidden: Only admins can perform this action.")
    }

    const body = await req.json()
    const { action, internData } = body

    if (action === 'create_intern') {
      const { first_name, last_name, username, department, mentor, start_date, end_date } = internData
      
      const proxyEmail = `${username.toLowerCase()}@interns.xyphx.com`
      
      // Generate a strong temp password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!"

      // Create user via Admin API, bypassing global email confirmations
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: proxyEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'intern', username }
      })

      if (createError) throw createError

      const newUserId = authData.user.id

      // Insert into profiles
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        username,
        role: 'intern',
        first_name,
        last_name,
        force_password_change: true
      })
      
      if (profileError) throw profileError

      // Insert into interns
      const { error: internError } = await supabaseAdmin.from('interns').insert({
        profile_id: newUserId,
        department,
        start_date,
        end_date,
        mentor,
        status: 'active'
      })

      if (internError) throw internError

      return new Response(JSON.stringify({ 
        success: true, 
        username, 
        tempPassword 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'reset_password') {
       const { targetUserId } = body
       
       // Verify target is an intern
       const { data: targetProfile } = await supabaseAdmin.from('profiles').select('role, username').eq('id', targetUserId).single()
       if (targetProfile?.role !== 'intern') throw new Error("Target is not an intern")

       const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!"
       
       const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: tempPassword })
       if (updateAuthError) throw updateAuthError

       const { error: updateProfileError } = await supabaseAdmin.from('profiles').update({ force_password_change: true }).eq('id', targetUserId)
       if (updateProfileError) throw updateProfileError

       return new Response(JSON.stringify({ 
        success: true, 
        username: targetProfile.username, 
        tempPassword 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error("Invalid action")

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
