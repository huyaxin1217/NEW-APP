import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for generating example sentences
  app.post("/api/generate-example", async (req, res) => {
    try {
      const { word } = req.body;
      
      if (!word) {
        return res.status(400).json({ error: "Word is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Generate a short, common, and easy-to-understand English example sentence for the word "${word}". Then provide its Chinese translation.
      Return ONLY a JSON object in this exact format, with no markdown formatting or other text:
      {
        "exampleEn": "The english sentence.",
        "exampleZh": "The chinese translation."
      }`;

      let parsed;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch (aiError) {
        console.warn("Gemini API failed, falling back to dictionary API. (Error ignored)");
        // Fallback to dictionary API
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            let fallbackExample = "";
            
            // Try to find an example in the dictionary data
            outer: for (const meaning of dictData[0]?.meanings || []) {
              for (const def of meaning.definitions || []) {
                if (def.example) {
                  fallbackExample = def.example;
                  break outer;
                }
              }
            }
            
            if (fallbackExample) {
              parsed = {
                exampleEn: fallbackExample,
                exampleZh: "（暂无机器翻译，API配额超限）"
              };
            } else {
               parsed = {
                 exampleEn: "No example found.",
                 exampleZh: "（未找到例句）"
               };
            }
          } else {
            parsed = {
              exampleEn: "API error. Please try again later.",
              exampleZh: "（接口报错，请稍后再试）"
            };
          }
        } catch (fetchError) {
          console.error("Dictionary API fetch failed:", fetchError);
          parsed = {
            exampleEn: "Network error fetching example.",
            exampleZh: "（网络错误，无法获取例句）"
          };
        }
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error generating example:", error);
      res.status(500).json({ error: error.message || "Failed to generate example" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
