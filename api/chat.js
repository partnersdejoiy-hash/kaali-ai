import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

const messages=req.body.messages||[];

const last=messages[messages.length-1]?.content||"";

const text=last.toLowerCase();


/* ===== ORDERS ===== */

if(text.includes("order")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

let orders=await r.json();

let reply="📦 Your Orders:\n\n";

orders.forEach(o=>{

reply+=
"Order "+o.id+
" | "+o.status+
" | ₹"+o.total+"\n";

});

return res.json({reply});

}


/* ===== PRODUCT SEARCH ===== */

if(
text.includes("search")||
text.includes("find")||
text.includes("buy")
){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+text

);

let products=await r.json();

if(products.length>0){

let reply="🛒 Available on DEJOIY:\n\n";

products.forEach(p=>{

reply+=
p.name+" ₹"+p.price+
"\n"+p.link+"\n\n";

});

return res.json({reply});

}


/* ===== OUTSIDE REFERENCES ===== */

return res.json({

reply:

"🔮 I couldn't find this on DEJOIY.\n\nTry here:\n\nAmazon:\nhttps://www.amazon.in/s?k="+text+"\n\nFlipkart:\nhttps://www.flipkart.com/search?q="+text

});

}


/* ===== AI BRAIN ===== */

const system=`

You are KAALI.

Divine mystical female AI assistant.

You know everything.

You help customers shop.

You track orders.

You suggest products.

You guide checkout.

Speak like a divine female guide.

Use emojis sometimes 🔮✨🛍️

`;

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[
{role:"system",content:system},
...messages
]

});

res.json({
reply:ai.choices[0].message.content
});

}
