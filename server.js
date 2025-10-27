import express from "express";
import fetch from "node-fetch";
import 'dotenv/config';


const app = express();
app.use(express.json());

// Replace with your OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-your-key-here";

app.post("/sse", async (req, res) => {
  try {
    const { prompt, size = "1024x1024", n = 1, background = "auto" } = req.body;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        n,
        background,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.json({
      image_url: data.data[0].url,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});
export default app;

