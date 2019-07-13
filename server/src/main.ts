import { join } from 'path';
import 'reflect-metadata';
import * as Koa from 'koa';
import * as KoaBody from 'koa-bodyparser';
import * as KoaCors from '@koa/cors';
import { Container } from 'typedi';
import { useContainer as useContainerForRouting, useKoaServer } from 'routing-controllers';
import { useContainer as useContainerForTypeORM } from 'typeorm';

import { BibleEngine } from '@bible-engine/core';
import { BibleController } from './Bible.controller';

const apiVersion = 1;
const routePrefix = `/rest/v${apiVersion}`;

// register 3rd party IOC container
useContainerForRouting(Container);
useContainerForTypeORM(Container);

async function bootstrap() {
    try {
        const bibleEngine = new BibleEngine({
            type: 'sqlite',
            database: join(__dirname, './bibles.db')
        });
        Container.set('bibleEngine', bibleEngine);

        const app = new Koa();
        const PORT = process.env.PORT; // process.env.NODE_ENV === 'production' ? 3456 : 3456;
        console.log('Found this port: ', PORT)
        app.use(
            KoaCors({
                allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
                origin: '*' // http://localhost:8100
            })
        );

        app.use(
            KoaBody({
                jsonLimit: '10mb'
            })
        );

        // register created koa server in routing-controllers
        useKoaServer(app, {
            controllers: [BibleController],
            routePrefix
        });

        app.listen(PORT, () => {
            console.log(
                `BibleEngine Server is now running on http://localhost:${PORT}${routePrefix}`
            );
        });
    } catch (err) {
        console.error(err);
    }
}

bootstrap();
