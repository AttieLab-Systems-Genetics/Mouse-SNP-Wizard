// Global Variables
let offset = 0;
let columnIndex = 0;
let columnCount;
let columnIndexOfB6 = 0;
let lastFourthColumnValue = null;
let useGreyColor = true;
const strains = $('#strains').val().split(',');
const consequences = $('#consequence').val().split(',');
const consequenceNames = $('#consequenceNames').val().split(',');
var limit = 10000;
const loadMoreButton = document.getElementById('loadMoreBtn');
const loadAllButton = document.getElementById('loadAllBtn');
const columnNamesMap = { "AA#": "Protein Position", "AAchg": "Amino Acids", "Bp": "Position" };

// Formats a number with commas for better readability
function formatNumberWithCommas(x) {
    if (x === undefined) return '';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Generic render function to be used across multiple columns
function genericRender(data, type) {
    if (!data || data.toUpperCase() === 'NULL') return '';
    if (data === '?') return 'het';
    if (type === 'display' && data.length > 3) return data.substring(0, 3) + '...';
    return data;
}

// Cleans the strain string
function cleanStrain(strain) {
    if (strain === 'A_J') return 'A/J';
    if (strain.includes('_')) return strain.split('_')[0];
    return strain;
}

function renderLink(data, type) {
    return (type === 'display' && data) ? `<a href="http://useast.ensembl.org/Mus_musculus/Variation/Explore?v=${data}" target="_blank">${data}</a>` : data;
}

function renderConsequence(data, type) {
    if (type === 'display' && data) {
        const index = data.indexOf('&');
        data = (index !== -1) ? `${data.substring(0, index)}...` : data;
        return data.replace(/_/g, ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    return data;
}

// Sets up columns for DataTable
function setupColumns() {
    let columns = [
        { title: "Symbol", data: columnIndex++ },
        { title: "Chr", data: columnIndex++ },
        { title: "Bp", data: columnIndex++, render: (data, type) => type === 'display' ? formatNumberWithCommas(data) : data },
        { title: "RS#", data: columnIndex++, render: renderLink },
        { title: "Consequence", data: columnIndex++, render: renderConsequence },
        { title: "AA#", data: columnIndex++, name: "Protein Position" },
        { title: "AAchg", data: columnIndex++, name: "Amino Acids", render: genericRender },
        { title: "SIFT", data: columnIndex++ },
        { title: "B6", data: columnIndex++, render: genericRender }
    ];

    columnIndexOfB6 = columnIndex - 1;
    columnCount = columns.length;

    for (let i = 0; i < strains.length; i++) {
        columns.push({
            title: cleanStrain(strains[i]),
            data: i + columnCount,
            render: genericRender
        });
    }

    return columns;
}

function initializeDataTable() {
    const columns = setupColumns();
    let lastFourthColumnValue = null;
    let useGreyColor = true;
    return $('#myTable').DataTable({
        "order": [[1, "asc"], [2, "asc"], [0, "asc"]],
        deferRender: true,
        pageLength: 100,
        lengthMenu: [[100, 500, 1000, 5000, 10000, -1], [100, 500, 1000, 5000, 10000, "All"]],
        fixedHeader: true,
        scrollX: true,
        responsive: true,

        // Function to handle row creation events
        createdRow: function (row, data, dataIndex) {
            const bgColor = data[3] === lastFourthColumnValue ? useGreyColor ? 'lightgrey' : 'white' : (useGreyColor = !useGreyColor) ? 'lightgrey' : 'white';
            $(row).css('background-color', bgColor);
            lastFourthColumnValue = data[3];
            // Loop through strains to apply the 'negative' class where applicable
            for (let i = 0; i < strains.length; i++) {
                const strainColumnIndex = i + columnCount;
                const strainData = data[strainColumnIndex];
                if (strainData && strainData !== data[columnIndexOfB6] && strainData.toLowerCase() !== strainData && strainData !== '?') {
                   
                    $('td', row).eq(strainColumnIndex).addClass('negative');
                }
            }
        },

        // Function to handle draw events
        drawCallback: function (settings) {
            toggleRowColor(this.api());
        },

        // Other DataTable settings
        dom: 'lBfrtip',
        buttons: getButtonsConfig(),
        columns: columns,
    });

    // Function to toggle the row color based on the value in the fourth column
    function toggleRowColor(api) {
        let previousValue = null;
        let useGreyColor = true;

        api.rows().every(function (rowIdx, tableLoop, rowLoop) {
            const data = this.data();
            let value = data[3] || (data[0] + data[1] + data[2]);  // Fallback to the first three columns if the fourth is empty
            const bgColor = value === previousValue ? useGreyColor ? 'lightgrey' : 'white' : (useGreyColor = !useGreyColor) ? 'lightgrey' : 'white';

            $(this.node()).css('background-color', bgColor);
            previousValue = value;
        });
    }
}

// Function to configure export buttons
function getButtonsConfig() {
    return [
        {
            extend: 'copy',
            exportOptions: { orthogonal: 'sort' }
        },
        {
            extend: 'csv',
            exportOptions: { orthogonal: 'sort' },
            filename: getFileName,
            customize: customizeCSV
        },
        {
            extend: 'excel',
            exportOptions: { orthogonal: 'sort' },
            title: '',
            filename: getFileName,
            customize: customizeExcel
        }
    ];
}

/**
 * Customizes the exported CSV format.
 * Specifically, it changes the header for the B6 column and alters its values.
 * 
 * @param {string} csv - The original CSV content as a string.
 * @returns {string} - The modified CSV content as a string.
 */
function customizeCSV(csv) {
    // Split the original CSV string into an array of lines
    const lines = csv.split("\n");

    // Extract headers from the first line and find the index of the 'B6' column
    const headers = lines[0].split(",");
    const b6Index = headers.indexOf('"B6"');

    // Initialize an array to keep track of alternative values
    let alternatives = [];

    // Loop through each line of the CSV
    lines.forEach((line, index) => {
        // Split the line into its columns
        const columns = line.split(",");

        // If it's the first line, change the header for the B6 column
        if (index === 0) {
            columns[b6Index] = '"reference and alternatives"';
        } else {
            // For other lines, process the B6 and subsequent columns
        
            // Extract the reference value from the B6 column and remove quotes
            const ref = removeQuotes(columns[b6Index]);

            // Initialize the alternatives array and new value variable for each row
            alternatives = [];
            let newValue = 0;

            for (let i = 0; i < columns.length; i++) {
                if (!columns[i] || columns[i].toLowerCase() === 'null' || columns[i].toLowerCase() === '\"null\"') {
                    columns[i] = '';
                }
                if (i <= b6Index) continue;  // Skip columns before B6
                // Remove quotes and get the column value
                const value = removeQuotes(columns[i]);

                // Determine the new value based on comparison with the reference (ref)
                if (value === ref) {
                    newValue = 0;
                } else if (value.toLowerCase() === value || value === "het") {
                    newValue = -1;
                } else {
                    // If the value is a new alternative, add it to the alternatives array
                    if (!alternatives.includes(value)) {
                        alternatives.push(value);
                    }
                    newValue = alternatives.indexOf(value) + 1;
                }

                // Update the column with the new value
                columns[i] = newValue;
            }

            // Update the B6 column to include reference and alternatives
            columns[b6Index] = `"${ref}/${alternatives.join(",")}"`;
        }

        // Update the line in the lines array
        lines[index] = columns.join(",");
    });

    // Join the lines back into a single CSV string and return
    return lines.join("\n");
}

/**
 * Removes quotes from a string.
 * 
 * @param {string} str - The input string.
 * @returns {string} - The string without quotes.
 */
function removeQuotes(str) {
    return str.replace(/"/g, '');
}



/**
 * Customizes the exported Excel worksheet.
 * Specifically, it changes the header for the B6 column and alters its values.
 * 
 * @param {object} xlsx - The original Excel object.
 */
function customizeExcel(xlsx) {
    // Get the first worksheet
    const sheet = xlsx.xl.worksheets['sheet1.xml'];

    // Initialize variables for storing the B6 column reference and alternative values
    let b6Ref = null;
    let alternatives = [];

    // Loop through each row of the sheet
    $('row', sheet).each(function (rowIndex, rowElem) {
        // If it's the first row (header), identify the B6 column reference
        if (rowIndex === 0) {
            $('c', rowElem).each(function () {
                const cellValue = $('t', this).text();
                const cellRef = $(this).attr('r').replace(/[0-9]/g, ''); // Remove digits
                if (cellValue === 'B6') {
                    b6Ref = cellRef;
                    $('t', this).text('reference/alternatives');
                    return;
                }
                
            });
        }

        // Only proceed if B6 column reference is found
        if (b6Ref) {
            // Extract the reference value from the B6 column
            const ref = $(`c[r^="${b6Ref}"] t`, rowElem).text();

            // Initialize the alternatives array and new value variable for each row
            alternatives = [];
            let newValue = 0;
            let startUpdating = false;
            
            // Loop through each cell
            $('c', rowElem).each(function () {
                const cellRef = $(this).attr('r').replace(/[0-9]/g, ''); // Remove digits

                // Skip until reaching the B6 column
                if (cellRef === b6Ref) {
                    startUpdating = true;
                }

                if (!startUpdating) return;

                // Extract the cell value
                const value = $('t', this).text();

                // Determine the new value based on comparison with the reference (ref)
                if (value === ref) {
                    newValue = 0;
                } else if (value.toLowerCase() === value || value === "het") {
                    newValue = -1;
                } else {
                    // If the value is a new alternative, add it to the alternatives array
                    if (!alternatives.includes(value)) {
                        alternatives.push(value);
                    }
                    newValue = alternatives.indexOf(value) + 1;
                }

                // Update the cell with the new value
                $('t', this).text(newValue);

                // Update the B6 cell to include reference and alternatives
                $(`c[r^="${b6Ref}"] t`, rowElem).text(`${ref}/${alternatives.join(",")}`);
            });
        }
    });
}




function getFileName() {
    const searchBy = $('#searchBy').val();
    const symbol = $('#symbol').val();
    const symbols = $('#symbols').val();
    const chromosome = $('#chromosome').val();
    const start = $('#start').val();
    const end = $('#end').val();

    if (searchBy === 'symbol') {
        return symbol;
    } else if (searchBy === 'symbols') {
        return symbols;
    } else if (chromosome !== '') {
        return `chr ${chromosome} pos ${start}-${end}`;
    }

    return "mouse_snp_wizard";
}

// Adds data to the DataTable
function add_data_to_table(response) {
    let rows = [];
    let data = response.rows;
    let totalRecords = data.length;

    if (totalRecords > 0) {
        let rowArray, rowData, temp, downloadName;

        for (let i = 0; i < totalRecords; i++) {
            rowData = data[i];

            // Rename columns
            for (const displayName in columnNamesMap) {
                downloadName = columnNamesMap[displayName];
                rowData[downloadName] = rowData[displayName];
                delete rowData[displayName];
            }

            // Modify 'consequence' field
            if (rowData.consequence.length > 1) {
                temp = rowData.consequence.map(index => consequenceNames[index]).join('&');
                rowData.consequence = temp;
            } else {
                rowData.consequence = consequenceNames[rowData.consequence[0]];
            }

            // Prepare rows
            rowArray = Object.values(rowData);
            rows.push(rowArray);
        }

        // Add rows to the table and update it
        table.rows.add(rows).draw(false);

        // Update offset for the next batch of rows
        offset += limit;

        // Update table information display
        const info = table.page.info();
        $('#totalEntries').text(info.recordsTotal);
    }
}


// Fetches rows from the server and adds them to the table
function loadRows() {
    // Show loading indicators and disable buttons
    $('.loading-image, .overlay').show();
    loadMoreButton.disabled = true;
    loadAllButton.disabled = true;

    // Record the start time for performance measurement
    const start = new Date().getTime();

    // Fetch data from the server
    $.ajax({
        url: '/loadMore',
        method: 'GET',
        timeout: 600000, // 10 minutes timeout
        data: {
            table: $('#table').val(),
            searchBy: $('#searchBy').val(),
            limit: limit,
            offset: offset,
            symbol: $('#symbol').val(),
            symbols: $('#symbols').val(),
            rsNumber: $('#rsNumber').val(),
            chromosome: $('#chromosome').val(),
            start: $('#start').val(),
            end: $('#end').val(),
            consequences: $('#consequence').val(),
            strains: $('#strains').val(),
            highConfidence: $('#highConfidence').val(),
            columns: 'symbol, chrom, pos, rs_number, consequence, protein_position, amino_acids, sift, ref, ' +
                strains.map(strain => `"${strain}"`).join(', ')
        },
        success: function (response) {
            // Add rows to the DataTable
            add_data_to_table(response);

            // Check if there are more rows to load
            if (response.rows.length === limit) {
                // Show the "Load More" and "Load All" buttons
                $('.loading-image, .overlay').hide();
                loadMoreButton.disabled = false;
                loadAllButton.disabled = false;
            } else {
                // Hide the "Load More" and "Load All" buttons if no more rows
                $("#loadMoreBtn, #loadAllBtn").hide();
                $('.loading-image, .overlay').hide();
            }
        },
        error: function () {
            // Show error message and re-enable buttons
            $('.error, .overlay').show();
            $('.loading-image').hide();
            loadMoreButton.disabled = false;
            loadAllButton.disabled = false;
            loadAllButton.style.backgroundColor = "red";
            loadAllButton.style.color = "white";
            loadMoreButton.style.backgroundColor = "red";
            loadMoreButton.style.color = "white";

            setTimeout(() => $('.error, .overlay').hide(), 3000);
        },
        complete: function (xhr) {
            // Display loading time
            const total = new Date().getTime() - start;
            const formattedTotal = formatNumberWithCommas(total);
            const serverTime = xhr.getResponseHeader('X-Response-Time');
            const formattedServerTime = formatNumberWithCommas(serverTime);

            $('#loadingTime').text(`${formattedTotal} ms (database: ${formattedServerTime} ms)`);
        }
    });
}


// Set up initial UI when the page loads
function setupPage() {
    // Populate consequence and strain display
    const consequenceText = consequences.map(index => consequenceNames[index]).join(", ");
    const strainText = strains.map(strain => cleanStrain(strain)).join(", ");

    document.getElementById('consequenceDisplay').innerHTML = consequenceText;
    document.getElementById('strainDisplay').innerHTML = strainText;

    // Disable the "Load More" and "Load All" buttons initially
    loadMoreButton.disabled = true;
    loadAllButton.disabled = true;

    // Show loading indicators and hide error messages
    $('.loading-image, .overlay').show();
    $('.error').hide();

    // Make the "Load More" and "Load All" buttons visible
    $("#loadMoreBtn, #loadAllBtn").show();

    // Attach click events to the "Load More" and "Load All" buttons
    $('#loadMoreBtn').click(() => {
        loadRows();
        resetButtonStyles(loadMoreButton, loadAllButton);
    });

    $('#loadAllBtn').click(() => {
        limit = -1;  // Set to fetch all rows
        loadRows();
        resetButtonStyles(loadMoreButton, loadAllButton);
    });

    // Set the table to display 100 rows by default
    table.page.len(100).draw();
}

// Reset button styles to defaults
function resetButtonStyles(loadMoreButton, loadAllButton) {
    loadMoreButton.style.backgroundColor = "";
    loadMoreButton.style.color = "";
    loadAllButton.style.backgroundColor = "";
    loadAllButton.style.color = "";
}


let table;
// Document Ready Function
$(document).ready(function () {
    table = initializeDataTable();

    // Re-draw DataTables after loading initial rows [only needed for the initial load]
    table.draw();

    // Set up the initial UI
    setupPage();

    // Load initial rows
    loadRows();
});