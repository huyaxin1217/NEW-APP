import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'Neither Gemini nor DeepSeek API keys are configured.' });
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
        const dsResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are a professional dictionary compiler. Respond only in raw JSON objects.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (dsResponse.ok) {
          const dsData = await dsResponse.json();
          const content = dsData.choices?.[0]?.message?.content || '{}';
          const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanContent);
        } else {
          console.warn(`DeepSeek API returned status ${dsResponse.status}`);
        }
      } catch (dsError) {
        console.error('DeepSeek API failed:', dsError);
      }
    }

    // Fallback to Gemini if DeepSeek is not configured or failed
    if (!parsed && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

        const text = response.text || '{}';
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(jsonStr);
      } catch (aiError) {
        console.warn('Gemini API failed, falling back to dictionary API.');
      }
    }

    // Ultimate dictionary API fallback
    if (!parsed) {
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          let fallbackExample = '';
          
          for (const meaning of dictData[0]?.meanings || []) {
            for (const def of meaning.definitions || []) {
              if (def.example) {
                fallbackExample = def.example;
                break;
              }
            }
            if (fallbackExample) break;
          }
          
          if (fallbackExample) {
            parsed = {
              exampleEn: fallbackExample,
              exampleZh: '（使用公开字典）'
            };
          } else {
            parsed = {
              exampleEn: 'No example found.',
              exampleZh: '（未找到例句）'
            };
          }
        } else {
          parsed = {
            exampleEn: 'API error. Please try again later.',
            exampleZh: '（接口报错，请稍后再试）'
          };
        }
      } catch (fetchError) {
        console.error('Dictionary API fetch failed:', fetchError);
        parsed = {
          exampleEn: 'Network error fetching example.',
          exampleZh: '（网络错误）'
        };
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating example:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate example' });
  }
}
