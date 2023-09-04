const { getClient } = require('./dbConnect');
const zlib = require('zlib');
const Debug = require('./debug');


/*
* Sends a SQL request to the database
* @param {string} query - The SQL query to send
* @param {array} sqlParams - The parameters to use in the query
* @param {number} timeout - The timeout in milliseconds
* @param {boolean} zip - Whether to compress the results using gzip
* @returns {Promise} - A promise that resolves to the results of the query
* @throws {Error} - Throws an error if the query fails
*/
async function getSQLRequest(query, sqlParams, timeout = 0, zip = true) {
    const client = getClient();

    const setStatementPromise = new Promise((resolve, reject) => {
        client.query('SET statement_timeout TO ' + String(timeout) + ';', (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
    Debug.debug('Timeout: ' + timeout);
    try {
        await setStatementPromise;
    } catch (err) {
        return null;
    }
    Debug.debug('Timeout set');

    const queryPromise = new Promise((resolve, reject) => {
        client.query(query, sqlParams, (err, results) => {
            Debug.debug('Query: ' + query);
            Debug.debug('SQL Params: ' + sqlParams);
            if (err) reject(err);
            if (!zip) {
                resolve(results);
            } else {
                // Compress results using gzip
                zlib.gzip(JSON.stringify(results), (err, buffer) => {
                    if (err) reject(err);
                    resolve(buffer);
                });
            }
        });
    });
    Debug.debug('Query sent');
    try {
        const result = await queryPromise;
        Debug.debug('Query complete');
        return result;
    } catch (err) {
        Debug.error('Query error: ' + err.message);
        if (err.message === 'canceling statement due to statement timeout') {
            return -1;
        }
        return null;
    }


}

async function loadConsequenceNames() {
    try {
        const result = await getClient().query('SELECT consequence FROM consequences ORDER BY id');
        return result.rows.map(row => row.consequence);
    } catch (err) {
        Debug.error("Error loading consequence names:" + err.message);
        return [];
    }
}

async function loadConsequenceHighImpact() {
    try {
        const result = await getClient().query('SELECT consequence FROM consequences WHERE high_impact = true');
        return result.rows.map(row => row.consequence);
    } catch (err) {
        Debug.error("Error loading high impact consequences:" + err.message);
        return [];
    }
}

async function loadConsequenceTables(tables) {
    const consequenceTables = {};
    for (const table of tables) {
        try {
            const result = await getClient().query(`SELECT id FROM consequences WHERE ${table} > 0`);
            consequenceTables[table] = result.rows.map(row => row.id);
        } catch (err) {
            Debug.error(`Error loading consequences for table ${table}:` + err.message);
        }
    }
    return consequenceTables;
}

async function loadSymbols(tables) {
    const symbols = {};
    for (const table of tables) {
        try {
            const result = await getClient().query(`SELECT symbol FROM symbols WHERE ${table} = true`);
            const temp = result.rows.map(row => row.symbol).sort();
            symbols[table] = {};
            for (const symbol of temp) {
                if (symbol && symbol !== "NULL" && symbol !== "null") {
                    symbols[table][symbol.toLowerCase()] = symbol;
                }
            }
        } catch (err) {
            Debug.error(`Error loading symbols for table ${table}:` + err.message);
        }
    }
    return symbols;
}

module.exports = {
    loadConsequenceNames,
    loadConsequenceHighImpact,
    loadConsequenceTables,
    loadSymbols,
    getSQLRequest
};