import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "https://dejoiy.com");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const formidable = (await import("formidable")).default;
    const fs = await import("fs");

    const form = formidable();

    const [fields, files] = await form.parse(req);

    const prompt = fields.prompt?.[0] || "";

    let imageBase64 = null;

    if (files.file) {
      const file = files.file[0];
      const buffer = fs.readFileSync(file.filepath);
      imageBase64 = buffer.toString("base64");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    let messages = [
      {
        role: "system",
        content: `You are KAALI SUPREME EDITOR.
Return JSON only:
{
  "action": "",
  "data": {}
}`
      },
      {
        role: "user",
        content: prompt
      }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analyze this image for marketplace action." },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    }

    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages
    });

    let result = JSON.parse(ai.choices[0].message.content);

    await fetch("https://dejoiy.com/wp-json/kaali/v2/editor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kaali-secret": "KAALI_SUPREME_2026"
      },
      body: JSON.stringify(result)
    });

    res.json({ result: "KAALI SUPREME executed successfully." });

  } catch (e) {

    console.error(e);
    res.json({ result: "Editor Error" });

  }
}
