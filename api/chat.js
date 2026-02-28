import OpenAI from "openai";

export default async function handler(req,res){

try{

// Safety check
if(!req.body){
return res.json({
reply:"KAALI ready 🔮"
});
}

const messages=req.body.messages || [];

let last="";

if(messages.length>0){
last=messages[messages.length-1].content.toLowerCase();
}


/* ORDER TRACKING */

if(last.includes("order")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/orders"
);

let orders=await r.json();

let text="📦 Your Orders:\n\n";

orders.forEach(o=>{
text+="Order "+o.id+
" | "+o.status+
" | ₹"+o.total+"\n";
});

return res.json({reply:text});

}catch(e){

return res.json({
reply:"⚠️ Unable to fetch orders"
});

}

}



/* PRODUCT SEARCH */

if(last.includes("search")||
last.includes("find")){

try{

let r=await fetch(
"https://dejoiy.com/wp-json/kaali/v1/search?q="+last
);

let products=await r.json();

let text="🛒 Products:\n\n";

products.forEach(p=>{
text+=p.name+
" ₹"+p.price+
"\n"+p.link+"\n\n";
});

return res.json({reply:text});

}catch(e){

return res.json({
reply:"⚠️ Product search unavailable"
});

}

}



/* AI RESPONSE */

try{

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:`
You are KAALI.

Divine female AI assistant of DEJOIY.

Friendly mystical guide.

Help with:

Products
Orders
Shopping

Use emojis sometimes 🔮✨
`
},
...messages
]

});

return res.json({

reply:ai.choices[0].message.content

});

}catch(e){

return res.json({

reply:"✨ Namaste! I am KAALI. How may I help you today? 🔮"

});

}


}catch(error){

return res.json({

reply:"⚠️ KAALI AI restarting..."

});

}

}
