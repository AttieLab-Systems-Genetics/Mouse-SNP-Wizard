var strains = $('#strains').val().split(',');
var consequences = $('#consequence').val().split(',');
console.log("consequences", consequences);
var loaded = false;
var consequenceNames
fetch('/data/consequences.json').then(response => response.json()).then(data => {
    consequenceNames = data;
    //Set the consequence text
    var consequenceText = "";
    for (var consequence in consequences) {
        console.log(consequenceNames[consequences[consequence]], consequences[consequence])
        consequenceText += consequenceNames[consequences[consequence]] + ", ";

    }
    console.log("consequenceText", consequenceText);
    document.getElementById('consequenceDisplay').innerHTML = consequenceText.substring(0, consequenceText.length - 2)
    loaded = true;
}).catch((error) => {
    console.error('Error:', error);
});


var limit = 10000; // Number of rows to load per request
var offset = 0; // Initial offset
const loadMoreButton = document.getElementById('loadMoreBtn');
const loadAllButton = document.getElementById('loadAllBtn');
var columns = [
    { title: "Symbol", data: 0 },
    { title: "Chr", data: 1 },
    { title: "Position", data: 2 },
    { title: "RS#", data: 3 },
    {
        title: "Consequence",
        data: 4,
        render: function (data, type, row) {
            if (type === 'display') {
                if (data == undefined)
                    return '';
                var index = data.indexOf('&');
                if (index !== -1) {
                    return data.substring(0, index) + '...';
                }
            }
            return data;
        }
    },
];


for (let i = 0; i < strains.length; i++) {
    columns.push({ title: cleanStrain(strains[i]), data: i + 5 });
}

var table = $('#myTable').DataTable({
    pageLength: 100,
    lengthMenu: [
        [100, 500, 1000, 5000, 10000, -1],
        [100, 500, 1000, 5000, 10000, "All"]
    ],
    "createdRow": function (row, data, index) {
        // Iterate through each cell in the row.
        $('td', row).each(function () {
            if ($(this).text() === 'x') {
                $(this).addClass('negative');
            } else if ($(this).text() === '✓') {
                $(this).addClass('positive');
            } else if ($(this).text() === '?') {
                $(this).addClass('unknown');
            }
        });
    },
    scrollX: true,
    responsive: true,
    dom: 'lBfrtip',
    buttons: [
        {
            extend: 'copy',
            exportOptions: {
                orthogonal: 'sort'
            }
        },
        {
            extend: 'csv',
            exportOptions: {
                orthogonal: 'sort'
            }
        },
        {
            extend: 'excel',
            exportOptions: {
                orthogonal: 'sort'
            }
        },
        {
            extend: 'pdf',
            exportOptions: {
                orthogonal: 'sort'
            }
        }
    ],
    columns: columns,
});



function cleanStrain(strain) {
    if (strain == 'A_J') {
        return 'A/J';
    } else if (strain.indexOf('_') !== -1) {
        return strain.substring(0, strain.indexOf('_'));
    } else {
        return strain;
    }
}


function add_data_to_table(data) {
    var waiting = 0
    while (!loaded) {
        waiting++;
        //Sleep for 1ms
        var start = new Date().getTime();
        var end = start;
        while (end < start + 1) {
            end = new Date().getTime();
        }

        if (waiting > 1000) {
            console.error("Error loading consequences");
            //Error!
            return;
        }
    }
    data = data.rows;
    if (data.length > 0) {
        // Append the new rows to the table
        data.forEach(function (data) {
            var rowArray = [
                data.symbol,
                data.chromosome,
                data.position,
                data.rs_number,
            ];
            if (data.consequence.length > 1) {
                var temp = "";
                for (var consequence in data.consequence) {
                    temp += consequenceNames[data.consequence[consequence]] + "&";
                }
                temp = temp.substring(0, temp.length - 1);
                rowArray.push(temp);
            } else {
                rowArray.push(consequenceNames[data.consequence[0]]); //add consequence
            }
            //add all strains
            strains.forEach(strain => {
                var value = data[strain];
                if (value == "-1") {
                    value = "NA";
                } else if (value == "1") {
                    value = "x";
                } else if (value == "2") {
                    value = "?";
                } else {
                    value = "";
                }
                rowArray.push(value);
            });
            table.row.add(rowArray);
        });
    }
}

