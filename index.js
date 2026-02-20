const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// --- Middleware ---
app.use(cors());
app.use(express.json());
require("dotenv").config();
const admin = require("firebase-admin");
// require("dotenv").config();

// const firebaselinks = ``

const serviceAccount = require("./fast-shift-d5212-firebase-adminsdk-fbsvc-517e858b5f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

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


        const verifyFBToken = async (req, res, next) => {
            const token = req.headers.authorization;

            if (!token) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            try {
                const idToken = token.split(' ')[1];
                const decoded = await admin.auth().verifyIdToken(idToken);
                console.log('decoded in the token', decoded);
                req.decoded_email = decoded.email;
                next();
            }
            catch (err) {
                return res.status(401).send({ message: 'unauthorized access' })
            }


        }
        console.log(verifyFBToken, "verofy token ")
        // const verifyFBToken = async (req, res, next) => {
        //     const token = req.headers.authorization;

        //     if (!token) {
        //         return res.status(401).send({ message: 'unauthorized access' })
        //     }

        //     try {
        //         const idToken = token.split(' ')[1];
        //         const decoded = await admin.auth().verifyIdToken(idToken);
        //         console.log('decoded in the token', decoded);
        //         req.decoded_email = decoded.email;
        //         next();
        //     }
        //     catch (err) {
        //         return res.status(401).send({ message: 'unauthorized access' })
        //     }


        // }




        // users related apis
        app.post('/users', async (req, res) => {
            const user = req.body;
            user.role = 'user';
            user.createdAt = new Date().toISOString();
            user.lastLogin = new Date().toISOString();
            const email = user.email;
            const userExists = await usersCollection.findOne({ email })
            // console.log(user.photoURL, "user ")

            if (userExists) {
                return res.send({ message: 'user exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

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
        // GET: Get a specific parcel by ID
        app.get('/parcels/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const parcel = await parcelsCollection.findOne({ _id: new ObjectId(id) });

                if (!parcel) {
                    return res.status(404).send({ message: 'Parcel not found' });
                }

                res.send(parcel);
            } catch (error) {
                console.error('Error fetching parcel:', error);
                res.status(500).send({ message: 'Failed to fetch parcel' });
            }
        });
        // /create-payment-intent'
        // payment related apis
        app.post('/payment-checkout-session', async (req, res) => {
            const paymentInfo = req.body;
            const amount = parseInt(paymentInfo.cost) * 100;
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            unit_amount: amount,
                            product_data: {
                                name: `Please pay for: ${paymentInfo.parcelName}`
                            }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: {
                    parcelId: paymentInfo.parcelId
                },
                customer_email: paymentInfo.senderEmail,
                success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
            })

            res.send({ url: session.url })
        })


        // parcels delteted 
        app.delete('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await parcelsCollection.deleteOne(query);
            res.send(result);
        })

        // raider releted apis 
        app.post('/riders', async (req, res) => {
            const rider = req.body;
            rider.status = "pending";
            rider.createdAt = new Date()
            const result = await ridersCollection.insertOne(rider);
            res.send(result);
        })
        // riders related apis
        app.get('/riders', async (req, res) => {
            const { status, district, workStatus } = req.query;
            const query = {}

            if (status) {
                query.status = status;
            }
            if (district) {
                query.district = district
            }
            if (workStatus) {
                query.workStatus = workStatus
            }

            const cursor = ridersCollection.find(query)
            const result = await cursor.toArray();
            res.send(result);
        })

        app.delete('/riders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await ridersCollection.deleteOne(query);
            res.send(result);
        });
        app.get('/riders', async (req, res) => {
            const status = req.query.status;

            let query = {};
            if (status) query.status = status;

            const result = await ridersCollection.find(query).toArray();
            res.send(result);
        });
        // PATCH rider status
        app.patch('/riders/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status }
            };

            const result = await ridersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        app.patch('/riders/:id', async (req, res) => {
            const status = req.body.status;
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status,
                    workStatus: 'available'
                }
            }

            const result = await ridersCollection.updateOne(query, updatedDoc);

            if (status === 'approved') {
                const email = req.body.email;
                const userQuery = { email }
                const updateUser = {
                    $set: {
                        role: 'rider'
                    }
                }
                const userResult = await userCollection.updateOne(userQuery, updateUser);
            }

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








