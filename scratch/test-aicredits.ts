import OpenAI from 'openai';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = process.env.AICREDITS_BASE_URL || 'https://aicredits.in/v1';
const API_KEY = process.env.AICREDITS_API_KEY || '';
const MODEL = process.env.AICREDITS_MODEL || 'amazon/nova-lite-v1';

console.log('=== AICredits Pipeline Test ===');
console.log('Base URL:', BASE_URL);
console.log('Model:', MODEL);
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 15)}...` : '(not set)');

const client = new OpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
  timeout: 120000,
});

async function testTextOnly() {
  console.log('\n--- Test 1: Text-only request ---');
  const start = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'user', content: 'Say "hello" and nothing else.' },
      ],
      temperature: 0,
      max_tokens: 50,
    });
    console.log('✅ Response:', response.choices[0]?.message?.content);
    console.log(`   Took ${Date.now() - start}ms`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    console.log(`   Took ${Date.now() - start}ms`);
    return false;
  }
}

async function testWithImage() {
  console.log('\n--- Test 2: Image + text request (vision) ---');
  // Tiny 1x1 red PNG
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  const start = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${tinyPng.toString('base64')}`,
              },
            },
            { type: 'text', text: 'Describe this image in one sentence.' },
          ] as any,
        },
      ],
      temperature: 0,
    });
    console.log('✅ Response:', response.choices[0]?.message?.content);
    console.log(`   Took ${Date.now() - start}ms`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    console.log(`   Took ${Date.now() - start}ms`);
    return false;
  }
}

async function main() {
  const t1 = await testTextOnly();
  const t2 = await testWithImage();
  console.log('\n=== Results ===');
  console.log('Text-only:', t1 ? '✅ PASS' : '❌ FAIL');
  console.log('Image+text:', t2 ? '✅ PASS' : '❌ FAIL');
  if (t1 && t2) console.log('\n🎉 Pipeline is working!');
  else if (t1) console.log('\n⚠️ Text works but image fails');
  else console.log('\n❌ API connection issue');
}

main().catch(console.error);
