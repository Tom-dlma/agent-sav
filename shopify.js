async function getOrderByEmail(email) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_TOKEN;
  
  const res = await fetch(`https://${shop}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&status=any&limit=5`, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  return data.orders || [];
}

module.exports = { getOrderByEmail };