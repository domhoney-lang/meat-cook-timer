import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { meat, cut, weight, doneness } = req.body;

  if (!process.env.REACT_APP_GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a professional Michelin-star roast chef. Give one single, specific, high-impact cooking tip for roasting ${weight} of ${meat} (${cut}, ${doneness}). Focus on technique, seasoning, or resting. Keep it under 25 words. Do not use generic advice like "enjoy".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ tip: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate tip' });
  }
}
