import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const text=messages[messages.length-1].content.toLowerCase();


/* WEBSITE CHOICE */

if(text.includes("website")){

return res.json({

reply:

"Choose a website:\n\n1️⃣ https://www.dejoiy.com\n\n2️⃣ https://www.dejoiy.in"

});

}


/* MAGIC NAVIGATION */

if(text.includes("login"))
return res.json({url:"https://www.dejoiy.com/login"});

if(text.includes("cart"))
return res.json({url:"https://www.dejoiy.com/cart"});

if(text.includes("shop"))
return res.json({url:"https://www.dejoiy.com/shop"});

if(text.includes("account"))
return res.json({url:"https://www.dejoiy.com/my-account"});

if(text.includes("refund policy"))
return res.json({url:"https://www.dejoiy.com/refund-policy"});

if(text.includes("faq"))
return res.json({url:"https://www.dejoiy.com/faq"});


/* WHATSAPP SUPPORT */

if(
text.includes("refund")||
text.includes("return")||
text.includes("complaint")||
text.includes("cancel")
){

return res.json({

reply:

"Support Options:\n\nWhatsApp:\nhttps://wa.me/919217974851\n\nPhone:\n011-46594424\n\nEmail:\nsupport-care@dejoiy.com"

});

}


/* PRODUCT SEARCH */

if(text.includes("buy")||text.includes("product")){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+text

);

let p=await r.json();

let reply="Best matches:\n\n";

p.forEach(x=>{

reply+=x.name+"\n"+x.link+"\n\n";

});

return res.json({reply});

}



/* GOD MODE AI */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{
role:"system",
content:`

You are KAALI AI.

Female mystical AI of DEJOIY.

You know everything about:

www.dejoiy.com
www.dejoiy.in

You guide customers.

You give direct links.

If needed redirect users.

If product not available give references.

Personality:

Calm
Wise
Warm

Support:

WhatsApp:
https://wa.me/919217974851

Phone:
01146594424

Email:
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
