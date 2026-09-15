import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: "https://api.aicredits.in/v1",
  apiKey: process.env.AICREDITS_API_KEY,
});

async function main() {
  console.log('Testing google/gemini-3.1-flash-lite on AICredits...');
  console.log('API Key:', process.env.AICREDITS_API_KEY?.slice(0, 12) + '...');
  
  const start = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: "google/gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is 2+2? Reply with just the number." },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    console.log(`✅ SUCCESS (${Date.now() - start}ms):`, response.choices[0].message.content);
  } catch (err: any) {
    console.log(`❌ FAILED (${Date.now() - start}ms):`, err.message);
    if (err.status) console.log('  HTTP Status:', err.status);
    if (err.error) console.log('  Error:', JSON.stringify(err.error, null, 2));
  }
}

main();
