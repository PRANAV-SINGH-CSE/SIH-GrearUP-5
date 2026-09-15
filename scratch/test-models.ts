import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEYS } from '../src/lib/gemini/gemini-client';

async function testMultimodal() {
  const svg = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="20" y="50" font-family="Arial" font-size="20" font-weight="bold" fill="#000000">TATA TEA GOLD</text>
      <text x="20" y="90" font-family="Arial" font-size="16" fill="#000000">Net Qty: 250 g</text>
      <text x="20" y="130" font-family="Arial" font-size="16" fill="#000000">MRP: Rs. 140.00</text>
    </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEYS[0] });

  const flashModels = [
    'gemini-3.5-flash-lite',
    'Gemini 2.5 Flash Lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
  ];

  for (const model of flashModels) {
    try {
      console.log(`Testing multimodal on "${model}"...`);
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: buf.toString('base64'),
                  mimeType: 'image/jpeg',
                },
              },
              { text: 'Extract the text and net quantity in JSON format {"name": "...", "netQty": "..."}' },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });
      console.log(`SUCCESS [${model}]:`, res.text?.trim());
      break;
    } catch (e: any) {
      console.log(`FAILED [${model}]:`, e.message);
    }
  }
}

testMultimodal().catch(console.error);
