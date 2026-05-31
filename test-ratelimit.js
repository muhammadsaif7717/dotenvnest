const http = require('http');

async function testRatelimit() {
  for (let i = 1; i <= 6; i++) {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: "test@example.com", password: "password" })
    });
    console.log(`Request ${i}: Status ${res.status}`);
  }
}

testRatelimit();
