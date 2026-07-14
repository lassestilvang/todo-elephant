import mongoose from 'mongoose';

export interface List {
  _id?: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const ListModel = mongoose.model('List', ListSchema);