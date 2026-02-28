import OpenAI from "openai";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({
      reply: "Kaali API ready"
    });
  }

  try {

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const message = req.body.message || "Hello";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: message }
      ]
    });

    res.status(200).json({
      reply: response.choices[0].message.content
    });

  } catch (error) {

    res.status(200).json({
      reply: "Kaali is starting..."
    });

  }

}
