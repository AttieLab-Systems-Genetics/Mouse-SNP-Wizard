// ------------------------------
// Fetch Symbols from Server
// ------------------------------
const loadSymbols = async () => {
    try {
        const response = await fetch('/symbols');
        if (!response.ok) {
            console.log('Error getting symbols:', response.status);
            return;
        }
        const data = await response.json();
        symbols = JSON.parse(data.symbols);
        updateTable();
        checkGeneSymbol(document.getElementById('gene-symbol'));
    } catch (error) {
        console.log('Error getting symbols:', error);
    }
};



// ------------------------------
// Utility Functions
// ------------------------------

/**
 * Get the table name based on the selected version and dataset.
 * This function assumes there are radio buttons for version and dataset.
 * @returns {string} The name of the table.
 */
const getTableName = () => {
    let version = "";
    let dataset = "";

    // Loop through all radio buttons with the name 'version' to find the selected one
    document.getElementsByName('version').forEach((radio) => {
        if (radio.checked) {
            version = radio.value;
        }
    });

    // Loop through all radio buttons with the name 'dataset' to find the selected one
    document.getElementsByName('dataset').forEach((radio) => {
        if (radio.checked) {
            dataset = radio.value;
        }
    });

    return `${version}_${dataset}`;
};

/**
 * Format a number with commas as thousands separators.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number as a string.
 */
const formatNumber = (num) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

/**
 * Check if the gene symbol entered in the input field is valid.
 * Updates the UI accordingly and triggers field validation.
 * @param {HTMLElement} input - The input element containing the gene symbol.
 */
const checkGeneSymbol = (input) => {
    const inputValue = input.value.toLowerCase();
    console.log(inputValue, geneSymbolDict[inputValue])
    // Assume geneSymbolDict is a predefined dictionary of valid gene symbols
    if (geneSymbolDict[inputValue] !== undefined) {
        input.dataset.valid = "true";
        input.value = geneSymbolDict[inputValue];
    } else {
        input.dataset.valid = "false";
    }

    // Trigger form field validation
    checkFields();
};


// ------------------------------
// Data List and Symbol Handling
// ------------------------------

/**
 * Creates a datalist element for gene symbols based on a given table name.
 * Appends the datalist to the document body and sets it as the list attribute
 * for the 'gene-symbol' input element.
 *
 * @param {string} table - The table name to use for creating the datalist
 */
const createDataList = (table) => {
    // Create a new datalist element
    const datalist = document.createElement('datalist');
    datalist.id = `datalist-${table}`;

    // Populate the datalist with options based on the 'symbols' object
    for (let key in symbols[table]) {
        const option = document.createElement('option');
        option.value = symbols[table][key];
        datalist.appendChild(option);
    }

    // Append the datalist to the document body
    document.body.appendChild(datalist);

    // Set the 'list' attribute for the 'gene-symbol' input element
    document.getElementById('gene-symbol').setAttribute('list', `datalist-${table}`);
};

/**
 * Sets the symbols to the correct table. If a datalist for the given table
 * doesn't exist, it will create one using the createDataList function.
 *
 * @param {string} table - The table name to use for setting the symbols
 */
const setSymbolsToTable = (table) => {
    // Check if a datalist for this table already exists
    if (!document.getElementById(`datalist-${table}`)) {
        createDataList(table);
    }

    // Set the 'list' attribute for the 'gene-symbol' input element
    document.getElementById('gene-symbol').setAttribute('list', `datalist-${table}`);
};


// ------------------------------
// Update Table
// ------------------------------

/**
 * Updates the table and other UI elements based on selected options.
 * - Sets the title based on the type of table (SNP or Indel).
 * - Updates consequence checkboxes based on available consequences for the table.
 * - Sets high impact consequences.
 * - Sets the gene symbols for the table.
 * - Disables/enables search-by-symbol options based on symbols availability.
 */
