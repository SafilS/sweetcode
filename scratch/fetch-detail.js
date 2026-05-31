const http = require("http");

http.get("http://localhost:3000/problems/two-sum", (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    // Look for the main content specifically
    const startIdx = data.indexOf('<main class="problem-detail">');
    if (startIdx !== -1) {
      console.log(data.slice(startIdx, startIdx + 8000));
    } else {
      console.log("Could not find main tag");
    }
  });
}).on("error", (err) => {
  console.error("Error:", err.message);
});
