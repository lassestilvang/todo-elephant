import mongoose, { Document, Schema } from 'mongoose';

// Board status types
enum BoardStatus {
  'active' = 'active',
  'archived' = 'archived'
}

// User permission levels
enum BoardPermission {
  'view' = 'view',
  'edit' = 'edit',
  'admin' = 'admin'
}

interface IBoardMember {
  userId: string;
  permission: BoardPermission;
}

export interface IBoard extends Document {
  name: string;
  description?: string;
  color: string;
  lists: string[];
  members: IBoardMember[];
  archivedAt?: Date;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  lists: {
    type: [String],
    default: []
  },
  members: {
    type: [
      {
        userId: {
          type: String,
        },
        permission: {
          type: String,
          enum: [
            'view',
            'edit',
            'admin'
          ]
        }
      }
    ]
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date
},
{ timestamps: true });

// Prevent adding members without proper permissions
BoardSchema.pre('save', function(next) {
  if (!this.members || this.members.length === 0) {
    next(new Error('Board must have at least one member with edit access'));
  }
  next();
});

// Index for efficient member lookups
BoardSchema.index({ 'members.userId': 1 });

// Update timestamp on save
BoardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BoardModel = mongoose.model<IBoard>('Board', BoardSchema);