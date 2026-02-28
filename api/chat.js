import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const messages=req.body.messages||[];

const text=
messages[messages.length-1].content
.toLowerCase();


/* MAGIC NAVIGATION */

if(text.includes("login"))
return res.json({
url:"https://www.dejoiy.com/login"
});

if(text.includes("cart"))
return res.json({
url:"https://www.dejoiy.com/cart"
});

if(text.includes("shop"))
return res.json({
url:"https://www.dejoiy.com/shop"
});

if(text.includes("account"))
return res.json({
url:"https://www.dejoiy.com/my-account"
});



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

You are KAALI.

Mystical female AI of DEJOIY.

You know everything about:

www.dejoiy.com

www.dejoiy.in

You help customers shop smarter.

You automatically guide users.

You speak calm and wise.

If product not on dejoiy give references.

Support:

01146594424

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
