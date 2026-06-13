// Razorpay payment link (razorpay.me) used for online UPI payments.
//
// NOTE: razorpay.me does NOT support appending the amount as a path segment
// (e.g. /@handle/140 returns a NOT_FOUND error). It is a personal payment
// handle where the customer enters the amount on the Razorpay page. So we link
// to the base handle and clearly show the exact amount to enter in our UI.
export const RAZORPAY_PAYMENT_HANDLE = "https://razorpay.me/@harshadshivajiambekar";

export function buildRazorpayLink(_amount?: number | string): string {
  return RAZORPAY_PAYMENT_HANDLE;
}
