import OpenAI from "openai";

export default async function handler(req,res){

if(req.method !== "POST"){

return res.json({
reply:"Kaali API working"
});

}


const openai=new OpenAI({

apiKey:process.env.OPENAI_API_KEY

});


const messages=req.body.messages || [];



messages.unshift({

role:"system",

content:`

You are Kaali AI of DEJOIY marketplace.

You help users:

- Shop products
- Track orders
- Compare prices
- Find services

Be helpful and short.

Remember conversation.

`

});


const response=await openai.chat.completions.create({

model:"gpt-4.1-mini",

messages:messages

});


res.json({

reply:response.choices[0].message.content

});

}
