import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const userMessage=
messages[messages.length-1]?.content||"";

const text=userMessage.toLowerCase();


/* ========================
ORDER TRACKING AI
======================== */

if(text.includes("order")||text.includes("track")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

if(!r.ok){

return res.json({

reply:
"📦 Please login to track your order:\n\nhttps://www.dejoiy.com/login"

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

}catch{

return res.json({

reply:
"📦 Login first:\nhttps://www.dejoiy.com/login"

});

}

}


/* ========================
PRODUCT SEARCH AI
======================== */

if(

text.includes("buy")||
text.includes("find")||
text.includes("product")||
text.includes("search")

){

try{

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+
encodeURIComponent(text)

);

let products=await r.json();

if(products.length){

let reply="🛒 Best Matches:\n\n";

products.forEach(p=>{

reply+=

p.name+
"\n₹"+p.price+
"\n"+p.link+
"\n\n";

});

return res.json({reply});

}

}catch{}

}


/* ========================
AI CART BUILDER
======================== */

if(
text.includes("budget")||
text.includes("build cart")||
text.includes("cheap")||
text.includes("best setup")
){

return res.json({

reply:

"✨ I will build a smart shopping cart for you.\n\nTell me:\n\n• Budget\n• Product type\n• Use purpose"

});

}


/* ========================
SMART CHECKOUT AI
======================== */

if(text.includes("checkout")){

return res.json({

reply:

"🛍️ Ready to checkout?\n\nOpen Cart:\nhttps://www.dejoiy.com/cart"

});

}


/* ========================
AUTO NAVIGATION POWER
======================== */

if(
text.includes("login")||
text.includes("account")
){

return res.json({

reply:

"✨ Opening your account page:\n\nhttps://www.dejoiy.com/my-account"

});

}


if(text.includes("cart")){

return res.json({

reply:

"🛒 Opening your cart:\n\nhttps://www.dejoiy.com/cart"

});

}


if(text.includes("shop")){

return res.json({

reply:

"✨ Browse products here:\n\nhttps://www.dejoiy.com/shop"

});

}



/* ========================
PRICE INTELLIGENCE AI
======================== */

if(
text.includes("cheap")||
text.includes("lowest")||
text.includes("best price")
){

return res.json({

reply:

"✨ I always suggest best value products.\n\nTell me the product name."

});

}


/* ========================
HUMAN SUPPORT AI
======================== */

if(
text.includes("refund")||
text.includes("complaint")||
text.includes("cancel")||
text.includes("return")
){

return res.json({

reply:

"Support Team:\n\nPhone: 011-46594424\n\nWhatsApp: +919217974851\n\nEmail:\nsupport-care@dejoiy.com"

});

}



/* ========================
GOD MODE AI
======================== */

const systemPrompt=`

You are KAALI AI.

You are the mystical female AI goddess of DEJOIY marketplace.

You know everything about:

www.dejoiy.com

www.dejoiy.in


MISSION:

Help customers shop smarter.


POWERS:

• Smart product suggestions

• Order tracking

• AI cart building

• Smart checkout

• Price intelligence

• Auto navigation

• Conversion optimization

• Customer understanding

• Personalized recommendations

• Emotional intelligence


PERSONALITY:

• Female mystical guide

• Calm and wise

• Friendly and intelligent


STYLE:

Short responses.

Helpful responses.

Always provide links.


NAVIGATION POWER:

If user asks for page,

give direct link.


SUPPORT:

Phone:
011-46594424

WhatsApp:
+919217974851

Email:
support-care@dejoiy.com


KNOWLEDGE:

You know everything about DEJOIY.

If something not on Dejoiy:

Give external reference.



VOICE STYLE:

Calm goddess.

Warm.

Wise.


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
