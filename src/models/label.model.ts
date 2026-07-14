import mongoose from 'mongoose';

export interface Label {
  _id?: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const LabelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LabelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const LabelModel = mongoose.model('Label', LabelSchema);