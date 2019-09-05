export type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any;
export type SecondArgument<T> = T extends (arg1: any, arg2: infer U, ...args: any[]) => any
    ? U
    : any;
export type ThirdArgument<T> = T extends (
    arg1: any,
    arg2: any,
    arg3: infer U,
    ...args: any[]
) => any
    ? U
    : any;
export type FourthArgument<T> = T extends (
    arg1: any,
    arg2: any,
    arg3: any,
    arg4: infer U,
    ...args: any[]
) => any
    ? U
    : any;
export type FifthArgument<T> = T extends (
    arg1: any,
    arg2: any,
    arg3: any,
    arg4: any,
    arg5: infer U,
    ...args: any[]
) => any
    ? U
    : any;

export type ThenArg<T> = T extends Promise<infer U> ? U : T;

export type Clientify<T> = {
    [P in keyof T]: T[P] extends (...args: any) => any
        ? (
              ...args: any
          ) => Promise<IApiResponseSuccess<ThenArg<ReturnType<T[P]> & { source: 'remote' }>>>
        : undefined;
};

export interface IApiResponseSuccess<T> {
    result: T;
    statusCode: number;
}

export interface IApiResponseError {
    error: any;
    statusCode: number;
}

export class BibleEngineRemoteError extends Error {
    constructor(response: IApiResponseError) {
        super(`Error ${response.statusCode} from BibleEngine server: ${response.error}`);
        this.name = 'BibleEngineRemoteError';
    }
}

export async function apiRequest<T>({
    url,
    method,
    data,
    queryParams
}: {
    url: string;
    method?: 'POST' | 'PUT' | 'GET' | 'DELETE';
    data?: any;
    queryParams?: any;
}): Promise<IApiResponseSuccess<T & { source: 'remote' }>> {
    const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    const opt: RequestInit = { method: !method ? (!!data ? 'POST' : 'GET') : method, headers };
    if (data) opt.body = JSON.stringify(data);

    if (queryParams) {
        const paramStrings: string[] = [];
        for (const [key, value] of Object.entries(queryParams)) {
            if (typeof value !== 'undefined' && value !== null)
                paramStrings.push(`${key}=${value}`);
        }
        if (paramStrings.length) url += '?' + paramStrings.join('&');
    }

    let error: string | undefined;
    let result = null;
    let statusCode = 500;

    const response = await fetch(url, opt).catch(e => {
        // service unavailable (could be client offline or server down) => fetch doesn't give us
        // a more fine-tuned error status, we need to determine that down the line
        statusCode = 503;
        error = e;
        return null;
    });

    if (response !== null) {
        statusCode = response.status;
        const resultString = await response.text();
        try {
            result = JSON.parse(resultString);
        } catch (e) {
            if (statusCode === 200) {
                error = e;
                statusCode = 415; // Unsupported media type
            } else {
                error = resultString;
                result = null;
            }
        }
    }

    if (statusCode >= 400) {
        if (!error) error = result || 'unknown_error';
        throw new BibleEngineRemoteError({ error, statusCode });
    } else {
        result.source = 'remote';
        return { result, statusCode };
    }
}
