const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder =  TextEncoder;
global.TextDecoder = TextDecoder;

const request = require('supertest');
const { User } = require('../../models/user');
const { Genre } = require('../../models/genres');

describe('auth middleware', () => {
    beforeEach(() => { server = require('../../index'); }); // getting the server from index where it is setup
    afterEach(async () => { 
        await Genre.remove({});
        server.close(); // close the server after each test.
        });

    const exec = () => {
        // This should define the happy path.
        return request(server)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: 'genre1' });
    };

    beforeEach(() => {
        token = new User().generateAuthToken();
    });

    it('should return 401 if no token is provided', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if no token is invalid', async () => {
        token = 'a';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if token is valid', async () => {
        
        const res = await exec();

        expect(res.status).toBe(200);
    });

});