function loadRows() {
    //If it is June, show the rainbow loader
    if (new Date().getMonth() == 5) {
        $('.rainbow-loading, .overlay').show();
    } else {
        $('.loader, .overlay').show();
    }
    loadMoreButton.disabled = true;
    loadAllButton.disabled = true;
    $.ajax({
        url: '/loadMore',
        method: 'GET',
        timeout: 600000, // Increase the timeout to 30 seconds (adjust as needed)
        data: {
            limit: limit,
            offset: offset,
            symbol: $('#symbol').val(),
            chromosome: $('#chromosome').val(),
            start: $('#start').val(),
            end: $('#end').val(),
            consequence: $('#consequence').val(),
            strains: $('#strains').val(),
            highConfidence: $('#highConfidence').val(),
        },
        success: function (response) {
            // Handle success response
            var results = response.results;

            add_data_to_table(results); // Add rows to the table

            table.draw(false); // Update the table

            offset += limit; // Increment the offset for the next request

            var info = table.page.info();
            $('#totalEntries').text(info.recordsTotal);

            // If there might be more rows to load, show the "Load More" button
            if (results.rows.length === limit) {
                //If it is June, show the rainbow loader
                if (new Date().getMonth() == 5) {
                    $('.rainbow-loading, .overlay').hide();
                } else {
                    $('.loader, .overlay').hide();
                }
                loadMoreButton.disabled = false;
                loadAllButton.disabled = false;
            } else {
                // No more rows to load, hide the "Load More" button
                $("#loadMoreBtn, #loadAllBtn").hide();
                if (new Date().getMonth() == 5) {
                    $('.rainbow-loading, .overlay').hide();
                } else {
                    $('.loader, .overlay').hide();
                }
            }
        },
        error: function () {
            // Handle error response
            //If it is June, show the rainbow loader
            if (new Date().getMonth() == 5) {
                $('.rainbow-loading, .overlay').hide();
            } else {
                $('.loader, .overlay').hide();
            }
            $('error').show(); //Hide after 3 seconds
            setTimeout(function () {
                $('error').hide();
            }, 3000);

            loadMoreButton.disabled = false;
            loadAllButton.disabled = false;
            //Set button to red with white text

            loadAllButton.style.backgroundColor = "red";
            loadAllButton.style.color = "white";
            loadMoreButton.style.backgroundColor = "red";
            loadMoreButton.style.color = "white";
        }
    });
}

function setupPage() {
    //Set up search terms   
    var strainText = "";
    for (var strain in strains) {
        strainText += cleanStrain(strains[strain]) + ", ";
    }

    document.getElementById('strainDisplay').innerHTML = strainText.substring(0, strainText.length - 2)

    loadMoreButton.disabled = true;
    loadAllButton.disabled = true;
    //If it is June, show the rainbow loader
    if (new Date().getMonth() == 5) {
        $('.rainbow-loading, .overlay').show();
        $('.loader, .error').hide();
    } else {
        $('.loader, .overlay').show();
        $('.rainbow-loading, .error').hide();
    }

    $("#loadMoreBtn, #loadAllBtn").show();



    // Load more rows when the "Load More" button is clicked
    $('#loadMoreBtn').click(function () {
        loadRows();
        //Reset button color to css
        loadAllButton.style.backgroundColor = "";
        loadAllButton.style.color = "";
        loadMoreButton.style.backgroundColor = "";
        loadMoreButton.style.color = "";
    });


    $('#loadAllBtn').click(function () {
        limit = -1;
        //Display warning as popup dialog 

        loadRows();
        //Reset button color to css
        loadAllButton.style.backgroundColor = "";
        loadAllButton.style.color = "";
        loadMoreButton.style.backgroundColor = "";
        loadMoreButton.style.color = "";
    });


    //Set table default show 100 rows
    table.page.len(100).draw();
}



$(document).ready(function () {
    setupPage();

    // Load initial rows when the page loads
    loadRows();

    // Re-draw DataTables after loading initial rows [only needed for the initial load]
    table.draw();

    $('#myTable').on('mouseenter', '.shrink-column', function () {
        var $this = $(this);
        if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
            $this.attr('title', $this.text());
        }
    });
});