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
"https://www.dejoiy.com/wp-json/kaali/v1/orders"
);

if(!r.ok){

return res.json({

reply:"Login to view orders",

goto:"https://www.dejoiy.com/login"

});

}

let orders=await r.json();

if(!orders.length){

return res.json({

reply:"No recent orders found"

});

}

let reply="Your orders:\n\n";

orders.forEach(o=>{

reply+=
"Order #"+o.id+
"\nStatus "+o.status+
"\nTotal ₹"+o.total+
"\n\n";

});

return res.json({reply});

}



/* HUMAN SUPPORT */

if(

text.includes("refund")||
text.includes("return")||
text.includes("complaint")||
text.includes("cancel")||
text.includes("human")

){

return res.json({

reply:

"Contact Support:\n\nhttps://wa.me/919217974851\n\n01146594424\n\nsupport-care@dejoiy.com",

goto:"https://wa.me/919217974851"

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
"https://www.dejoiy.com/wp-json/kaali/v1/search?q="+text
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



/* SUPREME AI */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{
role:"system",
content:`

You are KAALI SUPREME AI.

You remember conversation.

Never say you have no memory.

You know everything about:

www.dejoiy.com
www.dejoiy.in

You always give useful answers.

If possible include website links.

You continuously learn from:

Products
Policies
FAQs
Services

Support:

https://wa.me/919217974851

support-care@dejoiy.com

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
