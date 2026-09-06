const productId = '6a9b16d643717714336e5501';
const url = 'http://localhost:5000/api/orders';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWE5YTFmMmVhMjMxMjk0MGIyNGU2MiIsImlhdCI6MTc4ODU1Mjk4NCwiZXhwIjoxNzkxMTQ0OTg0fQ.jQVtafFw1i81fH7QMLc0QH9q7RjJqechU_qvU_efL3k';
async function order(name, qty) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ customerName: name, items: [{ product: productId, quantity: qty }] })
  });
  const data = await res.json();
  console.log(name, res.status, JSON.stringify(data));
}

Promise.all([order('Racer A', 2), order('Racer B', 2)]).then(() => process.exit());