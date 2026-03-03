import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {

  try {

    const messages = req.body.messages || [];
    const text = messages[messages.length - 1]?.content?.toLowerCase() || "";


    /* =========================
       LIVE ORDER TRACKING
    ========================== */

    if (text.includes("order")) {

      let r = await fetch(
        "https://www.dejoiy.com/wp-json/kaali/v1/orders",
        {
          headers: {
            "x-kaali-secret": "KAALI_SUPREME_2026"
          },
          credentials: "include"
        }
      );

      if (!r.ok) {
        return res.json({
          reply: "Please login to view your orders.",
          goto: "https://www.dejoiy.com/my-account"
        });
      }

      let orders = await r.json();

      if (!orders.length) {
        return res.json({
          reply: "No recent orders found in your account."
        });
      }

      let reply = "Your recent orders:\n\n";

      orders.forEach(o => {
        reply +=
          "Order #" + o.id +
          "\nStatus: " + o.status +
          "\nTotal: ₹" + o.total +
          "\nDate: " + o.date + "\n\n";
      });

      return res.json({ reply });
    }



    /* =========================
       PRODUCT SEARCH
    ========================== */

    if (text.includes("product") || text.includes("buy")) {

      let r = await fetch(
        "https://www.dejoiy.com/wp-json/kaali/v1/search?q=" + encodeURIComponent(text)
      );

      let p = await r.json();

      if (!p.length) {
        return res.json({
          reply: "No products found."
        });
      }

      let reply = "Products:\n\n";

      p.forEach(x => {
        reply += x.name + "\n" + x.link + "\n\n";
      });

      return res.json({
        reply,
        goto: p[0].link
      });
    }



    /* =========================
       WHATSAPP SUPPORT
    ========================== */

    if (
      text.includes("refund") ||
      text.includes("return") ||
      text.includes("complaint") ||
      text.includes("cancel") ||
      text.includes("human")
    ) {

      return res.json({
        reply:
          "Contact Support:\n\n" +
          "WhatsApp:\nhttps://wa.me/919217974851\n\n" +
          "Phone:\n01146594424\n\n" +
          "Email:\nsupport-care@dejoiy.com"
      });
    }



    /* =========================
       NAVIGATION
    ========================== */

    if (text.includes("login"))
      return res.json({ url: "https://www.dejoiy.com/login" });

    if (text.includes("cart"))
      return res.json({ url: "https://www.dejoiy.com/cart" });

    if (text.includes("account"))
      return res.json({ url: "https://www.dejoiy.com/my-account" });



    /* =========================
       SELF LEARNING AI CORE
    ========================== */

    const ai = await openai.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: `

You are KAALI AI.

You remember conversation.

Never say you have no memory.

You know everything about:

www.dejoiy.com
www.dejoiy.in

You learn from:
Products
Policies
Orders
FAQs
Services

Always provide working clickable links.

Support:
https://wa.me/919217974851
support-care@dejoiy.com

          `
        },

        ...messages

      ]

    });


    return res.json({
      reply: ai.choices[0].message.content
    });


  } catch (e) {

    return res.json({
      reply: "KAALI reconnecting..."
    });

  }

}
