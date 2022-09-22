import express, { response } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const URI = process.env.MONGO_URI;
const client = new MongoClient(URI);
client.connect();
console.log("Connected to Mongo");
const database = client.db("jwt-api");
const usersdb = database.collection("users");

const app = express();
app.use(cors());
app.use(express.json());

app.listen(4040, () => console.log("API RUNNING"));

app.post("/signup", async (request, response) => {
  const newUser = { email: "jane@gmail.com", password: "pass1234" };
  const hashedPassword = await bcrypt.hash(newUser.password, 10);

  await usersdb.insertOne({ email: newUser.email, password: hashedPassword });

  response.status(201).send("User was added");
});

app.post("/login", async (request, response) => {
  const user = await usersdb.findOne({ email: request.body.email });
  const userAllowed = await bcrypt.compare(
    request.body.password,
    user.password
  );

  if (userAllowed) {
    const accessToken = jwt.sign(user, process.env.PRIVATE_KEY);
    response.send({ accessToken: accessToken });
  } else {
    response.send("No user found or invalid password");
  }
});

app.get("/", async (request, response) => {
   const token =
    request.headers.authorization && request.headers.authorization.split(" ")[1];
  // console.log('token here --->', token)
  jwt.verify(token, process.env.PRIVATE_KEY, async (err, decoded) => {
    console.log(decoded);

    if (decoded) {
      const allUsers = await usersdb.find().toArray();
      // response.send({message: `Welcome ${decoded.email}`})
      response.send(allUsers);
    } else if (err) {
      response.status(401).send({ error: "You must use a valid token" });
    }
  });
});
