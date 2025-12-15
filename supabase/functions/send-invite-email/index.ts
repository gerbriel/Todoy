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
  inviteCode?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header (optional for no-verify-jwt mode)
    const authHeader = req.headers.get('Authorization')
    
    // Only verify auth if header is present
    if (authHeader) {
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
        console.warn('Auth verification failed, but continuing since --no-verify-jwt is enabled')
      }
    }

    // Parse request body
    const body = await req.json()
    console.log('Received request body:', JSON.stringify(body))
    
    const { recipientEmail, recipientName, inviterName, orgName, inviteLink, inviteCode }: InviteEmailRequest = body

    if (!recipientEmail || !inviterName || !orgName || !inviteLink) {
      throw new Error(`Missing required fields: recipientEmail=${!!recipientEmail}, inviterName=${!!inviterName}, orgName=${!!orgName}, inviteLink=${!!inviteLink}`)
    }

    console.log('Sending email to:', recipientEmail)

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Todoy Project Management <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `🎉 ${inviterName} invited you to join ${orgName} on Todoy`,
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
                  background-color: #f3f4f6;
                }
                .container {
                  background-color: #ffffff;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #2563eb;
                }
                .header h1 {
                  color: #2563eb;
                  margin: 0 0 10px 0;
                  font-size: 32px;
                }
                .header .subtitle {
                  color: #6b7280;
                  font-size: 16px;
                  margin: 0;
                }
                .content {
                  margin-bottom: 30px;
                }
                .content p {
                  margin: 16px 0;
                }
                .highlight-box {
                  background-color: #eff6ff;
                  border-left: 4px solid #2563eb;
                  padding: 16px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .button {
                  display: inline-block;
                  padding: 14px 32px;
                  background-color: #2563eb;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
                  font-size: 16px;
                  transition: background-color 0.2s;
                }
                .button:hover {
                  background-color: #1d4ed8;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 13px;
                  color: #6b7280;
                  text-align: center;
                }
                .link {
                  color: #2563eb;
                  word-break: break-all;
                  text-decoration: none;
                }
                .link:hover {
                  text-decoration: underline;
                }
                .features {
                  background-color: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                }
                .features ul {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .features li {
                  margin: 8px 0;
                  color: #4b5563;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✨ You're Invited to Todoy!</h1>
                  <p class="subtitle">Collaborative Project Management Made Simple</p>
                </div>
                <div class="content">
                  <p>Hi${recipientName ? ` ${recipientName}` : ''},</p>
                  <div class="highlight-box">
                    <p style="margin: 0;"><strong>${inviterName}</strong> has invited you to collaborate in <strong>${orgName}</strong>!</p>
                  </div>
                  <p>Todoy helps teams organize and manage projects, campaigns, and tasks seamlessly. Join your team and start collaborating today!</p>
                  
                  <div class="features">
                    <strong>What you can do with Todoy:</strong>
                    <ul>
                      <li>📋 Organize projects and campaigns</li>
                      <li>✅ Track tasks and progress</li>
                      <li>📅 Manage deadlines with calendar views</li>
                      <li>👥 Collaborate with your team in real-time</li>
                      <li>🎯 Stay focused with stage-based workflows</li>
                    </ul>
                  </div>

                  <p style="text-align: center;">
                    <a href="${inviteLink}" class="button">🚀 Accept Invitation & Get Started</a>
                  </p>
                  <p style="font-size: 13px; color: #6b7280; text-align: center;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${inviteLink}" class="link">${inviteLink}</a>
                  </p>
                  ${inviteCode ? `
                  <div class="highlight-box" style="background-color: #f0fdf4; border-left-color: #22c55e; margin-top: 20px;">
                    <p style="margin: 0; text-align: center;">
                      <strong>Or use this invite code during signup:</strong><br>
                      <span style="font-size: 24px; font-family: 'Courier New', monospace; color: #16a34a; font-weight: bold; letter-spacing: 2px;">${inviteCode}</span>
                    </p>
                  </div>
                  ` : ''}
                  <p style="font-size: 13px; color: #ef4444; text-align: center;">
                    ⏱️ This invitation expires in 7 days
                  </p>
                </div>
                <div class="footer">
                  <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on Todoy.</p>
                  <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
                  <p style="margin-top: 15px;">
                    <a href="https://gerbriel.github.io/Todoy" class="link">Visit Todoy</a>
                  </p>
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
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', errorDetails)
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
