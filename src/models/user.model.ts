import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';

export interface IUser extends Document {
  _id: string;
  userId: string; // For compatibility with task model
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user' | 'premium';
  isVerified: boolean;
  preferredThemes: string[];
  // MFA fields
  mfaSecret?: string;
  mfaEnabled: boolean;
  mfaBackupCodesHash?: string[];
  // Session tracking
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  // MFA methods
  generateMFASecret(): string;
  validateMFAToken(token: string): boolean;
  generateBackupCodes(count?: number): string[];
  verifyBackupCode(code: string): boolean;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  userId: {
    type: String,
    unique: true,
    required: true,
    default: function() { return new Date().getTime().toString(); }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'premium'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferredThemes: {
    type: [String],
    default: []
  },
  // MFA fields
  mfaSecret: {
    type: String,
    select: false
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaBackupCodesHash: {
    type: [String],
    select: false
  },
  // Session & security tracking
  lastLoginAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Generate MFA secret
UserSchema.methods.generateMFASecret = function(): string {
  const secret = speakeasy.generateSecret({ length: 20 });
  this.mfaSecret = secret.base32;
  return secret.base32;
};

// Validate MFA TOTP token
UserSchema.methods.validateMFAToken = function(token: string): boolean {
  if (!this.mfaSecret) return false;
  return speakeasy.totp.verify({
    secret: this.mfaSecret,
    encoding: 'base32',
    token
  });
};

// Generate backup codes (hashed for storage)
UserSchema.methods.generateBackupCodes = function(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Hash backup codes for storage
UserSchema.methods.hashBackupCodes = async function(codes: string[]): Promise<string[]> {
  const salts = await Promise.all(codes.map(() => bcrypt.genSalt(10)));
  return Promise.all(
    codes.map((code, i) => bcrypt.hash(code, salts[i]))
  );
};

// Verify a backup code (compares against hashed codes)
UserSchema.methods.verifyBackupCode = async function(code: string): Promise<boolean> {
  if (!this.mfaBackupCodesHash || this.mfaBackupCodesHash.length === 0) return false;
  for (const hash of this.mfaBackupCodesHash) {
    try {
      if (await bcrypt.compare(code, hash)) return true;
    } catch {
      continue;
    }
  }
  return false;
};

// Remove used backup code
UserSchema.methods.removeBackupCode = async function(code: string): Promise<void> {
  if (!this.mfaBackupCodesHash) return;
  for (let i = 0; i < this.mfaBackupCodesHash.length; i++) {
    try {
      if (await bcrypt.compare(code, this.mfaBackupCodesHash[i])) {
        this.mfaBackupCodesHash.splice(i, 1);
        await this.save();
        return;
      }
    } catch {
      continue;
    }
  }
};

// Reset login attempts after successful login
UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Index for faster email lookups
UserSchema.index({ email: 1 });
UserSchema.index({ loginAttempts: 1 });
UserSchema.index({ lockUntil: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);