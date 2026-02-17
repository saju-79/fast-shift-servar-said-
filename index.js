const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// --- Middleware ---
app.use(cors());
app.use(express.json());
require("dotenv").config();



// Create a MongoClient with a MongoClientOptions object to set the Stable API version

// const uri = `mongodb+srv://:@cluster0.swu9d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@saju-79.sm1o2zm.mongodb.net/?appName=Saju-79`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const db = client.db('parcelDB'); // database name
        const usersCollection = db.collection('users');
        const parcelsCollection = db.collection('parcels');
        const trackingsCollection = db.collection("trackings");
        const paymentsCollection = db.collection('payments');
        const ridersCollection = db.collection('riders');
        // POST: Create a new parcel
        app.post('/parcels', async (req, res) => {
            try {
                const newParcel = req.body;
                // newParcel.createdAt = new Date();
                const result = await parcelsCollection.insertOne(newParcel);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error inserting parcel:', error);
                res.status(500).send({ message: 'Failed to create parcel' });
            }
        });
        app.get('/parcels', async (req, res) => {
            try {
                const userEmail = req.query.email;
                const query = userEmail ? { created_by: userEmail } : {};
                // const { email, payment_status, delivery_status } = req.query;
                // let query = {}
                /* if (email) {
                    query.created_by = email;
                } */

                // if (payment_status) {
                //     query.payment_status = payment_status
                // }

                /* if (delivery_status) {
                    query.delivery_status = delivery_status
                }
 */
                const options = {
                    sort: { createdAt: -1 }, // Newest first
                };

                console.log('parcel query', req.query, query)

                const parcels = await parcelsCollection.find(query, options).toArray();
                res.send(parcels);
            } catch (error) {
                console.error('Error fetching parcels:', error);
                res.status(500).send({ message: 'Failed to get parcels' });
            }
        });

        // parcels delteted 
        app.delete('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await parcelsCollection.deleteOne(query);
            res.send(result);
        })


        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // optional close
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("zap-fast server is running ");

});
app.listen(port, () => {
    console.log(`zap-fast server is runing on port ${port}`);

})








