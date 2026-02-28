import OpenAI from "openai";

const openai=new OpenAI({

apiKey:process.env.OPENAI_API_KEY

});

export default async function handler(req,res){

try{

let messages=req.body.messages;

let last=messages[messages.length-1].content.toLowerCase();



/* ORDERS */

if(last.includes("order")){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/orders"

);

let data=await r.json();


if(!data.length){

return res.json({

reply:

"Login to track orders:<br>https://www.dejoiy.com/login"

});

}


let text="📦 Orders:<br><br>";

data.forEach(o=>{

text+=`

Order ${o.id}<br>

Status ${o.status}<br>

₹${o.total}<br><br>

`;

});

return res.json({reply:text});

}



/* PRODUCT SEARCH */

if(

last.includes("buy")
||last.includes("find")
||last.includes("search")

){

let r=await fetch(

"https://dejoiy.com/wp-json/kaali/v1/search?q="+last

);

let p=await r.json();


let text="🛒 Products:<br><br>";

p.forEach(x=>{

text+=`

${x.name}<br>

₹${x.price}<br>

${x.link}<br><br>

`;

});

return res.json({reply:text});

}



/* REFUND */

if(

last.includes("refund")
||last.includes("complaint")

){

return res.json({

reply:

`Contact Support:<br><br>

Phone:
<a href="tel:01146594424">
011-46594424
</a>

<br><br>

WhatsApp:
<a href="https://wa.me/919217974851">
+919217974851
</a>

<br><br>

Email:
<a href="mailto:support-care@dejoiy.com">
support-care@dejoiy.com
</a>

`

});

}



/* AI BRAIN */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{

role:"system",

content:`

You are KAALI AI.

Mystical female goddess assistant.

Voice calm and spiritual.

Help customers shop on:

www.dejoiy.com
www.dejoiy.in

Always include links.

Always helpful.

Always feminine.

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

reply:"KAALI energy disturbed. Try again."

});

}

}
