import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 4173;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

const PACKAGES = {
  starter: { id: "starter", label: "Starter", credits: 10, price: 99 },
  pro: { id: "pro", label: "Pro", credits: 30, price: 249 },
  business: { id: "business", label: "Business", credits: 75, price: 499 },
};

const TOOLS = {
  social: "Create 3 distinct social media posts",
  blog: "Write a detailed blog article outline",
  email: "Write a complete marketing email",
  ad: "Write 3 ad copy variations",
  youtube: "Write a YouTube video script",
  product: "Write a compelling product listing",
};

const buildPrompt = (tool, topic, details) => {
  const ctx = details ? ` Additional context: ${details}` : "";
  return `${TOOLS[tool] || TOOLS.social} for \"${topic}\".${ctx}`;
};

app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  const { tool, topic, details } = req.body;
  if (!topic?.trim()) {
    return res.status(400).json({ error: "Topic is required." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }

  try {
    const prompt = buildPrompt(tool, topic, details);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 512,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Google API error." });
    }

    const text = data?.candidates?.[0]?.output || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      return res.status(500).json({ error: "Empty response from Google API." });
    }

    return res.json({ text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to generate content." });
  }
});

app.post("/api/create-order", async (req, res) => {
  const { packageId } = req.body;
  if (!packageId) {
    return res.status(400).json({ error: "packageId is required." });
  }

  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return res.status(400).json({ error: "Invalid package selected." });
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay credentials are not configured." });
  }

  try {
    const order = await razorpay.orders.create({
      amount: pkg.price * 100,
      currency: "INR",
      receipt: `receipt_${packageId}_${Date.now()}`,
      payment_capture: 1,
    });

    return res.json({
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
});

app.post("/api/verify-payment", (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: "Payment verification fields are required." });
  }

  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed." });
  }

  return res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: "ssr" },
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.use("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
