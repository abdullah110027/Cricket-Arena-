import { model, models, Schema, type InferSchemaType } from 'mongoose';

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venueId: { type: String, ref: 'Venue', required: true, index: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true, unique: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    bookingStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING', required: true, index: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING', required: true },
    advancePaymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING', required: true },
    remainingPaymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING', required: true },
    paymentMethod: { type: String, enum: ['MOCK_CHECKOUT', 'CASH'], default: 'MOCK_CHECKOUT', required: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export type BookingDocument = InferSchemaType<typeof bookingSchema>;
export const BookingModel = models.Booking || model('Booking', bookingSchema);
