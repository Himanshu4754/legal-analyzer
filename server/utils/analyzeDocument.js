const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const analyzeDocument = async (extractedText) => {
  // Limit text to 8000 chars to stay within token limits
  const trimmedText = extractedText.substring(0, 8000);

  const prompt = `You are an expert legal document analyzer. Analyze the following legal document and respond ONLY with a valid JSON object. No explanation, no markdown, just pure JSON.

Analyze this document and return:
{
  "summary": "2-3 sentence plain English summary of what this document is about",
  "riskScore": <number between 1-10, where 10 is highest risk>,
  "riskLevel": "<Low|Medium|High>",
  "riskyClauses": [
    {
      "text": "the risky clause text (keep it short)",
      "risk": "<high|medium|low>",
      "explanation": "why this clause is risky in plain English"
    }
  ],
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}

Legal Document:
${trimmedText}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;

  // Clean and parse JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");

  return JSON.parse(jsonMatch[0]);
};

const askQuestion = async (extractedText, question) => {
  const trimmedText = extractedText.substring(0, 6000);

  const prompt = `You are a legal document assistant. Based on the following legal document, answer the user's question in simple plain English.

Legal Document:
${trimmedText}

User Question: ${question}

Give a clear, helpful answer in 2-4 sentences. If the answer is not in the document, say so.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
};

module.exports = { analyzeDocument, askQuestion };