// src/lib/beta-onboard.ts
import { prisma } from '@/lib/prisma';
import { sendEmail } from './email/sendgrid';

export interface BetaUser {
  email: string;
  name: string;
  inviteCode: string;
  tier: 'basic' | 'advanced' | 'enterprise';
}

export class BetaOnboarding {
  /**
   * Import beta users from CSV file
   * Format: email,name,tier (optional, defaults to basic)
   */
  async importFromCSV(path: string): Promise<BetaUser[]> {
    try {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const lines = content.trim().split('\n');

      const users: BetaUser[] = [];
      for (let i = 1; i < lines.length; i++) { // Skip header
        const [email, name, tier = 'basic'] = lines[i].split(',').map(s => s.trim());
        if (email && name) {
          users.push({
            email,
            name,
            inviteCode: this.generateInviteCode(email),
            tier: tier as 'basic' | 'advanced' | 'enterprise'
          });
        }
      }
      return users;
    } catch (error) {
      console.error('Failed to import beta users from CSV:', error);
      return [];
    }
  }

  /**
   * Send welcome email sequence to beta users
   */
  async sendWelcomeSequence(users: BetaUser[]): Promise<void> {
    for (const user of users) {
      try {
        await sendEmail({
          to: user.email,
          subject: `🎉 Welcome to Todo Elephant Beta, ${user.name}!`,
          template: 'beta-welcome',
          variables: {
            name: user.name,
            invite_code: user.inviteCode,
            dashboard_url: process.env.NEXT_PUBLIC_APP_URL || 'https://todo-elephant.vercel.app'
          }
        });

        // Record the invitation in database
        await prisma.betaInvitation.create({
          data: {
            email: user.email,
            name: user.name,
            inviteCode: user.inviteCode,
            tier: user.tier,
            status: 'SENT',
            sentAt: new Date()
          }
        });

        // Rate limit to avoid hitting email API limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send welcome email to ${user.email}:`, error);
      }
    }
  }

  /**
   * Generate a unique invite code for a user
   */
  private generateInviteCode(email: string): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${email}${Date.now()}${Math.random()}`)
      .digest('hex');
    return hash.substring(0, 8).toUpperCase();
  }

  /**
   * Activate a beta user when they sign up with invite code
   */
  async activateBetaUser(inviteCode: string, userId: string): Promise<boolean> {
    try {
      const invitation = await prisma.betaInvitation.findFirst({
        where: { inviteCode, status: 'SENT' }
      });

      if (!invitation) return false;

      await prisma.betaInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACTIVATED',
          activatedAt: new Date(),
          userId
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to activate beta user:', error);
      return false;
    }
  }

  /**
   * Get beta user statistics
   */
  async getBetaStats() {
    const stats = await prisma.betaInvitation.groupBy({
      by: ['tier', 'status'],
      _count: true
    });

    return stats;
  }
}

export const betaOnboarding = new BetaOnboarding();