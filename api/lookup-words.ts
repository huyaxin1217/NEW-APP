import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'Neither Gemini nor DeepSeek API keys are configured.' });
    }

    const prompt = `You are a professional dictionary compiler. For each English word in the list below, generate:
1. Accurate IPA phonetic symbols (US accent, wrapped in slashes e.g., /ˌækʌˈdemɪk/).
2. A clear, concise Chinese definition (with part of speech, e.g. "v. 包含，包括" or "adj. 突然的").
3. A short, natural English example sentence.
4. The exact Chinese translation for that example sentence.

Words: ${words.join(', ')}

Return ONLY a valid JSON array matching the schema below. No conversational text, no markdown code block backticks, just raw JSON array content.

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
        console.log('Using DeepSeek for multi-word dictionary lookup...');
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
                content: 'You are a professional dictionary compiler. Respond with ONLY a raw JSON array matching the request. No markdown tags, no notes, no additional fields.'
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
          const content = dsData.choices?.[0]?.message?.content || '[]';
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
        console.error('DeepSeek lookup failed:', dsError);
      }
    }

    // Fallback to Gemini if DeepSeek is not configured or failed
    if (!parsedList && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '[]';
        parsedList = JSON.parse(text.trim());
      } catch (geminiErr) {
        console.error('Gemini lookup failed:', geminiErr);
      }
    }

    // Ultimate public dictionary API fallback
    if (!parsedList) {
      try {
        console.log('AI lookup failed or keys missing. Falling back to public dictionary API...');
        parsedList = await Promise.all(words.map(async (word) => {
          try {
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (dictRes.ok) {
              const dictData = await dictRes.json();
              let definition = 'n. 暂无释义';
              let exampleEn = '';
              let phonetic = `/${word}/`;

              if (dictData[0]) {
                phonetic = dictData[0].phonetic || dictData[0].phonetics?.[0]?.text || `/${word}/`;
                
                const meanings = dictData[0].meanings || [];
                if (meanings.length > 0) {
                  const firstMeaning = meanings[0];
                  const pos = firstMeaning.partOfSpeech || 'n';
                  const defText = firstMeaning.definitions?.[0]?.definition || '暂无解释';
                  definition = `${pos}. ${defText}`;
                  
                  for (const meaning of meanings) {
                    for (const def of meaning.definitions || []) {
                      if (def.example) {
                        exampleEn = def.example;
                        break;
                      }
                    }
                    if (exampleEn) break;
                  }
                }
              }

              return {
                english: word,
                phonetic,
                definition,
                exampleEn: exampleEn || 'No example found.',
                exampleZh: '（使用公开字典）'
              };
            }
          } catch (err) {
            console.error(`Dictionary API failed for ${word}:`, err);
          }
          return {
            english: word,
            phonetic: `/${word}/`,
            definition: 'n. 暂无释义 (请检查API密钥配置)',
            exampleEn: 'No example found.',
            exampleZh: '（请在Vercel Environment Variables中配置API密钥）'
          };
        }));
      } catch (fallbackErr) {
        console.error('Dictionary API fallback failed:', fallbackErr);
      }
    }

    if (parsedList) {
      return res.json(parsedList);
    } else {
      return res.status(500).json({ error: 'Both DeepSeek and Gemini API lookup engines failed.' });
    }
  } catch (error: any) {
    console.error('Error looking up words:', error);
    return res.status(500).json({ error: error.message || 'Failed to lookup words via AI engines' });
  }
}
