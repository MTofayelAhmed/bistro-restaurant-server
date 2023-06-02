const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require("dotenv").config();

// middle Wire

app.use(cors());
app.use(express.json());
const verifyJwt = (req, res, next)=> {
const authorization = req.headers.authorization ;
if(!authorization){
  res.status(401).send({error: true, message: 'unauthorize access'})
}
const token = authorization.split(' ')[1];
jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded)=>{
  if(error){
    res.status(403).send({error: true, message: 'unauthorized access'})
  }
   req.decoded =decoded ;
   next()
})


}







const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.qhvkztn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db("bistroUser").collection("menu");
    const reviewCollection = client.db("bistroUser").collection("review");
    const CartCollection = client.db("bistroUser").collection("cart");
    const userCollection = client.db("bistroUser").collection("user");

    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

// JWT TOKEN
 app.post('/jwt', (req, res)=> {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
  res.send({token})
 })






    // user Collection apis
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role:"admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/users/:id', async(req, res)=> {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query)
      res.send(result)

    })

    // cart collection Apis

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await CartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await CartCollection.insertOne(item);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CartCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("boss is sitting");
});

app.listen(port, () => {
  console.log(`bistro boss is sitting on ${port}`);
});
