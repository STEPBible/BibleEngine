/**
 * runs getMinimizedDbObject on all members of the given array
 */
export const generateMinimizedDbObjects = (dbObjects: any[]) => {
    return dbObjects.map(generateMinimizedDbObject);
};

/**
 * generates a shallow copy of the given object with only the properties that are needed to retain
 * the data inside (in order to reduce the JSON size)
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
 */
export const generateRandomChar = (): string => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // abcdefghijklmnopqrstuvwxyz0123456789
    return possible.charAt(Math.floor(Math.random() * possible.length));
};

export const isNode =
    typeof window === 'undefined' &&
    typeof document === 'undefined' &&
    typeof navigator === 'undefined' &&
    typeof process !== 'undefined';

/**
 * checks if the given variable is an object
 */
export const isObject = (variable: any) => typeof variable === 'object' && variable !== null;

/**
 * returns a zero-padded string of a number
 * @param n the number to be padded
 * @param width the length or the resulting string
 * @param z padding character (defaults to '0')
 */
export const pad = (n: number, width: number, z?: string): string => {
    z = z || '0';
    let nStr = n + '';
    return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(z) + n;
};

/**
 * Encrypts a buffer using AES-GCM with supplied password, for decryption with aesGcmDecrypt().
 * (c) Chris Veness MIT Licence, converted to work on Buffers by Chris Metz
 */
export async function aesGcmEncrypt(crypto: Crypto, buffer: ArrayBuffer, password: string) {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); // hash the password
    const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv
    const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']); // generate key from pw
    const ctBuffer = await crypto.subtle.encrypt(alg, key, buffer);

    var tmp = new Uint8Array(12 + ctBuffer.byteLength);
    tmp.set(iv, 0);
    tmp.set(new Uint8Array(ctBuffer), 12);
    return tmp.buffer;
}

/**
 * Decrypts buffer encrypted with aesGcmEncrypt() using supplied password.
 * (c) Chris Veness MIT Licence, converted to work on Buffers by Chris Metz
 */
export async function aesGcmDecrypt(
    crypto: Crypto,
    buffer: ArrayBuffer,
    password: string
): Promise<ArrayBuffer> {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); // hash the password
    const iv = buffer.slice(0, 12);
    const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']); // generate key from pw
    return crypto.subtle.decrypt(alg, key, buffer.slice(12)); // decrypt ciphertext using key
}
