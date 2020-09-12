export class SQLite {
    static isAvailable() {
        return !!window.plugins?.sqlDB
    }
    static async copy(filename: string) {
        return new Promise((resolve, reject) => {
            window.plugins.sqlDB.copy(
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
}