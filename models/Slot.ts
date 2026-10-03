import { model, models, Schema, type InferSchemaType } from 'mongoose';

const slotSchema = new Schema(
  {
    venueId: { type: String, ref: 'Venue', required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    price: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ['available', 'unavailable', 'booked'], default: 'available', required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

slotSchema.index({ venueId: 1, date: 1, startTime: 1 }, { unique: true });

export type SlotDocument = InferSchemaType<typeof slotSchema>;
export const SlotModel = models.Slot || model('Slot', slotSchema);
