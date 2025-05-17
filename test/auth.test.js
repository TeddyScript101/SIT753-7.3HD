const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

const { app } = require('../server');
const { User } = require('../models');

describe('Auth Integration Tests', function () {
    before(async function () {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    after(async function () {
        await mongoose.disconnect();
    });

    afterEach(async function () {
        await User.deleteMany({});
    });

    describe('POST /api/users/signup', function () {
        it('should register a new user', async function () {
            const res = await request(app)
                .post('/api/users/signup')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'User created successfully');
            expect(res.body).to.have.property('user');
            expect(res.body.user).to.have.property('email', 'john@example.com');

            const userInDb = await User.findOne({ email: 'john@example.com' });
            expect(userInDb).to.exist;
        });

        it('should not allow duplicate registration', async function () {
            await User.create({
                name: 'Jane',
                email: 'jane@example.com',
                password: 'hashedpw',
            });

            const res = await request(app)
                .post('/api/users/signup')
                .send({
                    name: 'Jane',
                    email: 'jane@example.com',
                    password: 'newpassword',
                });

            expect(res.status).to.equal(500);
            expect(res.body).to.have.property('message', 'Server error');
            expect(res.body).to.have.property('error').that.includes('User already exists');
        });
    });
});
