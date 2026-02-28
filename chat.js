import OpenAI from "openai";

const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req,res){

const message=req.body.message;

const response=await client.responses.create({

model:"gpt-4.1-mini",

input:message

});

res.json({
reply:response.output_text
})

}