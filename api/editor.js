import OpenAI from "openai";

const openai=new OpenAI({
apiKey:process.env.OPENAI_API_KEY
});

export default async function handler(req,res){

try{

const prompt=req.body.prompt;

const ai=await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[

{
role:"system",
content:`

You are KAALI SUPREME EDITOR.

You control entire DEJOIY marketplace.

Capabilities:

- Add product
- Delete product
- Update product
- Assign coupon
- Create campaign
- Shortlist best seller
- Shortlist seller
- Create vendor
- Approve vendor
- Create page
- Edit CSS
- Generate banner
- Manage WooCommerce
- Run autopilot

Return JSON only:

{
action:"",
data:{}
}

`
},

{ role:"user", content:prompt }

]

});

let result=JSON.parse(ai.choices[0].message.content);

await fetch(
"https://www.dejoiy.com/wp-json/kaali/v2/editor",
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(result)
}
);

res.json({result:"KAALI SUPREME executed successfully."});

}catch(e){

res.json({result:"Editor Error"});

}

}
