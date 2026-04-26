require('dotenv').config();
const { handleCustomerMessage } = require("./agent");

async function test() {
  console.log("Test de l'agent SAV...");
  
  const result = await handleCustomerMessage(
    "client@example.com",
    "Bonjour, où est ma commande ?"
  );
  
  console.log("Réponse de l'agent :");
  console.log(result.reply);
  console.log("Escalade humaine :", result.needsHuman);
}

test().catch(console.error);