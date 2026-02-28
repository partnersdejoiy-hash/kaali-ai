import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages || [];

const userMessage=
messages[messages.length-1]?.content || "";

const text=userMessage.toLowerCase();



/* ORDERS */

if(text.includes("order")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

if(!r.ok){

return res.json({
reply:"📦 Please login first:\nhttps://www.dejoiy.com/login"
});

}

let orders=await r.json();

if(!orders.length){

return res.json({
reply:"📦 No recent orders found."
});

}

let reply="📦 Your Orders:\n\n";

orders.forEach(o=>{

reply+=
"Order #"+o.id+
"\nStatus: "+o.status+
"\n₹"+o.total+
"\n\n";

});

return res.json({reply});

}catch(e){

return res.json({
reply:"📦 Login to check orders:\nhttps://www.dejoiy.com/login"
});

}

}


/* SMART AI */

const systemPrompt=`

You are KAALI AI.

Female mystical ecommerce assistant.

You guide customers of:

www.dejoiy.com
www.dejoiy.in

You help with:

Shopping
Orders
Products
Services
Navigation

You are calm wise female guide.

Speak spiritual but practical.

Give direct links.

Support:

Phone: 011-46594424
Whatsapp: +919217974851
Email:

support-care@dejoiy.com

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


return res.json({

reply:aiResponse.choices[0].message.content

});

}catch(e){

return res.json({

reply:"⚠️ KAALI is reconnecting..."

});

}

}
