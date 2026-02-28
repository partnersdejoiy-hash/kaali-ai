import OpenAI from "openai";

const openai=new OpenAI({

apiKey:process.env.OPENAI_API_KEY

});


export default async function handler(req,res){

try{

const messages=req.body.messages;

let last=
messages[messages.length-1].content.toLowerCase();



/* LOGIN */

if(last.includes("login")){

return res.json({

reply:
'<a href="https://www.dejoiy.com/login" target="_blank">Open Login Page</a>'

});

}


/* ACCOUNT */

if(last.includes("account")){

return res.json({

reply:
'<a href="https://www.dejoiy.com/my-account" target="_blank">Open Account Page</a>'

});

}


/* SHOP */

if(last.includes("shop")){

return res.json({

reply:
'<a href="https://www.dejoiy.com/shop" target="_blank">Open Shop</a>'

});

}


/* SUPPORT */

if(last.includes("refund")||
last.includes("support")||
last.includes("complaint")){

return res.json({

reply:
`
Contact Support:

📞 011-46594424  
📱 +919217974851  
✉ support-care@dejoiy.com
`

});

}



/* AI */

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{

role:"system",

content:`

You are KAALI.

Female mystical assistant of DEJOIY.

You guide users to:

Products
Orders
Shopping
Services

Always provide clickable links.

`

},

...messages

]

});


res.json({

reply:ai.choices[0].message.content

});


}catch(e){

res.json({

reply:"KAALI restarting..."

});

}

}
