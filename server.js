const express = require('express');
const { Groq } = require('groq-sdk');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Allow frontend (GitHub Pages) to connect without CORS blocks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: 'No message received!' });
  }

  // YEOM personality prompt
  const fullPrompt = `You are YEOM AI, a confident, refined fashion advisor. Give elegant, practical outfit suggestions for photos, events, dates, or daily wear. Be positive, concise, and empowering. User: ${message}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: fullPrompt }],
      model: 'llama-3.1-8b-instant', // Fast, cheap on free tier
      temperature: 0.7,
      max_tokens: 250
    });

    const reply = completion.choices[0]?.message?.content.trim() || 'Advice coming soon—try again!';
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Quick break—try again in a sec!' });
  }
});

app.listen(port, () => {
  console.log(`YEOM backend live on port ${port}`);
});
