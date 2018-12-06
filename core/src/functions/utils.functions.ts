/**
 * runs getMinimizedDbObject on all members of the given array
 * @param {any[]} dbObjects
 * @returns {any[]}
 */
export const generateMinimizedDbObjects = (dbObjects: any[]) => {
    return dbObjects.map(generateMinimizedDbObject);
};

/**
 * generates a shallow copy of the given object with only the properties that are needed to retain
 * the data inside (in order to reduce the JSON size)
 *
 * @param {*} dbObject
 * @returns {*}
 */
export const generateMinimizedDbObject = (dbObject: any) => {
    const strippedObject: any = {};
    for (const property of Object.keys(dbObject)) {
        if (
            property.indexOf('Json') !== -1 ||
            dbObject[property] === null ||
            (isObject(dbObject[property]) && !Object.keys(dbObject[property]).length)
        )
            continue;
        strippedObject[property] = dbObject[property];
    }
    return strippedObject;
};

/**
 * generates a random uppercase char
 * @returns {string}
 */
export const generateRandomChar = (): string => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // abcdefghijklmnopqrstuvwxyz0123456789
    return possible.charAt(Math.floor(Math.random() * possible.length));
};

/**
 * checks if the given variable is an object
 * @param {*} variable
 * @return boolean
 */
export const isObject = (variable: any) => typeof variable === 'object' && variable !== null;

/**
 * returns a zero-padded string of a number
 * @param {number} n the number to be padded
 * @param {number} width the length or the resulting string
 * @param {string} [z='0'] padding character
 * @returns {string}
 */
export const pad = (n: number, width: number, z?: string): string => {
    z = z || '0';
    let nStr = n + '';
    return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(z) + n;
};
