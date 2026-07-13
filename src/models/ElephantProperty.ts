import mongoose from 'mongoose';

// Elephant Property Schema
export const ElephantPropertySchema = new mongoose.Schema({
  // Basic identification
  externalId: { type: String, required: true, unique: true },
  externalSource: { type: String, enum: ['amazon', 'etsy', 'custom'], required: true },
  listingUrl: { type: String, required: true },
  asinOrSkU: { type: String },

  // Product details
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  thumbnailImage: { type: String },

  // Dimensions for staging
  dimensions: {
    depth: { type: Number },
    height: { type: Number },
    width: { type: Number }
  },

  // Style metadata
  styleTags: { type: [String] },
  colorPalettes: { type: [String] },

  // Inventory status
  inventoryCount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },

  // Relationships
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: { type: [String] },

  // Timestamps
}, { timestamps: true });

/**
 * Index for fast lookup by externalId and source
 */
ElephantPropertySchema.index({ externalId: 1, externalSource: 1 }, { unique: true });