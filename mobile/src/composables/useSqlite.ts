const sqliteIsAvailable = () => {
    return !!(window as any).plugins?.sqlDB
}

const copySqliteToFileSystem = (filename: string) => {
    if (!sqliteIsAvailable()) {
        return
    }
    return new Promise((resolve, reject) => {
        (window as any).plugins?.sqlDB.copy(
            filename,
            0,
            (success: any) => {
                resolve(success);
            },
            (error: any) => {
                reject(error);
            }
        );
    });
}

export async function useSqlite(filename: string) {
    try {
        await copySqliteToFileSystem(filename)
    } catch (error) {
        console.error('Failed to copy db to filesystem: ', filename, error)
    }
}