const updateTable = () => {
    // Get the current table name
    const table = getTableName();

    // Update the title based on the type of table (SNP or Indel)
    const titleText = table.toLowerCase().includes('indel') ? 'Mouse Indel Wizard' : 'Mouse SNP Wizard';
    document.getElementsByTagName('title')[0].innerHTML = titleText;
    document.querySelector('.title').innerHTML = titleText;

    // Update consequence checkboxes
    const consequences = document.getElementsByName('consequence');
    consequences.forEach((checkbox) => {
        // Uncheck and reset color
        checkbox.checked = false;
        checkbox.parentElement.style.color = 'black';

        // Disable checkboxes that are not valid for the current table
        const isValid = consequenceTables[table].includes(parseInt(checkbox.value));
        checkbox.disabled = !isValid;
        if (!isValid) {
            checkbox.parentElement.style.color = 'grey';
        }
    });

    // Check high-impact consequences if they are not disabled
    highImpactIds.forEach((id) => {
        const checkbox = document.getElementById(id);
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = true;
        }
    });

    // Set the gene symbols for the table
    if (symbols) {
        setSymbolsToTable(table);
        geneSymbolDict = symbols[table];
    }

    // Disable/Enable search-by-symbol options based on symbols availability
    const hasSymbols = symbols && Object.keys(symbols[table]).length > 0;
    //Enable search-by-symbol by default if search-all is selected and symbols are available
    if (hasSymbols && document.getElementById('search-all').checked && document.getElementById('search-by-symbol').disabled) {
        document.getElementById('search-by-symbol').checked = true;
        document.getElementById('search-all').checked = false;
    }
    ['search-by-symbol', 'search-by-symbols'].forEach((id) => {
        document.getElementById(id).disabled = !hasSymbols;
        const label = document.querySelector(`label[for='${id}']`);
        if (label) {
            label.style.color = hasSymbols ? 'black' : 'grey';
        }
    });

    // If no symbols, default to 'search-all'
    if (!hasSymbols && (document.getElementById('search-by-symbol').checked || document.getElementById('search-by-symbols').checked)) {
        document.getElementById('search-all').checked = true;
        document.getElementById('search-by-symbol').checked = false;
        document.getElementById('search-by-symbols').checked = false;
    }

    // Show the necessary fields based on current selections
    showFields();
};


// ------------------------------
// Form Validation
// ------------------------------
/**
 * Validates the search form.
 * - Checks for conditions based on the selected search options.
 * - Updates the warning div for invalid symbols.
 * 
 * @returns {boolean} True if the form is valid, false otherwise.
 */
const isValidSearch = () => {
    const debug = true;
    // Validate search by single symbol
    if (document.getElementById('search-by-symbol').checked) {
        const geneSymbol = document.getElementById('gene-symbol').value;
        if (!geneSymbol || document.getElementById('gene-symbol').dataset.valid !== 'true') {
            if (debug) console.log('Invalid gene symbol');
            return false;
        }
    }

    // Validate search by multiple symbols
    if (document.getElementById('search-by-symbols').checked) {
        const symbolsInput = document.getElementById('gene-symbols').value;
        if (!symbolsInput) {
            if (debug) console.log('Invalid symbols input');
            return false;
        }

        const symbols = symbolsInput.split(/[\s,]+/);
        const warningDiv = document.getElementById('warning');
        warningDiv.innerHTML = '';

        // Check each symbol for validity
        for (const symbol of symbols) {
            if (!symbol) {
                continue;
            }
            const lowerCaseSymbol = symbol.toLowerCase();
            //If the symbol is not in the dictionary and is not blank, add it to the warning div
            if (!geneSymbolDict[lowerCaseSymbol]) {
                warningDiv.textContent += (warningDiv.textContent ? '; ' : 'Invalid symbols: ') + symbol;
            } else {
                document.getElementById('gene-symbols').value = symbolsInput.replace(symbol, geneSymbolDict[lowerCaseSymbol]);
            }
        }
    }

    // Validate search by position
    if (document.getElementById('search-by-position').checked) {
        const chromosome = document.getElementById('chromosome').value;
        const startPosition = parseInt(document.getElementById('start-position').value);
        const endPosition = parseInt(document.getElementById('end-position').value);

        if (!chromosome || startPosition < 0 || endPosition < 0 || startPosition * document.getElementById('start-position-units').value > endPosition * document.getElementById('end-position-units').value) {
            if (debug) console.log('Invalid position');
            return false;
        }
    }

    // Validate that at least one consequence is selected
    const isConsequenceSelected = Array.from(document.getElementsByName('consequence')).some(checkbox => checkbox.checked);
    if (!isConsequenceSelected) {
        if (debug) console.log('No consequence selected');
        return false;
    }

    // Validate that at least one strain is selected if not searching all strains
    const isStrainSelected = Array.from(document.getElementsByName('strain')).some(checkbox => checkbox.checked);
    if (!isStrainSelected) {
        if (debug) console.log('No strain selected');
        return false;
    }

    return true;
};


