export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({
      reply: "Kaali API working"
    });
  }

  return res.status(200).json({
    reply: "Hello from Kaali"
  });

}
