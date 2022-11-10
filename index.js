const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s3uhktq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifiyJWT(req, res, next) {

    const authHeader = (req.headers.authorization);
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unothorize access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'Unothorize access' })
        }
        req.decoded = decoded;
        next()
    })

}
async function run() {
    try {
        const serviceCollection = client.db('architec').collection('services');
        const reviewCollection = client.db('architec').collection('reviews');
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })
        app.get('/myreviews', verifiyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log(decoded);
            if (decoded.email != req.query.email) {
                res.status(403).send({ message: 'Unothorize access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const myreview = await cursor.toArray();
            res.send(myreview);
        })

        app.get('/reviews', async (req, res) => {
            let query = {};
            if (req.query.id) {
                query = {
                    service: req.query.id
                }
            }
            const cursor = reviewCollection.find(query);
            const allreview = await cursor.toArray();
            res.send(allreview);

        })

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })
        // app.patch('/myreviews/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const comment = req.body.comment;
        //     const query = { _id: ObjectId(id) };
        //     const update = {
        //         $set: { comment }
        //     };
        //     const result = await reviewCollection.updateOne(query, update);
        //     res.send(result);
        // })
        app.delete('/myreviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })






    }
    finally {

    }

}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('running');
})

app.listen(port, () => {
    console.log(`running ${port}`)
})