/**
 * Enables or disables the search button based on the validity of the search form.
 * 
 * @returns {boolean} True if the search is valid, false otherwise.
 */
const checkFields = () => {
    const isValid = isValidSearch();
    document.getElementById('search-button').disabled = !isValid;
    return isValid;
};

// ------------------------------
// Dynamic UI Updates
// ------------------------------
/**
 * Dynamically updates the visibility of the input fields based on the selected search options.
 */
const showFields = () => {
    // Define arrays for IDs of fields to hide and search options
    const fieldsToHide = ['symbol-input', 'position-inputs', 'symbols-input', 'rs-number-input'];
    const searchOptions = ['search-by-symbol', 'search-by-position', 'search-by-symbols', 'search-by-rs-number','search-all'];

    // Hide all input fields initially
    fieldsToHide.forEach(fieldId => {
        document.getElementById(fieldId).style.display = 'none';
    });

    // Find the selected search option
    const selectedOption = searchOptions.find(option => document.getElementById(option).checked);

    //Check if the selected option is search-all
    if (selectedOption === 'search-all') {
        return;
    }

    // If no option is selected, default to 'search-by-symbol' and re-run this function
    if (!selectedOption && !document.getElementById('search-by-symbol').disabled) {
        document.getElementById('search-by-symbol').checked = true;
        return showFields();
    } else if (!selectedOption) {
        document.getElementById('search-all').checked = true;
        return showFields();
    }

    // Show the input field corresponding to the selected search option
    const selectedField = selectedOption.split('-by-')[1] + '-input';
    document.getElementById(selectedField).style.display = 'block';

    // Re-check form fields to enable/disable the search button
    checkFields();
};



// ------------------------------
// Set Consequences and Strains
// ------------------------------
/**
 * Dynamically generates checkboxes for consequences.
 * 
 * @param {number} num_columns - The number of columns to divide the checkboxes into.
 */
const setConsequences = (num_columns = 3) => {
    const consequences = document.getElementById('consequences');
    const columns = Array.from({ length: num_columns }, () => document.createElement('div'));

    columns.forEach(column => {
        column.style = `float: left; width: ${100 / num_columns}%`;
        consequences.appendChild(column);
    });

    let sortedData = [...consequenceNames].sort();
    const itemsPerColumn = Math.ceil(sortedData.length / num_columns);

    sortedData.forEach((item, index) => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'consequence';
        input.id = item;
        input.value = consequenceNames.indexOf(item);
        input.checked = highImpactIds.includes(item);

        const span = document.createElement('span');
        span.className = 'checkmark';

        const label = document.createElement('label');
        label.className = 'checkbox-container';
        label.appendChild(span);
        label.appendChild(input);
        label.appendChild(document.createTextNode(item));

        const columnIndex = Math.floor(index / itemsPerColumn);
        columns[columnIndex].appendChild(label);
        columns[columnIndex].appendChild(document.createElement('br'));
    });
};

/**
 * Dynamically generates checkboxes for strains.
 * 
 * @param {number} num_columns - The number of columns to divide the checkboxes into.
 */
const setStrains = (num_columns = 4) => {
    const strains = document.getElementById('strains');
    const columns = Array.from({ length: num_columns }, () => document.createElement('div'));

    columns.forEach(column => {
        column.style = `float: left; width: ${100 / num_columns}%`;
        strains.appendChild(column);
    });

    let sortedData = [...strainNames].sort();
    const itemsPerColumn = Math.ceil(sortedData.length / num_columns);

    sortedData.forEach((item, index) => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'strain';
        input.id = item;
        input.value = item;
        input.checked = DOIds.some(obj => obj.Strain === item);

        const span = document.createElement('span');
        span.className = 'checkmark';

        const label = document.createElement('label');
        label.className = 'checkbox-container';
        label.appendChild(span);
        label.appendChild(input);
        label.appendChild(document.createTextNode(item));

        const columnIndex = Math.floor(index / itemsPerColumn);
        columns[columnIndex].appendChild(label);
        columns[columnIndex].appendChild(document.createElement('br'));
    });
};


// ------------------------------
// Event Handlers
// ------------------------------
// Attach event handlers to HTML elements for interactivity

// Event handler for gene symbol input
document.getElementById('gene-symbol').addEventListener('input', function () {
    checkGeneSymbol(this);
});

