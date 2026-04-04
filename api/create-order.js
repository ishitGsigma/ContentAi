import Razorpay from "razorpay";

const PACKAGES = {
  starter: { id: "starter", label: "Starter", credits: 10, price: 99 },
  pro: { id: "pro", label: "Pro", credits: 30, price: 249 },
  business: { id: "business", label: "Business", credits: 75, price: 499 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { packageId } = req.body;
  if (!packageId) {
    return res.status(400).json({ error: "packageId is required." });
  }

  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return res.status(400).json({ error: "Invalid package selected." });
  }

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
  }

  try {
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: pkg.price * 100,
      currency: "INR",
      receipt: `receipt_${packageId}_${Date.now()}`,
      payment_capture: 1,
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      packageId: pkg.id,
      credits: pkg.credits,
      label: pkg.label,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to create Razorpay order." });
  }
}
