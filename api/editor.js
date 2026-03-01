import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "https://dejoiy.com");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ result: "No prompt provided" });
    }

    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
         content: `
You are KAALI SUPREME EDITOR.

When user says:

- "add page X" → action: "create_page"
- "add product X price Y stock Z" → action: "add_product"
- "delete product id X" → action: "delete_product"

Always return strict JSON:

{
  "action": "action_name",
  "data": { ... }
}
`
          `
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = ai.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(content);
    } catch (err) {
      return res.status(500).json({ result: "AI did not return valid JSON" });
    }

   await fetch("https://dejoiy.com/wp-json/kaali/v2/editor", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-kaali-secret": "KAALI_SUPREME_2026"
  },
  body: JSON.stringify(result)
});
    return res.status(200).json({
      result: "KAALI SUPREME executed successfully."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      result: "Editor Error"
    });
  }
}
