const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../server');
const { User } = require('../models');

let token;
let userId;

before(async function () {
    const uri = process.env.MONGO_URI;

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(uri);

    console.log('Connected to MongoDB');
});

after(async function () {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
});

afterEach(async function () {
    if (mongoose.connection.readyState === 1) {
        await User.deleteMany({});
    }
});


describe('Auth Middleware Unit Test', () => {
    it('should respond 403 if no token provided', async () => {
        const res = await request(app)
            .put('/api/users/settings')
            .send({ name: 'Test' });

        expect(res.status).to.equal(403);
        expect(res.body).to.have.property('message', 'Invalid or expired token');
    });
});

describe('Auth Integration Tests', function () {
    describe('GET /api/users/', function () {
        beforeEach(async function () {
            await User.create([
                { name: 'Alice', email: 'alice@example.com', password: 'pass1' },
                { name: 'Bob', email: 'bob@example.com', password: 'pass2' }
            ]);
        });

        it('should return all users', async function () {
            const res = await request(app).get('/api/users/');

            expect(res.status).to.equal(200);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(2);
            expect(res.body.data[0]).to.have.property('email');
        });
    });

    describe('GET /api/users/logout', function () {
        it('should clear the token cookie and redirect', async function () {
            const res = await request(app)
                .get('/api/users/logout')
                .set('Cookie', [`token=some-valid-token`])
                .redirects(0);

            expect(res.status).to.equal(302);
            const setCookieHeader = res.header['set-cookie'][0];
            expect(setCookieHeader).to.include('token=');
            expect(setCookieHeader).to.include('Expires=');
        });
    });

    describe('POST /api/users/signup', function () {
        it('should register a new user', async function () {
            const res = await request(app).post('/api/users/signup').send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'User created successfully');
            expect(res.body.user).to.have.property('email', 'john@example.com');

            const user = await User.findOne({ email: 'john@example.com' });
            expect(user).to.exist;
        });

        it('should not allow duplicate registration', async function () {
            await User.create({
                name: 'Jane',
                email: 'jane@example.com',
                password: 'hashedpassword',
            });

            const res = await request(app).post('/api/users/signup').send({
                name: 'Jane',
                email: 'jane@example.com',
                password: 'newpassword',
            });

            expect(res.status).to.equal(500);
            expect(res.body).to.have.property('message', 'Server error');
            expect(res.body.error).to.include('User already exists');
        });

        it('should fail if required fields are missing', async function () {
            const res = await request(app).post('/api/users/signup').send({
                email: 'missing@fields.com',
            });

            expect(res.status).to.equal(500);
            expect(res.body.error).to.include('All fields are required');
        });

        it('should fail if email is invalid format (optional)', async function () {
            const res = await request(app).post('/api/users/signup').send({
                name: 'Invalid Email',
                email: 'invalid-email',
                password: 'password123',
            });

            expect(res.status).to.not.equal(201);
        });
    });

    describe('POST /api/users/login', function () {
        beforeEach(async function () {
            const hashed = await bcrypt.hash('password123', 10);
            await User.create({ name: 'Test User', email: 'test@login.com', password: hashed });
        });

        it('should login a user with valid credentials', async function () {
            const res = await request(app).post('/api/users/login').send({
                email: 'test@login.com',
                password: 'password123',
            });

            expect(res.status).to.equal(200);
        });
    });

    describe('PUT /api/users/settings', function () {
        beforeEach(async function () {
            const password = 'password123';
            const hashed = await bcrypt.hash(password, 10);

            const user = await User.create({
                name: 'Settings User',
                email: 'settings@example.com',
                password: hashed,
                avatar: 'oldavatar.png',
            });

            userId = user._id.toString();

            token = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1h' }
            );
        });

        it('should update user name and avatar', async function () {
            const res = await request(app)
                .put('/api/users/settings')
                .set('Cookie', [`token=${token}`])
                .field('name', 'New Name')
                .redirects(0);

            expect(res.status).to.equal(200);
            const updatedUser = await User.findById(userId);
            expect(updatedUser.name).to.equal('New Name');
        });

        it('should update password correctly', async function () {
            const newPassword = 'newStrongPass123';

            const res = await request(app)
                .put('/api/users/settings')
                .set('Cookie', [`token=${token}`])
                .field('password', newPassword)
                .field('confirmPassword', newPassword);

            expect(res.status).to.equal(200);

            const updatedUser = await User.findById(userId);
            const match = await bcrypt.compare(newPassword, updatedUser.password);
            expect(match).to.be.true;
        });
    });

    describe('DELETE /api/users', function () {
        let delUserId;
        let delToken;

        beforeEach(async function () {
            const password = await bcrypt.hash('delpass123', 10);

            const user = await User.create({
                name: 'Deletable User',
                email: 'del@user.com',
                password,
            });

            delUserId = user._id;

            delToken = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1h' }
            );
        });

        it('should soft delete the user', async function () {
            const res = await request(app)
                .delete('/api/users')
                .set('Cookie', [`token=${delToken}`]);

            expect(res.status).to.equal(200);
            expect(res.body.message).to.equal('User soft deleted successfully');

            const softDeletedUser = await User.findById(delUserId);
            expect(softDeletedUser).to.exist;
            expect(softDeletedUser.deleted).to.be.true;
        });

        it('should not delete without token', async function () {
            const res = await request(app).delete('/api/users');
            expect(res.status).to.equal(403);
            expect(res.body.message).to.equal('Invalid or expired token');
        });
    });
});

