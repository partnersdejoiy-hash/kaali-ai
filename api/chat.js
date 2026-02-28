import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const text=messages[messages.length-1].content.toLowerCase();



/* LOGIN */

if(text.includes("login"))
return res.json({
reply:"You can login to your Dejoiy account.",
goto:"https://www.dejoiy.com/login"
});


/* CART */

if(text.includes("cart"))
return res.json({
reply:"Opening your cart.",
goto:"https://www.dejoiy.com/cart"
});


/* SHOP */

if(text.includes("shop"))
return res.json({
reply:"Browse products here.",
goto:"https://www.dejoiy.com/shop"
});


/* ACCOUNT */

if(text.includes("account"))
return res.json({
reply:"Opening your account.",
goto:"https://www.dejoiy.com/my-account"
});


/* FAQ */

if(text.includes("faq")){

return res.json({

reply:

"Dejoiy FAQ helps you understand orders, delivery, payments and returns.\n\nYou can read full FAQ below.",

goto:"https://www.dejoiy.com/faq"

});

}


/* REFUND POLICY */

if(text.includes("refund")){

return res.json({

reply:

"Dejoiy Refund Policy:\n\n• Eligible items can be returned.\n• Refund processed after verification.\n• Processing time 3-7 days.\n\nFull policy below.",

goto:"https://www.dejoiy.com/refund-policy"

});

}



/* WHATSAPP SUPPORT */

if(
text.includes("complaint")||
text.includes("cancel")||
text.includes("support")
){

return res.json({

reply:

"Support Options:\n\nWhatsApp\nPhone\nEmail",

goto:"https://wa.me/919217974851"

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

Mystical female AI of DEJOIY.

You know everything about:

www.dejoiy.com
www.dejoiy.in


You remember conversation context.

You help customers shop smarter.

You explain policies first.

Then offer navigation.

You give short smart answers.

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
