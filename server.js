import express from "express";
import fetch from "node-fetch";
import 'dotenv/config';

const app = express();
app.use(express.json());

// ✅ MCP metadata route — ChatGPT looks for this when creating the connector
app.get("/", (req, res) => {
  res.json({
    name: "image-generator-mcp",
    version: "1.0.0",
    description: "Generates images from text prompts using OpenAI's image API",
    tools: [
      {
        name: "generate_image",
        description: "Generate an image from a text prompt",
        input_schema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            size: {
              type: "string",
              enum: ["256x256", "512x512", "1024x1024"],
              default: "1024x1024"
            },
            background: {
              type: "string",
              enum: ["auto", "transparent", "opaque"],
              default: "auto"
            },
            n: { type: "integer", default: 1 }
          },
          required: ["prompt"]
        }
      }
    ]
  });
});

// ✅ Actual image generation endpoint
app.post("/sse", async (req, res) => {
  try {
    const { prompt, size = "1024x1024", n = 1, background = "auto" } = req.body;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
      image_url: data.data[0].url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ export for Vercel
export default app;
