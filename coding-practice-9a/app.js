const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

//Server and DB initialize API
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Hosted local server at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB and Server error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1 to register user
app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkUserInDbQuery = `SELECT * FROM user WHERE username= '${username}';`;
    const dbUser = await db.get(checkUserInDbQuery);

    if (dbUser === undefined) {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const createUserQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
        await db.run(createUserQuery);
        response.status(200);
        response.send("User created successfully");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (error) {
    response.send(`Register API error : ${error.message}`);
    process.exit(1);
  }
});

//API2 to login user
app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username= '${username}';`;
    const dbUser = await db.get(selectUserQuery);

    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatch) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (error) {
    response.send(`Login API fail: ${error.message}`);
    process.exit(1);
  }
});

//API3 for change password
app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbResponse = await db.get(selectUserQuery);

    if (dbResponse.username === username) {
      const isOldPasswordMatch = await bcrypt.compare(
        oldPassword,
        dbResponse.password
      );
      if (isOldPasswordMatch) {
        if (newPassword.length < 5) {
          response.status(400);
          response.send("Password is too short");
        } else {
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          const updatePasswordQuery = `UPDATE user SET password = '${hashedNewPassword}' WHERE username = '${username}';`;
          await db.run(updatePasswordQuery);
          response.status(200);
          response.send("Password updated");
        }
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    } else {
      response.status(400);
      response.send("Invalid user");
    }
  } catch (error) {
    response.send(`change password API error: ${error.message}`);
    process.exit(1);
  }
});

//exporting app module using default export
module.exports = app;
