require('isomorphic-fetch');
import * as koa from 'koa';
import * as koaRouter from 'koa-router';
import * as bodyParser from 'koa-bodyparser';

import { BibleEngine } from '@bible-engine/core';
import { IBibleReferenceRangeQuery } from '@bible-engine/core/src/models';

const api = new BibleEngine({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'bibleengine',
    password: 'bibleengine',
    database: 'bibleengine'
});
const app = new koa();
app.use(bodyParser());
const router = new koaRouter();
const PORT = process.env.NODE_ENV === 'production' ? 3456 : 3456;

router.post('/getFullDataForReferenceRange', async (ctx, _) => {
    const bibleContent = await api.getFullDataForReferenceRange(
        <IBibleReferenceRangeQuery>ctx.request.body,
        true
    );

    ctx.body = bibleContent;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
    console.log(`BibleEngine Server is now running on http://localhost:${PORT}`);
});
