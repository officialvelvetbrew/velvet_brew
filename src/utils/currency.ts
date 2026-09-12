export const rupee = (amount: number): string => {
  const num = Number(amount) || 0;
  // If it's a whole number, format without decimals. Otherwise, format to 2 decimal places.
  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2);
  return `₹${formatted}`;
};