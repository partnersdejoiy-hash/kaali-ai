import OpenAI from "openai";

export const config = {
  runtime: "nodejs"
};

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: message }
      ]
    });

    res.status(200).json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {

    res.status(200).json({
      reply: "Kaali is waking up..."
    });

  }

}
