import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteEmailRequest {
  inviteId: string
  recipientEmail: string
  recipientName?: string
  inviterName: string
  orgName: string
  inviteLink: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { recipientEmail, recipientName, inviterName, orgName, inviteLink }: InviteEmailRequest =
      await req.json()

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Todoy <onboarding@resend.dev>', // Change this to your verified domain
        to: [recipientEmail],
        subject: `You've been invited to join ${orgName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 8px;
                  padding: 40px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #2563eb;
                  margin: 0;
                  font-size: 28px;
                }
                .content {
                  margin-bottom: 30px;
                }
                .button {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #2563eb;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                }
                .button:hover {
                  background-color: #1d4ed8;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                  text-align: center;
                }
                .link {
                  color: #2563eb;
                  word-break: break-all;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're Invited!</h1>
                </div>
                <div class="content">
                  <p>Hi${recipientName ? ` ${recipientName}` : ''},</p>
                  <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Todoy.</p>
                  <p>Todoy is a collaborative project management platform where you can organize projects, campaigns, and tasks with your team.</p>
                  <p style="text-align: center;">
                    <a href="${inviteLink}" class="button">Accept Invitation</a>
                  </p>
                  <p style="font-size: 14px; color: #6b7280;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${inviteLink}" class="link">${inviteLink}</a>
                  </p>
                  <p style="font-size: 14px; color: #6b7280;">
                    This invitation will expire in 7 days.
                  </p>
                </div>
                <div class="footer">
                  <p>This email was sent because ${inviterName} invited you to join ${orgName}.</p>
                  <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      throw new Error(`Failed to send email: ${data.message || 'Unknown error'}`)
    }

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-invite-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
