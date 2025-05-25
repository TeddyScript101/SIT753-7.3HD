const { expect } = require('chai');
const sinon = require('sinon');
const ioClient = require('socket.io-client');
const { server } = require('../server');
const secretAngelService = require('../services/secretAngelService');
const { userSocketMap } = require('../sockets/secretAngelSocket');

const PORT = 3000;
const SOCKET_URL = `http://localhost:${PORT}`;

describe('Secret Angel Socket Event Tests', function () {
    this.timeout(5000);

    let clientSocket;
    let sandbox;

    before((done) => {
        server.listen(PORT, done);
    });

    after((done) => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
        server.close(done);
    });

    beforeEach((done) => {
        sandbox = sinon.createSandbox();

        clientSocket = ioClient(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
        });

        clientSocket.on('connect', () => done());
    });

    afterEach(() => {
        sandbox.restore();
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
        userSocketMap.clear();
    });

    it('should emit roomList on createGame', (done) => {
        const fakeRooms = [{ roomId: 1 }, { roomId: 2 }];
        sandbox.stub(secretAngelService, 'getAllGames').resolves(fakeRooms);

        clientSocket.emit('createGame');

        clientSocket.on('roomList', (rooms) => {
            expect(rooms).to.deep.equal(fakeRooms);
            done();
        });
    });

    it('should store socket ID on registerUser', (done) => {
        clientSocket.emit('registerUser', { userId: 'user123' });

        setTimeout(() => {
            expect(userSocketMap.get('user123')).to.equal(clientSocket.id);
            done();
        }, 50);
    });

    it('should join room, emit systemMessage and readyStatusChanged', (done) => {
        const fakeGame = {
            members: [{ user: { _id: 'u1', name: 'User1' } }],
        };
        sandbox.stub(secretAngelService, 'getSingleGame').resolves(fakeGame);

        const testRoom = 'room123';
        const userName = 'Tester';

        let systemMessageReceived = false;
        let readyStatusReceived = false;

        clientSocket.emit('joinRoom', { roomId: testRoom, userName });

        clientSocket.on('systemMessage', (msg) => {
            expect(msg).to.include(`${userName} joined`);
            systemMessageReceived = true;
            if (readyStatusReceived) done();
        });

        clientSocket.on('readyStatusChanged', (data) => {
            expect(data.members).to.deep.equal(fakeGame.members);
            readyStatusReceived = true;
            if (systemMessageReceived) done();
        });
    });

    it('should handle error in joinRoom and emit errorMessage', (done) => {
        sandbox.stub(secretAngelService, 'getSingleGame').rejects(new Error('DB failure'));

        clientSocket.emit('joinRoom', { roomId: 'badRoom', userName: 'Tester' });

        clientSocket.on('errorMessage', (msg) => {
            expect(msg).to.equal('DB failure');
            done();
        });
    });

    it('should broadcast newMessage event on sendMessage', (done) => {
        const messagePayload = {
            roomId: 'r1',
            userId: 'u1',
            userName: 'User One',
            message: 'Hello!',
        };

        clientSocket.emit('joinRoom', { roomId: messagePayload.roomId, userName: messagePayload.userName });

        setTimeout(() => {
            clientSocket.emit('sendMessage', messagePayload);
        }, 100);

        clientSocket.on('newMessage', (msg) => {
            expect(msg.message).to.equal(messagePayload.message);
            expect(msg.senderName).to.equal(messagePayload.userName);
            expect(msg.senderId).to.equal(messagePayload.userId);
            expect(new Date(msg.timestamp)).to.be.a('date');
            done();
        });
    });

    it('should update budget and emit budgetUpdated', (done) => {
        const fakeGame = { roomId: 'roomX', budget: 100 };
        sandbox.stub(secretAngelService, 'updateGame').resolves(fakeGame);

        clientSocket.emit('joinRoom', { roomId: fakeGame.roomId, userName: 'Tester' });

        setTimeout(() => {
            clientSocket.emit('updateBudget', { gameId: 'game1', budget: 100 });
        }, 100);

        clientSocket.on('budgetUpdated', (budget) => {
            expect(budget).to.equal(fakeGame.budget);
            done();
        });
    });

    it('should handle updateBudget error and emit errorMessage', (done) => {
        sandbox.stub(secretAngelService, 'updateGame').rejects(new Error('Update failed'));

        clientSocket.emit('updateBudget', { gameId: 'game1', budget: 100 });

        clientSocket.on('errorMessage', (msg) => {
            expect(msg).to.equal('Update failed');
            done();
        });
    });
    it('should delete game and emit gameDeleted', (done) => {
        const fakeGame = { roomId: 'roomY', _id: 'game123' };
        sandbox.stub(secretAngelService, 'deleteGame').resolves(fakeGame);

        clientSocket.emit('joinRoom', { roomId: fakeGame.roomId, userName: 'Tester' });

        setTimeout(() => {
            clientSocket.emit('deleteGame', { gameId: 'game123' });
        }, 100);

        clientSocket.on('gameDeleted', (gameId) => {
            expect(gameId).to.equal(fakeGame._id);
            done();
        });
    });


    it('should handle deleteGame error and emit errorMessage', (done) => {
        sandbox.stub(secretAngelService, 'deleteGame').rejects(new Error('Delete failed'));

        clientSocket.emit('deleteGame', { gameId: 'game123' });

        clientSocket.on('errorMessage', (msg) => {
            expect(msg).to.equal('Delete failed');
            done();
        });
    });

    it('should start game, emit gameStarted and yourAssignment', (done) => {
        const gameId = 'gameStart123';
        const roomId = 'roomStart';
        const fakeGame = {
            _id: gameId,
            roomId,
            gameStatus: 'started',
            assignment: [
                {
                    secretAngel: { _id: 'angel1' },
                    user: { name: 'target1' },
                },
            ],
        };

        sandbox.stub(secretAngelService, 'startGame').resolves(fakeGame);
        sandbox.stub(secretAngelService, 'getSingleGame').resolves(fakeGame);

        userSocketMap.set('angel1', clientSocket.id);

        let gotGameStarted = false;
        let gotAssignment = false;

        clientSocket.emit('joinRoom', { roomId, userName: 'Angel' });

        setTimeout(() => {
            clientSocket.emit('startGame', { gameId });
        }, 100);

        clientSocket.on('gameStarted', () => {
            gotGameStarted = true;
            if (gotAssignment) done();
        });

        clientSocket.on('yourAssignment', ({ targetName }) => {
            expect(targetName).to.equal('target1');
            gotAssignment = true;
            if (gotGameStarted) done();
        });
    });

    it('should toggle ready status and emit readyStatusChanged', (done) => {
        const roomId = 'roomReady';
        const userId = 'user1';

        const fakeGame = {
            roomId,
            members: [{ user: { _id: userId }, isReady: true }],
        };

        sandbox.stub(secretAngelService, 'toggleReadyToStart').resolves(fakeGame);

        clientSocket.emit('joinRoom', { roomId, userName: 'Tester' });

        setTimeout(() => {
            clientSocket.emit('toggleReady', { gameId: 'gameReady', userId });
        }, 100);

        clientSocket.on('readyStatusChanged', (data) => {
            expect(data.members).to.deep.equal(fakeGame.members);
            done();
        });
    });


    it('should reveal results and emit resultsRevealed', (done) => {
        const roomId = 'roomResults';

        sandbox.stub(secretAngelService, 'revealResult').resolves();

        clientSocket.emit('joinRoom', { roomId, userName: 'Tester' });

        setTimeout(() => {
            clientSocket.emit('revealResults', { roomId });
        }, 100);

        clientSocket.on('resultsRevealed', () => {
            done();
        });
    });

});
