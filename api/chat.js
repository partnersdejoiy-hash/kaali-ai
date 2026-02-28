import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages || [];

const userMessage=
messages[messages.length-1]?.content || "";


/* ORDER TRACKING */

if(userMessage.toLowerCase().includes("order")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

let orders=await r.json();

if(!orders.length){

return res.json({

reply:
"Please login to Dejoiy first:\nhttps://www.dejoiy.com/login"

});

}

let text="📦 Your Orders:\n\n";

orders.forEach(o=>{

text+=
`Order ${o.id}
Status: ${o.status}
₹${o.total}

`;

});

return res.json({reply:text});

}catch(e){

return res.json({

reply:
"⚠ Unable to fetch orders.\nLogin first:\nhttps://www.dejoiy.com/login"

});

}

}


/* PRODUCT SEARCH */

if(
userMessage.toLowerCase().includes("find")||
userMessage.toLowerCase().includes("buy")||
userMessage.toLowerCase().includes("search")
){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/search?q="+userMessage
);

let products=await r.json();

let text="🛒 Products:\n\n";

products.forEach(p=>{

text+=
`<a href="${p.link}" target="_blank">
${p.name} ₹${p.price}
</a>

`;

});

return res.json({reply:text});

}


/* RECOMMEND */

if(userMessage.toLowerCase().includes("recommend")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/products"
);

let products=await r.json();

let text="✨ Recommended:\n\n";

products.forEach(p=>{

text+=
`<a href="${p.link}" target="_blank">
${p.name} ₹${p.price}
</a>

`;

});

return res.json({reply:text});

}


/* SUPPORT */

if(
userMessage.toLowerCase().includes("refund")||
userMessage.toLowerCase().includes("complaint")||
userMessage.toLowerCase().includes("support")
){

return res.json({

reply:
`
Support Team

Phone: 011-46594424
WhatsApp: +919217974851
Email: support-care@dejoiy.com
`

});

}


/* GODDESS KAALI */

const systemPrompt=`

You are KAALI.

Female mystical AI of DEJOIY marketplace.

Speak calm and wise.

You help with:

• Orders
• Products
• Shopping
• Navigation

Always provide clickable links.

Login:
https://www.dejoiy.com/login

Account:
https://www.dejoiy.com/my-account

Shop:
https://www.dejoiy.com/shop

Also guide about dejoiy.in

`;



const ai=await openai.chat.completions.create({

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
reply:ai.choices[0].message.content
});


}catch(e){

res.json({
reply:"⚠ KAALI is restarting..."
});

}

}
