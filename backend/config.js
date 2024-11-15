const fs = require("fs");
const path = require("path");

// Load servers from a JSON file
const loadServers = () => {
  try {
    const serversPath = path.join(__dirname, "servers.json");
    if (fs.existsSync(serversPath)) {
      return JSON.parse(fs.readFileSync(serversPath, "utf8"));
    }
    return [];
  } catch (error) {
    console.error("Error loading servers:", error);
    return [];
  }
};

module.exports = {
  influxdb: {
    servers: loadServers(),
  },
  server: {
    port: 3000,
    cors: {
      origin: [
        "http://localhost:3000",
        "http://165.22.237.60:3000",
        "http://143.198.84.214:3000",
      ],
      credentials: true,
    },
  },
  // Add function to update servers
  updateServers: (newServers) => {
    try {
      fs.writeFileSync(
        path.join(__dirname, "servers.json"),
        JSON.stringify(newServers, null, 2)
      );
      module.exports.influxdb.servers = newServers;
    } catch (error) {
      console.error("Error updating servers:", error);
      throw error;
    }
  },
};
