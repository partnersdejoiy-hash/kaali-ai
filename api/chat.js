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


/* =========================
ORDER TRACKING
========================= */

if(text.includes("order") || text.includes("track")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders",
{
headers:{
"Content-Type":"application/json"
}
});

if(!r.ok){

return res.json({
reply:
"📦 Please login to Dejoiy first to see your orders:\n\nhttps://www.dejoiy.com/login"
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
"\nTotal: ₹"+o.total+
"\nDate: "+o.date+
"\n\n";

});

return res.json({reply});

}catch(e){

return res.json({
reply:
"📦 Please login to your Dejoiy account:\n\nhttps://www.dejoiy.com/login"
});

}

}



/* =========================
PRODUCT SEARCH
========================= */

if(
text.includes("find")||
text.includes("search")||
text.includes("product")||
text.includes("buy")
){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/search?q="+encodeURIComponent(text)
);

let products=await r.json();

if(!products.length){

return res.json({
reply:"🛍️ No products found."
});

}

let reply="🛍️ Products:\n\n";

products.forEach(p=>{

reply+=
p.name+
"\n₹"+p.price+
"\n"+p.link+
"\n\n";

});

return res.json({reply});

}catch(e){

return res.json({
reply:"⚠️ Unable to search products"
});

}

}



/* =========================
RECOMMENDED PRODUCTS
========================= */

if(text.includes("recommend")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/products"
);

let products=await r.json();

let reply="✨ Recommended Products:\n\n";

products.forEach(p=>{

reply+=
p.name+
"\n₹"+p.price+
"\n"+p.link+
"\n\n";

});

return res.json({reply});

}catch(e){

return res.json({
reply:"⚠️ Unable to fetch recommendations"
});

}

}



/* =========================
SMART AI ENGINE
========================= */

const systemPrompt=`

You are KAALI AI.

You are a female mystical AI assistant of DEJOIY marketplace.

You help customers with:

• Products
• Orders
• Tracking
• Shopping
• Services

Websites:

https://www.dejoiy.com
https://www.dejoiy.in


If customer needs human help:

Support Team:

Phone: 011-46594424

WhatsApp: +919217974851

Email:

support-care@dejoiy.com


Personality:

• Calm
• Spiritual
• Warm
• Intelligent

You speak like a wise female guide.

Use emojis sometimes ✨🔮🛍️

Reply in user language.

Always keep responses short.

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

reply:"⚠️ KAALI is reconnecting... Please try again."

});

}

}
