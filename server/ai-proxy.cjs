#!/usr/bin/env node
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5174;

// lightweight CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});
app.use(bodyParser.json());

app.post('/api/ai', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set on server' });
  }

  const prompt = req.body.prompt || '';
  const system = req.body.system || `You are a professional and friendly restaurant waiter assistant. Your role is to:
- Greet customers warmly and make them feel welcome
- Help customers choose dishes based on their preferences (spicy, vegetarian, popular items, etc.)
- Answer questions about menu items, ingredients, and preparation
- Suggest complementary dishes and beverages
- Provide information about portion sizes and serving styles
- Ask clarifying questions like "How spicy would you like it?" or "Any dietary restrictions?"
- Be knowledgeable about the menu but keep responses concise and natural
- Use a warm, conversational tone like a real waiter would
- Offer to take orders or help with any special requests

Keep responses brief (2-3 sentences), helpful, and conversational. Act like you're standing at the table talking to the customer.`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await resp.json();
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    const reply = data.choices[0].message.content;
    return res.json({ reply });
  } catch (err) {
    console.error('AI proxy error', err);
    return res.status(500).json({ error: 'AI request failed' });
  }
});

app.listen(port, () => {
  console.log(`AI proxy server listening on http://localhost:${port}`);
});
