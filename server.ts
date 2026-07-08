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

      if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "Neither Gemini nor DeepSeek API keys are configured on the server." });
      }

      const prompt = `Generate a short, common, and easy-to-understand English example sentence for the word "${word}". Then provide its Chinese translation.
      Return ONLY a JSON object in this exact format, with no markdown formatting or other text:
      {
        "exampleEn": "The english sentence.",
        "exampleZh": "The chinese translation."
      }`;

      let parsed;

      // Try DeepSeek first if configured
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          console.log(`Using DeepSeek to generate example for: ${word}`);
          const dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "You are a professional dictionary compiler. Respond only in raw JSON objects."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            })
          });

          if (dsResponse.ok) {
            const dsData = await dsResponse.json();
            const content = dsData.choices?.[0]?.message?.content || "{}";
            const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleanContent);
          } else {
            console.warn(`DeepSeek API returned status ${dsResponse.status}`);
          }
        } catch (dsError) {
          console.error("DeepSeek API failed:", dsError);
        }
      }

      // Fallback to Gemini if DeepSeek is not configured or failed
      if (!parsed && process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
          });

          const text = response.text || "{}";
          const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(jsonStr);
        } catch (aiError) {
          console.warn("Gemini API failed, falling back to dictionary API.");
        }
      }

      // Ultimate dictionary API fallback if both AI models failed or were missing keys
      if (!parsed) {
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

  // API route for generating complete dictionary entries for a list of words
  app.post("/api/lookup-words", async (req, res) => {
    try {
      const { words } = req.body;
      
      if (!words || !Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ error: "An array of words is required" });
      }

      if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "Neither Gemini nor DeepSeek API keys are configured on the server." });
      }

      const prompt = `You are a professional dictionary compiler. For each English word in the list below, generate:
1. Accurate IPA phonetic symbols (US accent, wrapped in slashes e.g., /ˌækʌˈdemɪk/).
2. A clear, concise Chinese definition (with part of speech, e.g. "v. 包含，包括" or "adj. 突然的").
3. A short, natural English example sentence.
4. The exact Chinese translation for that example sentence.

Words: ${words.join(", ")}

Return ONLY a valid JSON array matching the schema below. No conversational text, no markdown code block backticks (like \`\`\`json), just raw JSON array content.

Schema:
[
  {
    "english": "word",
    "phonetic": "/phonetic/",
    "definition": "part-of-speech. Chinese meaning",
    "exampleEn": "The english example sentence.",
    "exampleZh": "例句的中文翻译。"
  }
]`;

      let parsedList;

      // Try DeepSeek first if configured
      if (process.env.DEEPSEEK_API_KEY) {
        try {
          console.log("Using DeepSeek for multi-word dictionary lookup...");
          const dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "You are a professional dictionary compiler. Respond with ONLY a raw JSON array matching the request. No markdown tags, no notes, no additional fields."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            })
          });

          if (dsResponse.ok) {
            const dsData = await dsResponse.json();
            const content = dsData.choices?.[0]?.message?.content || "[]";
            const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            let parsed = JSON.parse(cleanContent);
            
            // Standardize array result
            if (!Array.isArray(parsed)) {
              if (parsed.words && Array.isArray(parsed.words)) {
                parsed = parsed.words;
              } else if (parsed.data && Array.isArray(parsed.data)) {
                parsed = parsed.data;
              } else {
                const arrKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
                if (arrKey) {
                  parsed = parsed[arrKey];
                }
              }
            }
            
            if (Array.isArray(parsed)) {
              parsedList = parsed;
            }
          } else {
            console.warn(`DeepSeek API returned status ${dsResponse.status}`);
          }
        } catch (dsError) {
          console.error("DeepSeek lookup failed:", dsError);
        }
      }

      // Fallback to Gemini if DeepSeek is not configured or failed
      if (!parsedList && process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "[]";
        parsedList = JSON.parse(text.trim());
      }

      if (parsedList) {
        res.json(parsedList);
      } else {
        throw new Error("Both DeepSeek and Gemini API lookup engines failed.");
      }
    } catch (error: any) {
      console.error("Error looking up words:", error);
      res.status(500).json({ error: error.message || "Failed to lookup words via AI engines" });
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
