const express = require('express');
const router = express.Router();

var strainNames = require('../public/data/strains.json');
var DOIds = JSON.stringify(require('../public/data/DOIds.json'));
const { loadConsequenceNames, loadConsequenceHighImpact, loadConsequenceTables, loadSymbols, getSQLRequest } = require('./dataLoader');
const { buildQuery } = require('./queryBuilder');
const { initClient } = require('./dbConnect');
const { sortStrains } = require('./utilities');
const Debug = require('./debug');
let consequenceNames, consequenceHighImpact, consequenceTables, symbols;

init();

router.get('/', (req, res) => {
    //Check if consequenceTables is string otherwise convert it to a string using JSON.stringify
    if (typeof consequenceTables !== 'string') {
        consequenceTables = JSON.stringify(consequenceTables);
    }
    if (typeof symbols !== 'string') {
        symbols = JSON.stringify(symbols);
    }
    res.render('home', { consequenceTables, consequenceNames, consequenceHighImpact, strainNames, DOIds });
});

router.get('/search', async (req, res) => {
    const {
        version,
        dataset,
        searchBy,
        symbol,
        symbols: querySymbols,
        rsNumber,
        chromosome,
        startPosition,
        startPositionUnits,
        endPosition,
        endPositionUnits,
        consequence,
        strain,
        highConfidence,
    } = req.query;

    const table = `${version}_${dataset}`;
    const symbols = querySymbols.split(/[\s,]+/);
    const start = startPosition.replace(/,/g, '') * startPositionUnits;
    const end = endPosition.replace(/,/g, '') * endPositionUnits;
    const strains = sortStrains(strain);


    res.render('search', { table, searchBy, symbol, symbols, rsNumber, chromosome, start, end, consequence, strains, highConfidence, consequenceNames, strainNames, DOIds, });
});


router.get('/symbols', async (req, res) => {
    res.json({ symbols });
});

// Initialization function
async function init() {
    try {
        await initClient();
        consequenceNames = await loadConsequenceNames();
        consequenceHighImpact = await loadConsequenceHighImpact();

        const tables = ['grcm38_indels', 'grcm38_snps', 'grcm39_indels', 'grcm39_snps'];

        consequenceTables = await loadConsequenceTables(tables);
        symbols = await loadSymbols(tables);

        Debug.log('Initialization complete.');
    } catch (error) {
        Debug.error("Initialization error: " + error.message);
    }
}


router.get('/count', async (req, res) => {
    try {
        req.query.limit = 1001;
        const { query, sqlParams } = buildQuery(req.query, '*', false);
        const count = await getSQLRequest(query, sqlParams, 15000, false);
        if (!count) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (count === -1) {
            Debug.debug('Query Timeout');
            res.status(500).json({ error: 'Query Timeout' });
            return;
        }
        res.json({ count: count.rowCount });
    } catch (error) {
        Debug.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/loadMore', async (req, res) => {
    try {
        var start = new Date().getTime();
        const { query, sqlParams } = buildQuery(req.query, req.query.columns, true);
        const result = await getSQLRequest(query, sqlParams, 0, true);
        var end = new Date().getTime();
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Content-Length': result.length,
            'X-Response-Time': end - start
        });
        res.end(result);
    } catch (error) {
        Debug.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Else 404
router.get('*', (req, res) => {
    res.status(404).json({ error: 'URL not found' });
});

module.exports = router;
