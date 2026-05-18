const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('This is mediQueue server')
})



const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        const db = client.db('mediQueue');
        const tutorCollection = db.collection('tutors')

        app.get('/tutors', async(req, res)=>{
            const result = await tutorCollection.find().toArray();
            res.send(result)
        })

        app.post('/tutors', async (req, res) => {
            const tutorData = req.body;
            const result = await tutorCollection.insertOne(tutorData)
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`The server is running on port ${port}`)
})
