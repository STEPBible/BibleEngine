import * as express from 'express';
const app = express();
import * as Sentry from '@sentry/node';
if (process.env.NODE_ENV === 'production') {
    Sentry.init({ dsn: 'https://a0758a0dd01040728b6b7b0a3747d7f8@sentry.io/1427804' });
}
import { json, urlencoded } from 'body-parser';
import * as cors from 'cors';
import { eventContext } from 'aws-serverless-express/middleware';

export function configureApp() {
    app.use(Sentry.Handlers.requestHandler());

    app.get('/', (req, res) => {
        res.status(200).send(
            JSON.stringify({
                message: 'hello world'
            })
        );
    });

    app.use(Sentry.Handlers.errorHandler());
    app.use(cors());
    app.use(json());
    app.use(urlencoded({ extended: true }));
    app.use(eventContext());

    return app;
}
