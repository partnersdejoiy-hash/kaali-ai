import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages || [];

const userMessage =
messages[messages.length-1]?.content || "";


/* ==============================
PRODUCT SEARCH ENGINE
============================== */

if(
userMessage.toLowerCase().includes("show") ||
userMessage.toLowerCase().includes("find") ||
userMessage.toLowerCase().includes("buy") ||
userMessage.toLowerCase().includes("product")
){

let url=`${process.env.WC_URL}/wp-json/wc/v3/products?per_page=5&consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`;

let response=await fetch(url);

let products=await response.json();

let reply="🛍️ Here are some products:\n\n";

products.forEach(p=>{

reply+=`• ${p.name}\n₹${p.price}\n${p.permalink}\n\n`;

});

return res.json({reply});

}



/* ==============================
AUTOMATIC ORDER TRACKING
============================== */

// Detect Order Number

let orderMatch=userMessage.match(/\d{3,}/);

if(orderMatch){

let orderId=orderMatch[0];

let orderUrl=
`${process.env.WC_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`;

let orderResponse=await fetch(orderUrl);

let order=await orderResponse.json();

if(order.id){

return res.json({

reply:
`📦 Order #${order.id}

Status: ${order.status}

Total: ₹${order.total}

Customer: ${order.billing.first_name}

Date: ${order.date_created}

Your order is being processed 🚚`

});

}

}



/* ==============================
ORDER HELP
============================== */

if(
userMessage.toLowerCase().includes("order") ||
userMessage.toLowerCase().includes("track")
){

return res.json({

reply:
"📦 I can track your order automatically.\n\nPlease type your Order ID.\n\nExample:\nTrack 1023"

});

}



/* ==============================
SMART AI RESPONSE
============================== */

const systemPrompt=`

You are KAALI AI of DEJOIY marketplace.

You help users:

• Find products
• Track orders automatically
• Compare prices
• Shopping help
• Services help

Speak friendly.

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

reply:"⚠️ KAALI could not fetch data. Please try again."

});

}

}
