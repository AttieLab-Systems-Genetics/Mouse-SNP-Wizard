let highImpactIds = ["missense_variant", "splice_acceptor_variant", "splice_donor_variant", "splice_region_variant", "start_lost", "stop_gained", "stop_lost"];
let DOIds = ["WSB_EiJ", "129S1_SvImJ", "NOD_ShiLtJ", "NZO_HlLtJ", "PWK_PhJ", "CAST_EiJ", "A_J"];

function checkFields() {
    const searchButton = document.getElementById('search-button');
    if (document.getElementById('search-by-symbol').checked) {
        if (document.getElementById('gene-symbol').value === '') {
            searchButton.disabled = true;
        } else {
            searchButton.disabled = false;
        }
    } else if (document.getElementById('search-by-position').checked) {
        const chromosome = document.getElementById('chromosome').value;
        if (chromosome === '') {
            searchButton.disabled = true;
        } else {
            searchButton.disabled = false;
        }
    } else if (document.getElementById('search-all').checked) {
        searchButton.disabled = false;
    }
}

function showFields() {
    const symbolInput = document.getElementById('symbol-input');
    const positionInputs = document.getElementById('position-inputs');
    console.log(document.getElementById('search-by-symbol').checked);
    console.log(document.getElementById('search-by-position').checked);
    console.log(document.getElementById('search-all').checked);
    
    if (document.getElementById('search-by-symbol').checked) {
        symbolInput.style.display = 'block';
        positionInputs.style.display = 'none';
    } else if (document.getElementById('search-by-position').checked) {
        symbolInput.style.display = 'none';
        positionInputs.style.display = 'block';
    } else if (document.getElementById('search-all').checked) {
        symbolInput.style.display = 'none';
        positionInputs.style.display = 'none';
    }
    checkFields();
}


function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function formatInput(event) {
    event.target.value = formatNumber(event.target.value.replace(/,/g, ''));
}

document.getElementById('selectAll').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=consequence]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
    }
}

document.getElementById('selectHighImpact').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=consequence]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false; // deselect all
    }

    
    for (let i = 0; i < highImpactIds.length; i++) {
        document.getElementById(highImpactIds[i]).checked = true; // select high impact
    }
}

document.getElementById('deselectAll').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=consequence]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
}

document.getElementById('selectAllStrains').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=strain]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
    }
}

document.getElementById('selectDOMice').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=strain]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false; // deselect all
    }

   
    for (let i = 0; i < DOIds.length; i++) {
        console.log(DOIds[i])
        document.getElementById(DOIds[i]).checked = true; // select DO mice
    }
}

document.getElementById('deselectAllStrains').onclick = function () {
    let checkboxes = document.querySelectorAll("input[name=strain]");
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
}

window.onload = function () {
    //Set up event listeners
    fetch('/data.json')
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('language-options');
            data.sort();
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                datalist.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    
    
    
    //Set high confidence to true
    document.getElementById('high-confidence-only').checked = true; //! This will modify the search if the user clicks the back button


    showFields();
}


fetch('/data/consequences.json')
    .then(response => response.json())
    .then(data => {
        const consequences = document.getElementById('consequences');
        var num_columns = 3

        // Create the columns.
        const columns = Array.from({ length: num_columns }, () => document.createElement('div'));
        columns.forEach(column => {
            column.style = 'float: left; width: ' + (100 / num_columns) + '%;';
            consequences.appendChild(column);
        });

        // Create a copy of the data array, then sort it.
        let sortedData = [...data].sort();

        // Calculate the number of items per column.
        const itemsPerColumn = Math.ceil(sortedData.length / num_columns);

        // For each item in the sorted array...
        sortedData.forEach((item, index) => {
            // ...create a new checkbox with the appropriate properties.
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = 'consequence';
            input.id = item;

            // Use the index of the item in the original data array as the value.
            input.value = data.indexOf(item);

            input.checked = highImpactIds.includes(item);

            const span = document.createElement('span');
            span.className = 'checkmark';

            const label = document.createElement('label');
            label.className = 'checkbox-container';

            // Append the input and span to the label first before setting the label's innerHTML.
            label.appendChild(span);
            label.appendChild(input);

            // Set the text of the label. Use `textContent` to prevent potential XSS issues.
            const textNode = document.createTextNode(item);
            label.appendChild(textNode);

            // Append the label to the appropriate column.
            const columnIndex = Math.floor(index / itemsPerColumn);
            columns[columnIndex].appendChild(label);

            columns[columnIndex].appendChild(document.createElement('br'));
        });


    })
    .catch((error) => {
        console.error('Error:', error);
    });
