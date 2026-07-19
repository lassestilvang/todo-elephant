// src/lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  variables?: Record<string, string>;
}

export interface TemplateConfig {
  subject: string;
  html: string;
  text: string;
}

const templates: Record<string, TemplateConfig> = {
  'beta-welcome': {
    subject: '🎉 Welcome to Todo Elephant Beta!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Todo Elephant Beta</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">You're invited to the future of productivity</p>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 40px;">
            <h2 style="color: #111827; margin-top: 0;">Welcome, {{name}}!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              You've been selected for our exclusive beta program. You're among the first to experience
              Todo Elephant's AI-powered task management with smart scheduling, command palette, and
              team collaboration features.
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #374151; margin-top: 0;">Your Invite Code</h3>
              <p style="font-family: monospace; font-size: 24px; font-weight: bold; color: #6366f1; margin: 0;">{{invite_code}}</p>
            </div>
            <p style="color: #4b5563;">Enter this code when you sign up at:</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="{{dashboard_url}}/signup" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Join Todo Elephant Beta
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="color: #9ca3af; font-size: 14px;">
              Questions? Reply to this email or join our <a href="https://discord.gg/todoelephant" style="color: #6366f1;">Discord community</a>.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to Todo Elephant Beta, {{name}}!

You've been selected for our exclusive beta program. Your invite code: {{invite_code}}

Sign up at: {{dashboard_url}}/signup

Questions? Reply to this email or join our Discord community.
    `
  },
  'feature-spotlight': {
    subject: '⚡ New AI Features for Your Beta Experience',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 12px 12px 0 0; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚡ New Features Unlocked</h1>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 40px;">
            <h2 style="color: #111827;">Your Beta Just Got Better</h2>
            <p style="color: #4b5563;">We've rolled out new AI features for beta users:</p>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li><strong>AI Smart Scheduling</strong> - Auto-schedule tasks based on your energy patterns</li>
              <li><strong>Natural Language Commands</strong> - "Move my 2pm meeting to tomorrow"</li>
              <li><strong>Offline Mode</strong> - Work offline, sync when online</li>
              <li><strong>Team Collaboration</strong> - Invite your team to shared workspaces</li>
            </ul>
            <p style="text-align: center; margin: 24px 0;">
              <a href="{{dashboard_url}}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Explore New Features
              </a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
New AI features unlocked for your beta!
- AI Smart Scheduling
- Natural Language Commands
- Offline Mode
- Team Collaboration

Explore at: {{dashboard_url}}
    `
  },
  'launch-announcement': {
    subject: '🚀 Todo Elephant Public Launch - AI-Powered Productivity!',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Todo Elephant Launches Today!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">AI-powered productivity for everyone</p>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 40px;">
            <h2 style="color: #111827; margin-top: 0;">We're Live! 🎉</h2>
            <p style="color: #4b5563; font-size: 16px;">
              After months of beta testing with amazing users like you, Todo Elephant is now available to everyone.
            </p>
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0;">What's Included</h3>
              <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                <li>🤖 AI-powered task generation and smart scheduling</li>
                <li>⌘K Command palette for lightning-fast navigation</li>
                <li>📅 Calendar integration (Google, Outlook)</li>
                <li>👥 Team workspaces and collaboration</li>
                <li>📊 Advanced analytics and insights</li>
                <li>📱 Native mobile apps (iOS & Android)</li>
              </ul>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="https://todo-elephant.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Start Free Today →
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Thank you for being part of our journey. Here's to getting things done! 🐘<br>
              <strong>The Todo Elephant Team</strong>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Todo Elephant Launches Today! 🚀

We're live with:
- AI-powered task generation
- Command palette (⌘K)
- Calendar integration
- Team workspaces
- Advanced analytics
- Mobile apps

Start free: https://todo-elephant.com

Thank you for being part of our journey!
The Todo Elephant Team
    `
  }
};

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.warn('SENDGRID_API_KEY not configured, logging email instead:', options.subject);
    return;
  }

  sgMail.setApiKey(apiKey);

  const templateConfig = options.template ? templates[options.template] : null;

  const subject = options.subject || templateConfig?.subject || 'Todo Elephant';

  let html = options.html;
  let text = options.text;

  if (templateConfig && !html) {
    html = templateConfig.html;
    text = templateConfig.text;

    // Replace template variables
    if (options.variables) {
      for (const [key, value] of Object.entries(options.variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value);
        text = text.replace(regex, value);
      }
    }
  }

  const msg = {
    to: options.to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@todo-elephant.com',
      name: 'Todo Elephant'
    },
    subject,
    html,
    text,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${options.to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    throw error;
  }
}

/**
 * Send bulk emails with rate limiting
 */
export async function sendBulkEmails(
  recipients: string[],
  options: Omit<EmailOptions, 'to'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      await sendEmail({ ...options, to: recipient });
      sent++;

      // Rate limit: SendGrid free tier allows 100/day, be conservative
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failed++;
      console.error(`Failed to send to ${recipient}:`, error);
    }
  }

  return { sent, failed };
}

export { templates };