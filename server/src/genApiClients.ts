import 'reflect-metadata';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import * as Koa from 'koa';
import { useKoaServer, getMetadataArgsStorage, MetadataArgsStorage } from 'routing-controllers';
import { ControllerMetadataArgs } from 'routing-controllers/types/metadata/args/ControllerMetadataArgs';

import { BibleController } from './Bible.controller';

function genApiClient(
    apiName: string,
    controller: ControllerMetadataArgs,
    controllerMetadata: MetadataArgsStorage
) {
    let ts = '';
    ts += `
    import { apiRequest, Clientify, ThenArg, 
                FirstArgument, SecondArgument, ThirdArgument, FourthArgument, FifthArgument
            } from './helpers';
    import { ${controller.target.name} } from '@bible-engine/server';

    export class ${apiName}Api implements Clientify<${controller.target.name}> {
        constructor(private apiBaseUrl: string) {}    
    `;

    for (const method of controllerMetadata.filterActionsWithTarget(controller.target)) {
        ts += `
        ${method.method}(`;
        const routeParams: string[] = [];
        const queryParams: string[] = [];
        let bodyTs;
        let paramIdx = 0;
        let paramsTs = '';
        for (const param of controllerMetadata
            .filterParamsWithTargetAndMethod(method.target, method.method)
            .reverse()) {
            paramIdx++;
            const ArgumentTypeNumber =
                paramIdx === 1
                    ? 'First'
                    : paramIdx === 2
                    ? 'Second'
                    : paramIdx === 3
                    ? 'Third'
                    : paramIdx === 4
                    ? 'Fourth'
                    : paramIdx === 5
                    ? 'Fifth'
                    : null;
            const ArgumentType =
                ArgumentTypeNumber === null
                    ? 'any'
                    : `${ArgumentTypeNumber}Argument<${controller.target.name}['${method.method}']>`;
            if (param.type === 'body') {
                bodyTs = `data${param.required ? '' : '?'}: ${ArgumentType},`;
            } else if (param.type === 'param' || param.type === 'query') {
                if (param.type === 'param' && param.name) routeParams.push(param.name);
                else if (param.type === 'query' && param.name) queryParams.push(param.name);
                paramsTs += `
                ${param.name}${param.required ? '' : '?'}: ${ArgumentType};`;
            }
        }

        if (paramsTs)
            ts += `
            params: {${paramsTs}
            },`;
        
        if (bodyTs)
            ts += `
            ${bodyTs}`;

        ts += `
        ) {
            let path = '${controller.route || ''}${method.route || ''}';
        `;

        for (const param of routeParams) {
            ts += `
            path = path.replace(':${param}', params.${param}+'');`;
        }

        ts += `
            
            return apiRequest<
                ThenArg<ReturnType<${controller.target.name}['${method.method}']>>
            >({
                url: this.apiBaseUrl + path,
                method: '${method.type.toUpperCase()}',`;
        if (bodyTs)
            ts += `
                data: data,`;

        if (queryParams.length) {
            ts += `
                queryParams: {`;
            for (const param of queryParams) {
                ts += `
                    ${param}: params.${param},`;
            }
            ts += `
                }`;
        }

        ts += `
            });
        }
        `;
    }

    ts += `
    }`;

    return ts;
}

async function genApiClients() {
    const app = new Koa();
    // register created koa server in routing-controllers
    useKoaServer(app, {
        controllers: [BibleController]
    });
    const controllerMetadata = getMetadataArgsStorage();

    if (!existsSync(join(__dirname, '../../client/src')))
        mkdirSync(join(__dirname, '../../client/src'));

    // let indexTs = '';
    for (const controller of controllerMetadata.controllers) {
        const apiName = controller.target.name.slice(0, -10);
        const controllerTs = await genApiClient(apiName, controller, controllerMetadata);
        const path = join(__dirname, `../../client/src/${apiName}.api.ts`);
        await writeFileSync(path, controllerTs);

        // indexTs += `
        //     export * from './${apiName}.api';`;
    }
    // writeFileSync(join(__dirname, '../client/index.ts'), indexTs);
}

genApiClients();
