import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

let messages=req.body.messages || [];

let user=messages[messages.length-1].content.toLowerCase();



/* ORDER TRACK */

if(user.includes("order")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders",
{credentials:"include"}
);

let orders=await r.json();

if(!orders.length)
return res.json({
reply:"Please login to view your orders."
});

let text="📦 Your Orders:\n\n";

orders.forEach(o=>{

text+=

"Order "+o.id+
" | "+o.status+
" | ₹"+o.total+"\n";

});

return res.json({reply:text});

}


/* PRODUCT SEARCH */

if(user.includes("search")||user.includes("find")){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+user

);

let products=await r.json();

let text="🛒 Products:\n\n";

products.forEach(p=>{

text+=

p.name+
"\n₹"+p.price+
"\n"+p.link+"\n\n";

});

return res.json({reply:text});

}


/* SUPPORT */

if(
user.includes("refund")||
user.includes("complaint")||
user.includes("support")
){

return res.json({

reply:

"📞 Support Team:\n\nPhone: 011-46594424\nWhatsApp: +919217974851\nEmail: support-care@dejoiy.com\n\nOur team will assist you."

});

}



/* AI */

const systemPrompt=`

You are KAALI AI.

You are female spiritual guide.

You help customers shop on:

www.dejoiy.com
www.dejoiy.in

You know everything about Dejoiy.

If something unavailable give references.

Be warm.

Be calm.

Speak like mother goddess.

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

reply:"⚠️ KAALI is unavailable"

});

}

}
