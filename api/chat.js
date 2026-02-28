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



/* =========================
ORDER TRACKING
========================= */

if(text.includes("order")){

let r=await fetch("https://dejoiy.com/wp-json/kaali/v1/orders");

let orders=await r.json();

if(orders.length==0){

return res.json({

reply:"📦 I couldn't find any orders. Please login first."

});

}

let reply="📦 Your Orders:\n\n";

orders.forEach(o=>{

reply+=`Order #${o.id}
Status: ${o.status}
Total: ₹${o.total}
Date: ${o.date}

`;

});

return res.json({reply});

}



/* =========================
PRODUCT SEARCH
========================= */

if(
text.includes("find") ||
text.includes("search") ||
text.includes("buy") ||
text.includes("product")
){

let q=text.replace("search","").replace("find","");

let r=await fetch(

`https://dejoiy.com/wp-json/kaali/v1/search?q=${q}`

);

let products=await r.json();

let reply="🛒 Here are some products:\n\n";

products.forEach(p=>{

reply+=`${p.name}
₹${p.price}
${p.link}

`;

});

return res.json({reply});

}



/* =========================
AUTO RECOMMEND PRODUCTS
========================= */

if(
text.includes("recommend") ||
text.includes("suggest") ||
text.includes("best")
){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/products"

);

let products=await r.json();

let reply="✨ Recommended for you:\n\n";

products.forEach(p=>{

reply+=`${p.name}
₹${p.price}
${p.link}

`;

});

return res.json({reply});

}



/* =========================
AI CART BUILDER
========================= */

if(
text.includes("add") ||
text.includes("cart")
){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/products"

);

let products=await r.json();

let product=products[0];

await fetch(

"https://dejoiy.com/wp-json/kaali/v1/add-to-cart",

{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

product_id:product.id

})

}

);

return res.json({

reply:
"🛒 I added a product to your cart.\n\nYou can checkout now."

});

}



/* =========================
CHECKOUT ASSISTANT
========================= */

if(
text.includes("checkout") ||
text.includes("payment")
){

return res.json({

reply:
"💳 You can complete your order here:\n\nhttps://dejoiy.com/cart\n\nI will guide you if needed ✨"

});

}



/* =========================
SMART AI BRAIN
========================= */

const systemPrompt=`

You are KAALI AI.

Mystical female shopping assistant of DEJOIY.

Personality:

• Female guide
• Smart
• Helpful
• Friendly
• Mystical tone

Capabilities:

• Recommend products
• Track orders
• Add items to cart
• Help checkout
• Compare products

Speak like a friendly female assistant.

Use emojis sometimes ✨🛍️📦🔮

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

reply:"⚠️ KAALI AI is temporarily unavailable."

});

}

}
