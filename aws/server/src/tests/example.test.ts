import * as request from 'supertest';
import { configureApp } from '../app';

describe('a feature of the system', () => {
    it('displays some specific behaviour', async () => {
        const app = configureApp();
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });
});
