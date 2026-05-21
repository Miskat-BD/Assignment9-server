const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

// Middleware
const verifyToken = async(req, res, next) => {
    const authHeader = req?.headers?.authorization
    const token = authHeader?.split(" ")[1]
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    // console.log(token);
    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload);
        next()
    } catch {
        res.status(403).json({ message: "Forbidden" })
    }

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const db = client.db('mediQueue');
        const tutorCollection = db.collection('tutors')
        const bookingCollection = db.collection('bookings')

        app.get('/tutors', async (req, res) => {
            const search = req.query.search;
            console.log(search);
            let query = {}
            if(search){
                console.log('test');
                query.tutorName={
                    $regex:search,
                    $options: 'i'
                }
            }
            const result = await tutorCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/tutors/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await tutorCollection.findOne({ _id: new ObjectId(id) });
            res.send(result)
        })

        app.delete('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const result = await tutorCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        app.post('/tutors', verifyToken, async (req, res) => {
            const tutorData = req.body;
            const result = await tutorCollection.insertOne(tutorData)
            res.send(result)
        })

        app.patch('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body
            const result = await tutorCollection.updateOne(
                { _id: new ObjectId(id) }, { $set: updatedData }
            )
            res.send(result)
        })

        app.get('/my-tutor/:userId', verifyToken, async (req, res) => {
            const userId = req.params.userId;
            const result = await tutorCollection.find({ userId }).toArray();
            res.send(result)
        })

        app.get('/featured', async (req, res) => {
            const result = await tutorCollection.find().limit(6).toArray();
            res.send(result)
        })

        app.get('/bookings',verifyToken, async (req, res) => {
            // const userId = req.params.userId;
            const result = await bookingCollection.find().toArray();
            res.send(result)
        })

        app.patch('/bookings/:bookingId', async (req, res) => {
            const bookingId = req.params.bookingId;
            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(bookingId) },
                {
                    $set: {
                        bookingStatus: "Cancelled"
                    }
                }
            )
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const bookingData = req.body;
            const tutor = await tutorCollection.findOne({ _id: new ObjectId(bookingData.tutorId) });

            //slot check
            if (tutor.slot <= 0) {
                return res.send({
                    success: false,
                    message: "No available slots left"
                })
            }
            //Date check
            const currentDate = new Date();
            const sessionDate = new Date(tutor.sessionStartDate)

            if (currentDate < sessionDate) {
                return res.send({
                    success: false,
                    message: 'Booking is not available yet for this tutor'
                })
            }

            // slot minus
            await tutorCollection.updateOne(
                { _id: tutor._id },
                {
                    $inc: {
                        slot: -1
                    }
                }
            )
            const result = await bookingCollection.insertOne({
                ...bookingData,
                bookingStatus: "Booked",
                bookingDate: new Date()
            })
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
