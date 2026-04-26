require('dotenv').config();
const Anthropic = require("@anthropic-ai/sdk");
const { getOrderByEmail } = require("./shopify");

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

async function handleCustomerMessage(email, message) {
  let orderContext = "Aucune commande trouvée pour cet email.";
  
  try {
    const orders = await getOrderByEmail(email);
    if (orders.length) orderContext = formatOrders(orders);
  } catch(e) {
    orderContext = "Impossible de récupérer les commandes.";
  }

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: `Tu es l'assistant SAV d'une boutique en ligne.
Commandes du client : ${orderContext}
Règles :
- Réponds en français, 3-5 phrases max
- Ton chaleureux et professionnel
- Si retour : délai 30 jours, gratuit
- Si cas complexe (litige, fraude) : écris ESCALADE_HUMAINE
- Termine par "L'équipe Support"`,
    messages: [{ role: "user", content: message }]
  });

  const reply = response.content[0].text;
  const needsHuman = reply.includes("ESCALADE_HUMAINE");

  return { reply, needsHuman, autoSend: !needsHuman };
}

function formatOrders(orders) {
  return orders.map(o => `Commande ${o.name} - Statut: ${o.financial_status} - Livraison: ${o.fulfillment_status || 'en préparation'}`).join("\n");
}

module.exports = { handleCustomerMessage };