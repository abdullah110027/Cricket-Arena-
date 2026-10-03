export const PLATFORM_COMMISSION_AMOUNT = 1;

export function calculateBookingAmounts(baseAmount: number) {
  const safeBaseAmount = Number.isFinite(baseAmount) && baseAmount > 0 ? Number(baseAmount) : 0;
  const totalAmount = Number((safeBaseAmount + PLATFORM_COMMISSION_AMOUNT).toFixed(2));
  const advanceAmount = Number((totalAmount / 2).toFixed(2));
  const remainingAmount = Number((totalAmount - advanceAmount).toFixed(2));

  return {
    totalAmount,
    advanceAmount,
    remainingAmount,
    commissionAmount: Number(PLATFORM_COMMISSION_AMOUNT.toFixed(2)),
  };
}
