export function streamToString(stream: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((_resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => _resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
