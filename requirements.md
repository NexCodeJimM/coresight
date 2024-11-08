- Create a server monitoring system using `Python`, `NextJS`, `InfluxDB`, and `NodeJS`.
- The agent will need to be created using python and will be using libraries like `psutil`, `socket`, and `netifaces`.

#Agent Requirements:

- should be inside `coresight-agent` folder.
- Install Required Libraries:
  - Install `psutil` for accessing CPU, memory, and disk metrics.
  - Use libraries like `socket` or `netifaces` for network data.
  - Set up a simple loop that gathers metrics every 10 seconds.
- Gather Metrics:
  - Write code using python to collect CPU, memory, disk, network traffic, and active process information.
  - Store this data in a structured format (e.g., JSON).
- Send Data to Backend API:
  - Once the metrics are gathered, set up a POST request in Python to send this data to your backend every 10 seconds.
  - Test this setup by creating a simple backend endpoint to confirm data reception.

##Step 2: Set Up the Backend with InfluxDB Integration

- Install InfluxDB and set it up locally or on a server.
- Create Backend API in Node.js:
  - Set up a basic Node.js server with an endpoint to receive data from the Python agent.
  - Write code to store incoming data in InfluxDB for time-series tracking.
- Test Data Flow:
  - Confirm that the agent successfully sends data to the backend and that it’s stored in InfluxDB.

##Step 3: Develop the Next.js Frontend

- Design the Dashboard:
  - Build the initial UI in Next.js, focusing on the layout for displaying CPU, memory, disk, network, and process data.
- Fetch Data from Backend:
  - Use Next.js API routes to pull data from InfluxDB and display it on the frontend.
- Real-time Updates and Alerts:
  - Implement polling or WebSocket connections to update data every 10 seconds.
  - Add threshold-based alerts to notify users when any metric exceeds 85%.
  - Alerts should be sent via email.
