import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize OpenAI client with api.aicredits.in endpoint
const apiKey = process.env.AICREDITS_API_KEY || 'sk-your-key-here';
const baseURL = process.env.AICREDITS_BASE_URL || 'https://api.aicredits.in/v1';
const model = process.env.AICREDITS_MODEL || 'amazon/nova-lite-v1';

console.log('Testing AICredits endpoint:');
console.log('Base URL:', baseURL);
console.log('Model:', model);
console.log('API Key:', apiKey ? (apiKey.substring(0, 7) + '...' + apiKey.slice(-4)) : 'Not set');

const client = new OpenAI({
  baseURL,
  apiKey,
});

async function main() {
  try {
    console.log(`\n1. Sending prompt to model "${model}"...`);
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant for Legal Metrology compliance verification.' },
        { role: 'user', content: 'Explain the mandatory declarations required on an Indian packaged commodity under LMPC Rules 2011 in 3 brief bullet points.' },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    console.log('\n--- Response from', model, '---');
    console.log(response.choices[0]?.message?.content);
    console.log('-------------------------------------\n');
  } catch (err: any) {
    console.error('\n❌ API Call Failed:');
    if (err.status) console.error('Status Code:', err.status);
    console.error('Message:', err.message);
    if (apiKey === 'sk-your-key-here') {
      console.log('\n👉 Note: Replace "sk-your-key-here" with your valid API key in .env.local (AICREDITS_API_KEY=your_key_here)');
    }
  }
}

main();
