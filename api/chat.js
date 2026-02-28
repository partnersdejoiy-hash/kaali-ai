import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});


export default async function handler(req,res){

try{

const messages=req.body.messages || [];

const userMessage=messages[messages.length-1]?.content || "";


// ================= PRODUCT SEARCH =================

if(userMessage.toLowerCase().includes("show") ||
userMessage.toLowerCase().includes("find") ||
userMessage.toLowerCase().includes("buy")){

let url=`${process.env.WC_URL}/wp-json/wc/v3/products?per_page=5&consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`;

let response=await fetch(url);

let products=await response.json();

let reply="Here are some products 🛍️\n\n";

products.forEach(p=>{

reply+=`• ${p.name}\n₹${p.price}\n${p.permalink}\n\n`;

});

return res.json({reply});

}



// ================= ORDER TRACKING =================

if(userMessage.includes("order")){

return res.json({

reply:"📦 I can track your order.\n\nPlease share your Order ID."

});

}



// ================= AI RESPONSE =================

const systemPrompt=`

You are KAALI AI of DEJOIY marketplace.

You help users:

- Find products
- Track orders
- Compare prices
- Shopping help

Speak friendly and smart.

Use emojis sometimes ✨🛍️📦

Reply in user's language.

`;



const aiResponse=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:systemPrompt
},
...messages
]

});


res.json({

reply:aiResponse.choices[0].message.content

});


}catch(e){

res.json({

reply:"⚠️ KAALI is reconnecting..."

});

}

}
