import { apiFetch } from "./api";

type CheckoutOptions = {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
};

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: CheckoutOptions): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Could not load Razorpay checkout.");

  return new Promise((resolve) => {
    const rzp = new (window as any).Razorpay({
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency,
      name: "Igatpuri Eats",
      description: `Order ${opts.orderNumber}`,
      order_id: opts.orderId,
      prefill: {
        name: opts.customerName,
        contact: opts.customerPhone,
      },
      theme: { color: "#E23744" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await apiFetch(`/orders/${encodeURIComponent(opts.orderNumber)}/pay/verify/`, {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          resolve(true);
        } catch {
          resolve(false);
        }
      },
      modal: {
        ondismiss: () => resolve(false),
      },
    });

    rzp.on("payment.failed", () => resolve(false));
    rzp.open();
  });
}