document.getElementById('gene-symbol').addEventListener('blur', function () {
    if (this.dataset.valid === 'false') {
        this.style.color = 'red';
    }
});

document.getElementById('gene-symbol').addEventListener('focus', function () {
    this.style.color = 'black';
});

/**
 * Helper function to toggle checkbox status.
 * @param {string} name - The name attribute of checkboxes to target.
 * @param {boolean} isChecked - Whether the checkboxes should be checked or not.
 * @param {function} condition - Additional condition to apply when toggling (optional).
 */
const toggleCheckboxes = (name, isChecked, condition = () => true) => {
    const checkboxes = document.querySelectorAll(`input[name=${name}]`);
    checkboxes.forEach((checkbox) => {
        if (condition(checkbox)) {
            checkbox.checked = isChecked;
        }
    });
};

/**
 * Select all available consequences.
 */
document.getElementById('selectAll').onclick = () => {
    toggleCheckboxes('consequence', true, checkbox => !checkbox.disabled);
};

/**
 * Deselect all consequences, then select only the high impact ones.
 */
document.getElementById('selectHighImpact').onclick = () => {
    // Deselect all
    toggleCheckboxes('consequence', false);
    // Select high impact
    highImpactIds.forEach((id) => {
        const checkbox = document.getElementById(id);
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = true;
        }
    });
};

/**
 * Deselect all consequences.
 */
document.getElementById('deselectAll').onclick = () => {
    toggleCheckboxes('consequence', false);
};

/**
 * Select all available strains.
 */
document.getElementById('selectAllStrains').onclick = () => {
    toggleCheckboxes('strain', true);
};

/**
 * Deselect all strains, then select only DO mice strains.
 */
