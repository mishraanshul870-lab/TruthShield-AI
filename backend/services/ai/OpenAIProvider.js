export class OpenAIProvider {
  static async callChat(systemPrompt, userPrompt, imageBuffer = null, mimeType = null) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const err = new Error('OpenAI API Key is missing.');
      err.status = 401;
      throw err;
    }

    let userMessageContent = userPrompt;
    if (imageBuffer) {
      const mime = mimeType || 'image/jpeg';
      const base64Data = imageBuffer.toString('base64');
      userMessageContent = [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mime};base64,${base64Data}`
          }
        }
      ];
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `OpenAI API Error (${response.status})`;
      const err = new Error(errMsg);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error('OpenAI API returned an empty completion.');
    }

    return JSON.parse(responseText);
  }
}
