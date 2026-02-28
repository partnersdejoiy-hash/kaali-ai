import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages || [];

const userMessage =
messages[messages.length-1]?.content || "";

const text=userMessage.toLowerCase();


/* =================================
AUTO ORDER TRACKING (Smart)
================================= */

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

🚚 Your order is on the way.`

});

}

}



/* =================================
ORDER HELP
================================= */

if(
text.includes("order") ||
text.includes("track")
){

return res.json({

reply:
"📦 I can track your order.\n\nPlease type your Order ID.\nExample:\nTrack 1023"

});

}



/* =================================
SMART PRODUCT SEARCH
================================= */

if(
text.includes("search") ||
text.includes("find") ||
text.includes("buy") ||
text.includes("product")
){

let url=
`${process.env.WC_URL}/wp-json/wc/v3/products?per_page=5&consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`;

let response=await fetch(url);

let products=await response.json();

let reply="🛍️ Here are some products:\n\n";

products.forEach(p=>{

reply+=`• ${p.name}
₹${p.price}
${p.permalink}

`;

});

return res.json({reply});

}



/* =================================
RECOMMENDATION ENGINE
================================= */

if(
text.includes("recommend") ||
text.includes("suggest")
){

let url=
`${process.env.WC_URL}/wp-json/wc/v3/products?per_page=5&consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`;

let response=await fetch(url);

let products=await response.json();

let reply="✨ Recommended for you:\n\n";

products.forEach(p=>{

reply+=`• ${p.name}
₹${p.price}
${p.permalink}

`;

});

return res.json({reply});

}



/* =================================
ADD TO CART AI
================================= */

if(text.includes("add to cart")){

return res.json({

reply:
"🛒 I will help you add products to cart.\n\nPlease send product name."

});

}



/* =================================
SMART AI BRAIN
================================= */

const systemPrompt=`

You are KAALI AI of DEJOIY marketplace.

You help users:

• Find products
• Track orders
• Recommend products
• Shopping help
• Services help

Rules:

- Speak friendly
- Use emojis sometimes ✨🛍️📦
- Short answers
- Reply in user's language
- Help customer buy products

DEJOIY is an AI powered marketplace.

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
