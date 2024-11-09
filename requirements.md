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

- The files are in `coresight-web-main`
- Create the website using Next.JS 14
- MAKE SURE THAT YOU USE APPROUTER.
- Store the data to MySQL database.
- Use NextAUTH for the authentication.
- There should be a default admin user with the username `efi_admin`, email `efi_admin@test.com`, password of `*7eL£~0YV&9h`.
- Users cannot signup only admin can create users.
- Create a bash file on how to set it up on a new server.
- The server should have MySQL with PHPMyAdmin
- Use ShadCN UI for the UI Framework
- use Chart.js for the charts.
- Create the appropriate MySQL table for this system.
- There should be a role where not everyone can be admin. Maybe a viewer

MYSQL:
Users:
Username
Password
Email
Profile Picture
role
is_Admin
last_login

Put more table that is applicable to this system.
