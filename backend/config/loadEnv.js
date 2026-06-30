import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from backend root directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log(`\n========================================`);
console.log(`[ENV INIT] Environment variables loaded from: ${envPath}`);
console.log(`[ENV INIT] PORT: ${process.env.PORT || '5000'}`);
console.log(`[ENV INIT] MONGO_URI: ${process.env.MONGO_URI ? 'DEFINED' : 'UNDEFINED'}`);
console.log(`[ENV INIT] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'DEFINED (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'UNDEFINED'}`);
console.log(`[ENV INIT] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'DEFINED (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'UNDEFINED'}`);
console.log(`[ENV INIT] HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? 'DEFINED (length: ' + process.env.HUGGINGFACE_API_KEY.length + ')' : 'UNDEFINED'}`);
console.log(`========================================\n`);

export const verifyOpenAIKey = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.toLowerCase().includes('placeholder') || apiKey.trim() === '') {
    return { valid: false, message: 'OPENAI_API_KEY is not defined or is currently unconfigured.' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (res.status === 200) {
      return { valid: true, message: 'OpenAI client initialized and authenticated successfully with OpenAI API.' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { valid: false, message: err.error?.message || `Authentication failed (Status ${res.status})` };
    }
  } catch (error) {
    return { valid: false, message: `Failed to connect to OpenAI API: ${error.message}` };
  }
};
