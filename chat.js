import OpenAI from "openai";

export default async function handler(req, res) {

try {

const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

const message = req.body.message || "Hello";

const response = await client.responses.create({
model: "gpt-4.1-mini",
input: message
});

res.status(200).json({
reply: response.output_text
});

} catch(error){

res.status(500).json({
reply:"Kaali is waking up... Try again."
});

}

}
