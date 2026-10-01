const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder =  TextEncoder;
global.TextDecoder = TextDecoder;

const moment = require('moment');
const request = require('supertest');
const {Rental} = require('../../models/rentals');
const {Movie} = require('../../models/movies');
const {User} = require('../../models/user');
const mongoose = require('mongoose');

describe('/api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let rental;
    let movie;
    let token;

    const exec = () => {
        // This should define the happy path.
            return request(server)
                .post('/api/returns')
                .set('x-auth-token', token)
                .send({ customerId, movieId });
            };


    beforeEach(async () => {
        
        server = require('../../index');

        // Polpluate the test data
        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        token = new User().generateAuthToken();
        
        movie = new Movie({
            _id: movieId,
            title: '12345',
            dailyRentalRate: 2,
            genre: { name: '12345' },
            numberInStock: 10
        });
        await movie.save();

        rental =new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345632'
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            },
        });
        await rental.save();
    })
    
    afterEach(async () => { 
        
            await server.close(() => {
                console.log("server closed successfully");
            }); 
            await Rental.remove({});
            await Movie.remove({});
        });
    
    it('should return 401 if client is not logged in.', async () => {
        token = '';

        const res = await exec();
        expect (res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided.', async () => {
        customerId = '';

        const res = await exec();
    
        expect (res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided.', async () => {
        movieId = '';

        const res = await exec();
       
        expect (res.status).toBe(400);
    });

    it('should return 404 if no rental found with customer/movie', async () => {
        await Rental.remove({});

        const res = await exec();
               
        expect (res.status).toBe(404);
    });

    it('should return 400 if rental already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save();
        
        const res = await exec();
       
        expect (res.status).toBe(400);
    });

    it('should return 200 if a valid request', async () => {
                
        const res = await exec();
       
        expect (res.status).toBe(200);
    });

    it('should set the returnDate if input is valid', async () => {
                
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);
        const diff = new Date() - rentalInDb.dateReturned;
       
        expect (diff).toBeLessThan(10 * 1000);
    });

    it('should set the rentalFee if input is valid', async () => {
        
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();

        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);
        
        expect (rentalInDb.rentalFee).toBe(14);
    });

    it('should set the stock with returned movie', async () => {
                
       const res = await exec();

        const movieInDb = await Movie.findById(movieId);
        expect (movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental if input is valid', async () => {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);
        
        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining(
                ['dateOut','dateReturned', 'rentalFee', 'customer', 'movie']
        ));
    });
});