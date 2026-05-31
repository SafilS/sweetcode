const http = require("http");

http.get("http://localhost:3000/problems/two-sum", (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    // Print the first 2000 characters and check for Examples and Constraints
    console.log("Status Code:", res.statusCode);
    console.log(data.slice(0, 4000));
  });
}).on("error", (err) => {
  console.error("Error:", err.message);
});
