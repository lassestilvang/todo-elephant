import mongoose, { Document, Schema } from 'mongoose';

export type LabelStatus = 'active' | 'archived';

export interface ILabel extends Document {
  name: string;
  color: string;
  description?: string;
  order: number;
  status: LabelStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabel>({
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#64748b' },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Index for ordering and status
LabelSchema.index({ order: 1, status: 1 });

// Update timestamp on save
LabelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const LabelModel = mongoose.model<ILabel>('Label', LabelSchema);