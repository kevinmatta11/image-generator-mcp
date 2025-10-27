import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import 'dotenv/config';

const app = express();

// ✅ Allow CORS for ChatGPT MCP
app.use(cors());
app.use(express.json());

// ✅ Root MCP metadata endpoint
app.get("/", (req, res) => {
  res.json({
    name: "image-generator-mcp",
    version: "1.0.0",
    description: "Generates images using OpenAI's image API",
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

// ✅ Public POST route for generating images
app.post("/sse", async (req, res) => {
  try {
    const { prompt, size = "1024x1024", background = "auto", n = 1 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    res.write(`data: ${JSON.stringify({ status: "generating", message: "Starting image generation..." })}\n\n`);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        size: size,
        quality: "standard",
        n: n
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      res.write(`data: ${JSON.stringify({ status: "error", error: `OpenAI API error: ${response.status} ${errorData}` })}\n\n`);
      res.end();
      return;
    }

    const data = await response.json();
    
    res.write(`data: ${JSON.stringify({ 
      status: "success", 
      images: data.data,
      prompt: prompt,
      size: size
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error("Error generating image:", error);
    res.write(`data: ${JSON.stringify({ status: "error", error: error.message })}\n\n`);
    res.end();
  }
});

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ Export for Vercel
export default app;

// ✅ Start local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 MCP metadata: http://localhost:${PORT}/`);
    console.log(`🖼️  Image generation: http://localhost:${PORT}/sse`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}
