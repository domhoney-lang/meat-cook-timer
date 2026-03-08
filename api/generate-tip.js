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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const tipTypes = [
      "cooking technique or seasoning advice (not resting)",
      "wine pairing recommendation",
      "side dish suggestion that complements this roast",
      "sauce or gravy idea specific to this meat"
    ];
    const selectedType = tipTypes[Math.floor(Math.random() * tipTypes.length)];

    const prompt = `You are a professional Michelin-star roast chef. Give one single, specific, high-impact ${selectedType} for roasting ${weight} of ${meat} (${cut}, ${doneness}). Keep it under 25 words. Do not use generic advice like "enjoy".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = '';
    try {
      text = response.text ? response.text() : '';
    } catch (_) {}
    if (!text || !String(text).trim()) {
      text = 'Let the meat rest under foil for the full 20 minutes—it keeps the juices in.';
    }
    res.status(200).json({ tip: String(text).trim() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate tip' });
  }
}