document.getElementById('selectDOMice').onclick = () => {
    // Deselect all
    toggleCheckboxes('strain', false);
    // Select DO mice
    DOIds.forEach((obj) => {
        const checkbox = document.getElementById(obj.Strain);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
};

/**
 * Deselect all strains.
 */
document.getElementById('deselectAllStrains').onclick = () => {
    toggleCheckboxes('strain', false);
};

// ------------------------------
// Log Form Data
// ------------------------------
let currentRequest = null;
let lastRequest = null;
const form = document.getElementById('form');

/**
 * Transforms FormData into a JavaScript object.
 * 
 * @param {FormData} formData - The FormData object to be transformed.
 * @returns {Object} The transformed object.
 */
const formDataToObject = (formData) => {
    const dataArray = {};
    for (let pair of formData.entries()) {
        if (dataArray[pair[0]]) {
            dataArray[pair[0]].push(pair[1]);
        } else {
            dataArray[pair[0]] = [pair[1]];
        }
    }

    // If the array has only one item, use the item instead of the array
    for (let key in dataArray) {
        if (dataArray[key].length === 1) {
            dataArray[key] = dataArray[key][0];
        }
    }
    return dataArray;
};

/**
 * Creates a mapping from Strain to Letter based on DOIds.
 * 
 * @param {Array} DOIds - An array of objects containing strain and letter pairs.
 * @returns {Object} The mapping from Strain to Letter.
 */
const createStrainToLetterMap = (DOIds) => {
    const strainToLetter = {};
    DOIds.forEach((obj) => {
        strainToLetter[obj.Strain] = obj.Letter;
    });
    return strainToLetter;
};

/**
 * Sorts an array of strains based on DOIds.
 * 
 * @param {Array} strains - The array of strains to be sorted.
 * @param {Array} DOIds - An array of objects containing strain and letter pairs.
 * @returns {Array} The sorted array of strains.
 */
const sortStrains = (strains, DOIds) => {
    const strainToLetter = createStrainToLetterMap(DOIds);

    return strains.sort((a, b) => {
        const letterA = strainToLetter[a];
        const letterB = strainToLetter[b];

        if (letterA && letterB) {
            return letterA.localeCompare(letterB);
        } else if (letterA) {
            return -1;
        } else if (letterB) {
            return 1;
        } else {
            return a.localeCompare(b);
        }
    });
};

/**
 * Sends an AJAX request with the given data object.
 * 
 * @param {Object} dataObject - The data to be sent in the AJAX request.
 */
const sendAjaxRequest = (dataObject) => {
    currentRequest = $.ajax({
        url: '/count',
        method: 'GET',
        data: dataObject,
        success: (data) => {
            if (data.count > 1000) {
                document.getElementById('count').innerHTML = '> 1,000 SNPs found';
            } else {
                document.getElementById('count').innerHTML = `${data.count} SNPs found`;
            }
        },
        complete: () => {
            currentRequest = null;
        },
        error: (jqXHR, textStatus, errorThrown) => {
            //If there is a RESPONSEJSON, then use that error message, otherwise use the error thrown
            let errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.error : errorThrown;
            document.getElementById('count').innerHTML = `Error: ${errorMessage}`;
        }
    });
};

/**
 * Logs the form data and initiates an AJAX request.
 * 
 * @param {HTMLFormElement} form - The form element containing the data.
 */
const logFormData = (form) => {
    // Validate form fields before proceeding
    if (!checkFields()) {
        document.getElementById('count').innerHTML = 'Invalid search';
        return;
    }

    // Convert FormData to a more manageable object
    const formData = new FormData(form);
    const dataObject = formDataToObject(formData);

    // Sort strains if they exist in the data object
    if (dataObject.strain) {
        dataObject.strain = sortStrains(dataObject.strain, DOIds);
    }

    //Remove the whitespace around the gene symbols
    if (dataObject.symbols) {
        dataObject.symbols = dataObject.symbols.replace(/\s/g, '');
    }

    dataObject.table = getTableName();

    //Check if the request is the same as the last request, if so, skip
    if (JSON.stringify(dataObject) === JSON.stringify(lastRequest)) {
        return;
    }
    lastRequest = dataObject;
    // Abort any existing request
    if (currentRequest) {
        currentRequest.abort();
    }
    // Update UI to indicate search is in progress
    document.getElementById('count').innerHTML = 'Searching...';

    
    // Send the AJAX request
    sendAjaxRequest(dataObject);
};

// ------------------------------
// Initialization and Variable Definitions
// ------------------------------
const getValueAndRemoveElement = (elementId) => {
    const value = document.getElementById(elementId).value;
    document.getElementById(elementId).remove();
    return value;
};

let consequenceNames = getValueAndRemoveElement('consequenceNames').split(',');
let strainNames = getValueAndRemoveElement('strainNames').split(',');
let highImpactIds = getValueAndRemoveElement('consequenceHighImpact').split(',');
let consequenceTables = JSON.parse(getValueAndRemoveElement('consequenceTables'));
let DOIds = JSON.parse(getValueAndRemoveElement('DOIds'));
let geneSymbolDict = {};
let table = getTableName();
let symbols = null;

// ------------------------------
// Main Logic
// ------------------------------
// Main logic for handling user interactions and updating the UI

// Initialize the page
loadSymbols();  // Load symbols from the server
setConsequences();  // Set up the consequence checkboxes
setStrains();  // Set up the strain checkboxes
updateTable();  // Update the table based on the selected options


// ------------------------------
// Event Listeners
// ------------------------------
/**
 * Attach an event listener for form fields that are not of type 'text'.
 * The event is triggered when the field value changes.
 */
Array.from(form.elements).forEach(element => {
    // Attach a 'change' event listener to form fields that are not text inputs
    element.addEventListener('change', () => {
        if (element.type === 'text') {
            //Check the previous value of the text field, if it the same, skip
            if (element.dataset.previousValue === element.value) {
                return;
            }
            //Set the previous value of the text field
            element.dataset.previousValue = element.value;
        }
        // Call the logFormData function when the field value changes
        logFormData(form);
    });
});

/**
 * Attach an event listener for form fields that are of type 'text'.
 * The event is triggered when text input changes.
 */
Array.from(document.querySelectorAll('input[type=text]')).forEach(element => {
    // Attach an 'input' event listener to text fields
    element.addEventListener('input', () => {
        //Set the previous value of the text field
        element.dataset.previousValue = element.value;
        // Call the logFormData function when text input changes
        logFormData(form);
    });
});

/**
 * Attach event listeners for buttons.
 * The event is triggered when a button is clicked.
 */
Array.from(document.querySelectorAll('button')).forEach(element => {
    // Attach a 'click' event listener to buttons
    element.addEventListener('click', () => {
        // Call the logFormData function when a button is clicked
        logFormData(form);
    });
});

//Make sure that the gene symbol is valid when the page is loaded
window.addEventListener('pageshow', function (event) {
    showFields();
    checkGeneSymbol(document.getElementById('gene-symbol'));
});