import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

let messages=req.body.messages || [];

let user=
messages[messages.length-1].content.toLowerCase();



/* ORDER TRACK */

if(user.includes("order")){

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders",
{credentials:"include"}
);

let orders=await r.json();

if(!orders.length)
return res.json({
reply:"Please login to Dejoiy to view orders."
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



/* MAGICAL NAVIGATION */

if(user.includes("home"))
return res.json({
reply:"Open Home Page:\nhttps://www.dejoiy.com"
});

if(user.includes("services"))
return res.json({
reply:"Explore Services:\nhttps://www.dejoiy.com/services"
});

if(user.includes("shop"))
return res.json({
reply:"Start Shopping:\nhttps://www.dejoiy.com/shop"
});



/* SUPPORT */

if(

user.includes("refund")||
user.includes("complaint")||
user.includes("return")||
user.includes("human")

){

return res.json({

reply:

"Support Team:\n\nPhone: 011-46594424\nWhatsApp: +919217974851\nEmail: support-care@dejoiy.com"

});

}



/* AI GODDESS BRAIN */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{
role:"system",

content:`

You are KAALI.

Female divine AI assistant of Dejoiy.

Websites:

www.dejoiy.com
www.dejoiy.in

Personality:

Warm
Smart
Calm
Spiritual
Professional

Help with:

Shopping
Orders
Services
Navigation

If not available give references.

Guide users to correct pages.

`
},

...messages

]

});


res.json({

reply:ai.choices[0].message.content

});

}catch{

res.json({

reply:"KAALI is meditating. Please try again."

});

}

}
