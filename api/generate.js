import { GoogleGenerativeAI } from "@google/generative-ai";

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
  return `${TOOLS[tool] || TOOLS.social} for "${topic}".${ctx}`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tool, topic, details } = req.body;
  if (!topic?.trim()) {
    return res.status(400).json({ error: "Topic is required." });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }

  try {
    const prompt = buildPrompt(tool, topic, details);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      return res.status(500).json({ error: "Empty response from Gemini API." });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to generate content. Check your API key." });
  }
}
