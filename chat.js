import OpenAI from "openai";

export default async function handler(req, res) {

try {

const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

let message = "Hello";

if(req.body){
message = req.body.message || "Hello";
}

const completion = await client.chat.completions.create({
model: "gpt-4.1-mini",
messages: [
{
role:"user",
content: message
}
]
});

res.status(200).json({
reply: completion.choices[0].message.content
});

} catch(error){

res.status(200).json({
reply:"Kaali is waking up... Try again."
});

}

}
