const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder =  TextEncoder;
global.TextDecoder = TextDecoder;


const request = require('supertest'); // returns a function called request
const {Genre} = require('../../models/genres');
const {User} = require('../../models/user');
const mongoose = require('mongoose');

let server; // declare the variable

describe('/api/genres', () => {
    // 
    beforeEach(() => { server = require('../../index'); });
    afterEach(async () => { 
        
        server.close(); 
        await Genre.remove({});
        
    });



    describe('GET /', () => {
        it('should return all genres', async () => {
            // setup the data first
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre3' },
            ]);
            const res = await request(server).get('/api/genres');
            expect(res.status).toBe(200);
            // expect(res.body.length).toBe(2); // checking there are 2 elements in the array
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre3')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return the genre by id if passed', async () => {
            // setup the data first
            const genre = new Genre({ name: 'genre1'});
            await genre.save();

            // now test the end point with the server object
            const res = await request(server).get('/api/genres/' + genre._id );
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        })
    });

    describe('POST /', () => {

        // Define the happy path, and then in each test, we change
        // one parameter that clearly aligns with the name of the 
        // test.
        let token;
        let name; // set name in each test


        const exec = async () => {
            return await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({ name }); // if the key and value are the same name just set the key
        };

        beforeEach(() => {
            token = new User().generateAuthToken();  // Before each is used to excute instruction for each test
            name = 'genre1';
        });

        it('should return a 401 if the client is not logged in', async () => {
            token = ''; // Unse the token as the test requires user not be logged in with x-auth-token
           
            const res = await exec();

            expect(res.status).toBe(401);

        });

        it('should return a 400 if genre is less than 5 characters', async () => {
            name = 'gen'; 

            const res = await exec();
            
            expect(res.status).toBe(400);

        });

        it('should return a 400 if genre is more than 50 characters', async () => {
            name = new Array(52).join('a'); // remove the const as it will set name with different scope

            const res = await exec();

            expect(res.status).toBe(400);

        });

        it('should save the genre if it is valid.', async () => {
                        
            await exec(); // this writes to the database.
            
            const genre = await Genre.find({ name: 'genre1' }); // this finds the record written to the database.  

            expect(genre).not.toBeNull;

        });

        it('should return the genre if it is valid.', async () => {
                                    
            const res = await exec();
            
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');

        });

    });
});