import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res){
 try{
   let messages = req.body.messages || [];
   let last = messages[messages.length - 1].content.toLowerCase();

   // Orders
   if(last.includes("order")){
     let r = await fetch("https://dejoiy.com/wp-json/kaali/v1/orders");
     let orders = await r.json();
     if(!orders.length){
       return res.json({reply:`Please login to track orders: https://www.dejoiy.com/login`});
     }
     let text="📦 Your Orders:\n\n";
     orders.forEach(o=>{
       text+=`Order ${o.id} | ${o.status} | ₹${o.total}\n`;
     });
     return res.json({reply:text});
   }

   // Search
   if(last.includes("find")||last.includes("search")||last.includes("buy")){
     let r = await fetch("https://dejoiy.com/wp-json/kaali/v1/search?q="+last);
     let products = await r.json();
     if(!products.length){
       return res.json({reply:"No products found."});
     }
     let text="🛒 Products:\n\n";
     products.forEach(p=>{
       text+=`${p.name} ₹${p.price}\n${p.link}\n\n`;
     });
     return res.json({reply:text});
   }

   // Support
   if(last.includes("refund")|| last.includes("complaint")|| last.includes("support")){
     return res.json({reply:
`Contact Support:
📞 011-46594424
📱 +919217974851
✉ support-care@dejoiy.com`
     });
   }

   // AI Response
   const ai = await openai.chat.completions.create({
     model:"gpt-4o-mini",
     messages:[
       {role:"system",content:`
You are KAALI AI — female mystical eCommerce assistant for DEJOIY.
Guide user about shop, products, orders, pages, support.
Always provide correct clickable links when needed.
Use spiritual positive tone.
       `},
       ...messages
     ]
   });

   return res.json({reply: ai.choices[0].message.content});

 } catch(e){
   return res.json({reply:"⚠ KAALI is recharging... please try again."});
 }
}
