const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const { Client } = require('pg');
require('dotenv').config();
var client;
var consequenceNames = require('./public/data/consequences.json');
var strainNames = require('./public/data/strains.json');

function connectToClient() {
    client = new Client({
        user: process.env.POSTGRES_USER,
        host: 'db',
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: 5432,
    });
    client.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            console.error('Trying again in 5 seconds');
            client.end();
            setTimeout(connectToClient, 5000);
        } else {
            console.log('Connected to the database!');
            setupApp();
        }
    });
}



function setupApp() {
    app.set('view engine', 'ejs');
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.render('home', { consequenceNames, strainNames });
    });

    app.get('/search', (req, res) => {
        const searchBy = req.query.searchBy;
        var symbol = req.query.symbol;
        var chromosome = req.query.chromosome;
        var start = req.query.startPosition.replace(/,/g, '');
        var end = req.query.endPosition.replace(/,/g, '');
        var consequence = req.query.consequence;
        var strains = req.query.strain;
        const highConfidence = req.query.highConfidence || false;

        if (searchBy == 'symbol') {
            chromosome = '';
            start = '';
            end = '';
        }

        if (searchBy == 'position') {
            symbol = '';
        }

        if (searchBy == 'all') {
            symbol = '';
            chromosome = '';
            start = '';
            end = '';
        }

        res.render('search', { searchBy, symbol, chromosome, start, end, consequence, strains, highConfidence, consequenceNames, strainNames });
    });

    app.get('/loadMore', (req, res) => {
        console.log("load more", req.query);
        const limit = req.query.limit || 1000;
        const offset = req.query.offset || 0;
        const symbol = req.query.symbol;
        const chromosome = req.query.chromosome;
        const start = req.query.start;
        const end = req.query.end;
        const consequences = req.query.consequence;
        const strains = req.query.strains.split(',');
        const highConfidence = req.query.highConfidence;

        let query = 'SELECT * FROM snps WHERE ';
        let params = [];

        if (symbol) {
            query += 'symbol = ' + '\'' + symbol + '\'' + ' AND ';
        }

        if (chromosome) {
            query += 'chromosome = ' + '\'' + chromosome + '\'' + ' AND ';
        }

        if (start && end) {
            query += 'position BETWEEN ' + start + ' AND ' + end + ' AND ';
        }

        if (consequences) {
            console.log(consequences);
            query += 'consequence && ARRAY[' + consequences + '] AND ';
        } else {
            res.status(400).send({ message: 'No consequence selected' });
        }

        if (strains) {
            if (strains.length > 1) {
                query += '(';
                strains.forEach((strain, index) => {
                    query += `\"${strain}\" = 1 OR `;
                    if (highConfidence == 'false') {
                        query += `\"${strain}\" = 2 OR `;
                    }
                }
                );
                query = query.slice(0, -4);
                query += ') AND ';
            } else {
                if (highConfidence == 'false') {
                    query += `(\"${strains[0]}\" = 1 OR \"${strains[0]}\" = 2) AND `;
                } else {
                    query += `\"${strains[0]}\" = 1 AND `;
                }
            }
        }

        if (query.endsWith('AND ')) {
            query = query.slice(0, -4);
        } else {
            query = query.slice(0, -6);
        }
        if (limit != -1)
            query += `LIMIT ${limit} OFFSET ${offset};`;
        console.log('\"' + query + '\"');
        client.query(query, (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).send({ message: 'Internal server error' });
            } else {
                res.send({ results });
            }
        });
    });

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

connectToClient();