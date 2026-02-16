const express = require('express');
const cors = require('cors');
const app = express();
const port =  process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// --- Middleware ---
app.use(cors());
app.use(express.json());
require("dotenv").config();



// Create a MongoClient with a MongoClientOptions object to set the Stable API version


app.get('/' ,  (req , res) =>{
    res.send("zap-fast server is running ");

});
app.listen(port , ()=>{
    console.log(`zap-fast server is runing on port ${port}`);

})