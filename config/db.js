const MongoClient = require('mongodb').MongoClient
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = '';


class Driver {
    
    constructor() {
        this.url = 'mongodb://parking-app:w9mL2I24rDBbxBwzP4Fy4K1iQ8GG7u6ltnKmRW0L4jrjNPDB0FB04b0ek6ORe32XRBdkXNBQxJeC7RZfD86FNg%3D%3D@parking-app.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@parking-app@'
        this.client;
        this.db;
    }
    
    async connect() {
        this.client = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
        if (!this.db) {
            this.db = this.client.db('users');
        }
    }
    
    async find(query) {
        try {
            if (!this.client) {
                this.client = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
            }
            if (!this.db) {
                this.db = this.client.db('users');
            }
            return this.db.collection('users').find(query);
        } catch (err) {
            throw err;
        }
    }
    
    async insertDocument(doc) {
        try {
            if (!this.client) {
                this.client = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
            }
            if (!this.db) {
                this.db = this.client.db('users');
            }
            return this.db.collection('users').insertOne(doc);
        } catch (err) {
            throw err;
        }
    }
};


module.exports = Driver