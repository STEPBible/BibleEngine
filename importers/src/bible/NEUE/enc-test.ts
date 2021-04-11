import { resolve } from 'path';
import { createReadStream } from 'fs';
import { decodeStream, encodeStream } from 'iconv-lite';

function streamToString(stream: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((_resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => _resolve(Buffer.concat(chunks).toString()));
    });
}

(async () => {
    // Convert encoding streaming example
    const bookHtml = await streamToString(
        createReadStream(resolve(__dirname) + '/html/jes.html')
            .pipe(decodeStream('windows1252'))
            .pipe(encodeStream('utf8'))
    );

    console.log(bookHtml);
})();
