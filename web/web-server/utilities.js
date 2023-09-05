const DOIds = require('../public/data/DOIds.json');
const Debug = require('./debug');

/**
 * Creates a mapping from Strain to Letter based on DOIds.
 * 
 * @param {Array} DOIds - An array of objects containing strain and letter pairs.
 * @returns {Object} The mapping from Strain to Letter.
 */
const createStrainToLetterMap = (DOIds) => {
    const strainToLetter = {};
    Debug.debug('DOIds: ');
    Debug.debug(DOIds);
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
const sortStrains = (strains) => {
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

module.exports = {
    sortStrains
};