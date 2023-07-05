var strains = $('#strains').val().split(',');
var consequences = $('#consequence').val().split(',');
var limit = 10000; // Number of rows to load per request
var offset = 0; // Initial offset
const loadMoreButton = document.getElementById('loadMoreBtn');
const loadAllButton = document.getElementById('loadAllBtn');
var consequenceNames = document.getElementById('consequenceNames').value.split(',');
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
    fixedHeader: true,
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
            },
            filename: getFileName
        },
        {
            extend: 'excel',
            exportOptions: {
                orthogonal: 'sort'
            },
            filename: getFileName
        }
    ],
    columns: columns,
});

function getFileName() {
    if ($('#symbol').val() != '') {
        return $('#symbol').val();
    } else if ($('#chromosome').val() != '') {
        return "chr " + $('#chromosome').val() + " pos " + $('#start').val() + "-" + $('#end').val();
    } else {
        return "mouse_snp_wizard";
    }

}


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
    data = data.rows;
    if (data.length > 0) {
        // Append the new rows to the table
        data.forEach(function (data) {
            //Don't split on commas in when inside of {}
            var rowArray = data.row.replace("(", "").replace(")", "").replace(/"/g, '').split(/,(?![^{]*})/);

            //Fix consequence info to display text instead of indexes
            var consequences = rowArray[4].substring(1, rowArray[4].length - 1).split(",");
            if (consequences.length > 1) {
                var temp = "";
                for (var consequence in consequences) {
                    temp += consequenceNames[consequences[consequence]] + "&";
                }
                temp = temp.substring(0, temp.length - 1);
                rowArray[4] = temp;
            } else {
                rowArray[4] = consequenceNames[consequences[0]];
            }
            
            //Fix strain info to display x, ?, and NA
            for (var i = 5; i < rowArray.length; i++) {
                if (rowArray[i] == "-1") {
                    rowArray[i] = "NA";
                }
                else if (rowArray[i] == "1") {
                    rowArray[i] = "x";
                }
                else if (rowArray[i] == "2") {
                    rowArray[i] = "?";
                }
                else {
                    rowArray[i] = "";
                }
            }
            table.row.add(rowArray);
        });
    }
}

function loadRows() {
    $('.loading-image, .overlay').show();
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
            console.log(response)
            var results = response;

            add_data_to_table(results); // Add rows to the table

            table.draw(false); // Update the table

            offset += limit; // Increment the offset for the next request

            var info = table.page.info();
            $('#totalEntries').text(info.recordsTotal);

            // If there might be more rows to load, show the "Load More" button
            if (results.rows.length === limit) {
                $('.loading-image, .overlay').hide();
                loadMoreButton.disabled = false;
                loadAllButton.disabled = false;
            } else {
                // No more rows to load, hide the "Load More" button
                $("#loadMoreBtn, #loadAllBtn").hide();
                $('.loading-image, .overlay').hide();
            }
        },
        error: function (xhr, status, error) {
            // Handle error response
            $('.error, .overlay').show();
            $('.loading-image').hide();

            loadMoreButton.disabled = false;
            loadAllButton.disabled = false;
            //Set button to red with white text

            loadAllButton.style.backgroundColor = "red";
            loadAllButton.style.color = "white";
            loadMoreButton.style.backgroundColor = "red";
            loadMoreButton.style.color = "white";

            setTimeout(function () {
                $('.error, .overlay').hide();
            }, 3000);
        }
    });
}

function setupPage() {
    var consequenceText = "";
    var strainText = "";

    for (var consequence in consequences) {
        consequenceText += consequenceNames[consequences[consequence]] + ", ";
    }
    for (var strain in strains) {
        strainText += cleanStrain(strains[strain]) + ", ";
    }

    document.getElementById('consequenceDisplay').innerHTML = consequenceText.substring(0, consequenceText.length - 2)
    document.getElementById('strainDisplay').innerHTML = strainText.substring(0, strainText.length - 2)

    loadMoreButton.disabled = true;
    loadAllButton.disabled = true;
    $('.loading-image, .overlay').show();
    $('.error').hide();

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
    // Re-draw DataTables after loading initial rows [only needed for the initial load]
    table.draw();

    $('#myTable').on('mouseenter', '.shrink-column', function () {
        var $this = $(this);
        if (this.offsetWidth < this.scrollWidth && !$this.attr('title')) {
            $this.attr('title', $this.text());
        }
    });
});

// Load initial rows when the page loads
loadRows();

setupPage();

