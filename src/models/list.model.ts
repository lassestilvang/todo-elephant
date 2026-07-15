import mongoose, { Document, Schema } from 'mongoose';

export type ListStatus = 'active' | 'archived';

export interface IList extends Document {
  name: string;
  description?: string;
  color: string;
  order: number;
  status: ListStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<IList>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  color: { type: String, default: '#3b82f6' },
  order: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Index for ordering and status
ListSchema.index({ order: 1, status: 1 });

// Update timestamp on save
ListSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ListModel = mongoose.model<IList>('List', ListSchema);