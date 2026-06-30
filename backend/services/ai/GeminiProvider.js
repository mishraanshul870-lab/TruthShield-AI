export class GeminiProvider {
  static async getSupportedModel(apiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          const searchOrder = [
            'models/gemini-2.5-flash',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-1.5-flash-latest'
          ];
          for (const preferred of searchOrder) {
            const match = data.models.find(m => m.name === preferred && m.supportedGenerationMethods?.includes('generateContent'));
            if (match) return match.name.split('/').pop();
          }
          const fallback = data.models.find(m => m.name.includes('gemini-') && m.supportedGenerationMethods?.includes('generateContent'));
          if (fallback) return fallback.name.split('/').pop();
        }
      }
    } catch (e) {
      console.warn('[GeminiProvider] Failed to auto-detect model:', e.message);
    }
    return 'gemini-2.5-flash';
  }

  static async callChat(systemPrompt, userPrompt, imageBuffer = null, mimeType = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      const err = new Error('Google AI Studio (Gemini) API Key is missing.');
      err.status = 401;
      throw err;
    }

    const modelName = await this.getSupportedModel(apiKey);
    console.log(`[GeminiProvider] Resolved active model: ${modelName}`);

    const parts = [
      {
        text: `${systemPrompt}\n\nUser Input:\n${userPrompt}`
      }
    ];

    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBuffer.toString('base64')
        }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Gemini API Error (${response.status})`;
      const err = new Error(errMsg);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty completion.');
    }

    return {
      result: JSON.parse(responseText),
      model: modelName
    };
  }
}
