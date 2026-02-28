import OpenAI from "openai";

const openai = new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages;

const last=messages[messages.length-1].content;

/* ORDER */

if(last.toLowerCase().includes("order")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders",
{credentials:"include"}
);

let orders=await r.json();

if(orders.length==0){

return res.json({
reply:"Please login to Dejoiy to see your orders:\nhttps://www.dejoiy.com/login"
});

}

let text="📦 Your Orders:\n";

orders.forEach(o=>{

text+=
"Order "+o.id+
" | "+o.status+
" | ₹"+o.total+"\n";

});

return res.json({reply:text});

}


/* PRODUCT SEARCH */

if(last.toLowerCase().includes("find")
|| last.toLowerCase().includes("search")){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+last

);

let products=await r.json();

let text="🛒 Products:\n";

products.forEach(p=>{

text+=

p.name+
" ₹"+p.price+
"\n"+p.link+"\n\n";

});

return res.json({reply:text});

}


/* AI BRAIN */

const systemPrompt=`

You are KAALI.

Mystical female AI assistant of DEJOIY.

You know:

www.dejoiy.com
www.dejoiy.in

You help with:

• Shopping
• Orders
• Services
• Navigation

Always include clickable links.

Always guide users to pages.

Speak warm and spiritual.

`;

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{role:"system",content:systemPrompt},

...messages

]

});

res.json({

reply:ai.choices[0].message.content

});

}catch(e){

res.json({

reply:"KAALI could not respond."

});

}

}
