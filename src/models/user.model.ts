import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user' | 'premium';
  isVerified: boolean;
  preferredThemes: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
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
  }
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

// Index for faster email lookups
UserSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);