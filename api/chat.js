import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const text=
messages[messages.length-1].content.toLowerCase();


/* ORDER TRACKING */

if(text.includes("order")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

if(!r.ok){

return res.json({
reply:"Please login to see orders",
goto:"https://www.dejoiy.com/login"
});

}

let orders=await r.json();

if(!orders.length){

return res.json({
reply:"No recent orders found."
});

}

let reply="Your Orders:\n\n";

orders.forEach(o=>{

reply+=
"Order #"+o.id+
"\nStatus: "+o.status+
"\nTotal ₹"+o.total+
"\n\n";

});

return res.json({reply});

}


/* POLICY EXPLANATION */

if(text.includes("refund")){

return res.json({

reply:

"Refunds are available for eligible products within policy limits.",

goto:"https://www.dejoiy.com/refund-policy"

});

}


/* NAVIGATION */

if(text.includes("login"))
return res.json({
url:"https://www.dejoiy.com/login"
});

if(text.includes("cart"))
return res.json({
url:"https://www.dejoiy.com/cart"
});

if(text.includes("account"))
return res.json({
url:"https://www.dejoiy.com/my-account"
});


/* PRODUCT SEARCH */

if(text.includes("product")||text.includes("buy")){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+text

);

let p=await r.json();

let reply="Best Matches:\n\n";

p.forEach(x=>{

reply+=x.name+"\n";

});

return res.json({

reply,

goto:p[0]?.link

});

}



/* AI MEMORY */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{
role:"system",
content:`

You are KAALI AI.

You have memory.

You remember the conversation.

Never say you have no memory.

You help with:

Orders
Products
Policies
Navigation

You guide dejoiy customers.

`
},

...messages

]

});


return res.json({

reply:ai.choices[0].message.content

});

}catch{

res.json({

reply:"KAALI reconnecting..."

});

}

}
