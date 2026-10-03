import { model, models, Schema, type InferSchemaType } from 'mongoose';

const venueSchema = new Schema(
  {
    _id: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isSystem: { type: Boolean, default: false, required: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    area: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ['Indoor', 'Outdoor'], required: true },
    pricePerSlot: { type: Number, required: true, min: 0.01 },
    facilities: { type: [String], default: [] },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: { type: String, required: true, trim: true, maxlength: 240 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    slotsAvailable: { type: Number, default: 0, min: 0 },
    image: { type: String },
    slotDuration: { type: Number, default: 90, min: 1, required: true },
    approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', required: true, index: true },
    active: { type: Boolean, default: true, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

export type VenueDocument = InferSchemaType<typeof venueSchema>;
export const VenueModel = models.Venue || model('Venue', venueSchema);
