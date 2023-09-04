const { Client } = require('pg');
require('dotenv').config();
var client;

async function connectToClient() {
    client = new Client({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    });

    // Try to connect
    try {
        await client.connect();
        console.log('Connected to the database!');
        return client;
    } catch (err) {
        console.error('Error connecting to the database:', err);
        console.error('Trying again in 5 seconds');
        setTimeout(connectToClient, 5000);
    }
}

function getClient() {
    if (!client) {
        throw new Error('Call initClient() first!');
    }
    return client;
}

//Export the client and the function
module.exports = {
    initClient: connectToClient,
    getClient
};

