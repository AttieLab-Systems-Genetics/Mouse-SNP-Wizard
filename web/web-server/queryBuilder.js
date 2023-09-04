function buildQuery(params, columns = '*', order = true) {
    console.log(params)
    let { 
        searchBy,
        symbol,
        symbols,
        chromosome,
        start,
        end,
        consequences,
        consequence,
        strains,
        strain,
        highConfidence,
        limit,
        offset,
        table,
        rsNumber,
    } = params;

    if (consequence && !consequences) {
        consequences = consequence;
    }
    if (strain && !strains) {
        strains = strain;
    }

    let query = `SELECT ${columns} FROM ${table} AS main`;
    query += ' LEFT JOIN symbols AS sym ON main.symbol_id = sym.id';
    query += ' WHERE ';
    let sqlParams = [];
    let index = 1;

    if (searchBy === 'symbol') {
        query += 'sym.symbol = $' + (index++) + ' AND ';
        sqlParams.push(symbol);
    }

    if (searchBy === 'symbols') {
        query += '(';
        var symbolsArray = symbols.split(',');
        for (let i = 0; i < symbolsArray.length; i++) {
            query += 'sym.symbol = $' + (index++) + ' OR ';
            sqlParams.push(symbolsArray[i]);
        }
        query = query.slice(0, -4);
        query += ') AND ';
    }


    if (searchBy === 'position') {
        query += 'main.chrom = $' + (index++) + ' AND main.pos BETWEEN $' + (index++) + ' AND $' + (index++) + ' AND ';
        sqlParams.push(chromosome, start, end);
    }

    if (searchBy === 'rsNumber') {
        query += 'main.rs_number = $' + (index++) + ' AND ';
        sqlParams.push(rsNumber);
    }

    if (consequences) {
        query += 'main.consequence && $' + (index++) + ' AND ';
        sqlParams.push(`{${consequences}}`);
    }

    if (strains) {
        //Check if strains is an array or a single string
        if (typeof strains === 'string') {
            var strainsArray = strains.split(',');
        } else {
            var strainsArray = strains;
        }
        if (strainsArray.length > 1) {
            query += '(';
            strainsArray.forEach((strain) => {
                if (highConfidence && highConfidence.toLowerCase() === 'true') {
                    query += `(LEFT(main."${strain}", 1) = UPPER(LEFT(main."${strain}", 1)) AND main."${strain}" != '?' AND UPPER(main.ref) != UPPER(main."${strain}")) OR `;
                } else {
                    query += `(main."${strain}" != '?' AND UPPER(main.ref) != UPPER(main."${strain}")) OR `;
                }
            });
            query = query.slice(0, -4);
            query += ') AND ';
        } else {
            if (highConfidence && highConfidence.toLowerCase() === 'true') {
                query += `(LEFT(main."${strain}", 1) = UPPER(LEFT(main."${strain}", 1)) AND main."${strain}" != '?' AND UPPER(main.ref) != UPPER(main."${strain}")) AND `;
                index++;
            } else {
                query += `main."${strains}" != '?' AND `;
                index++;
            }
        }
    }

    if (query.endsWith('AND ')) {
        query = query.slice(0, -4);
    } else {
        query = query.slice(0, -6);
    }

    if (order) {
        query += ' ORDER BY main.chrom, main.pos ASC';
    }

    if (limit !== -1 && limit !== undefined && limit !== '-1') {
        query += ` LIMIT $${index++}`;
        sqlParams.push(limit);
    }

    if (offset) {
        query += ` OFFSET $${index}`;
        sqlParams.push(offset);
    }

    return { query, sqlParams };
}

module.exports = {
    buildQuery,
};
