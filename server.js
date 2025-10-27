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
app.post("/sse", async (req, res) =>
