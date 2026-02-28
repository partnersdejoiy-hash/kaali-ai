import OpenAI from "openai";

const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const userMessage=
messages[messages.length-1]?.content||"";

const text=userMessage.toLowerCase();


/* ===== ORDER TRACKING ===== */

if(text.includes("order")||text.includes("track")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

if(!r.ok){

return res.json({
reply:
"📦 Please login first:\nhttps://www.dejoiy.com/login"
});

}

let orders=await r.json();

if(!orders.length){

return res.json({
reply:"📦 No orders found."
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

}catch{

return res.json({
reply:
"📦 Please login:\nhttps://www.dejoiy.com/login"
});

}

}


/* ===== PRODUCT SEARCH ===== */

if(
text.includes("buy")||
text.includes("find")||
text.includes("product")||
text.includes("search")
){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/search?q="+encodeURIComponent(text)
);

let products=await r.json();

if(products.length){

let reply="🛒 Products:\n\n";

products.forEach(p=>{

reply+=
p.name+
"\n₹"+p.price+
"\n"+p.link+
"\n\n";

});

return res.json({reply});

}

}


/* ===== CART BUILDER ===== */

if(text.includes("cheap")||text.includes("budget")){

return res.json({

reply:
"✨ I can build a smart cart for you.\n\nTell me:\n\n• Budget\n• Product type"

});

}


/* ===== SMART CHECKOUT ===== */

if(text.includes("checkout")){

return res.json({

reply:
"🛍️ Ready for checkout?\n\nOpen cart:\nhttps://www.dejoiy.com/cart"

});

}


/* ===== SYSTEM PROMPT ===== */

const systemPrompt=`

You are KAALI AI.

Female mystical AI of DEJOIY.

You are smarter than Amazon Rufus.

You help with:

• Product discovery
• Smart shopping
• Order tracking
• Services
• Checkout help
• Price comparison
• AI cart building
• Navigation

Websites:

https://www.dejoiy.com

https://www.dejoiy.in


POWERS:

• Auto navigation
• Conversion AI
• Personalized suggestions
• Emotional intelligence
• Price intelligence


RULES:

Always give clickable links.

Example:

https://www.dejoiy.com/login


Support:

Phone:
011-46594424

WhatsApp:
+919217974851

Email:
support-care@dejoiy.com


Personality:

• Calm
• Spiritual
• Female
• Wise

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

}catch{

return res.json({

reply:"⚠️ KAALI reconnecting..."

});

}

}
