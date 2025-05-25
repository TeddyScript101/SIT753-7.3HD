const { SecretAngelGame, User } = require('../models');
const bcrypt = require('bcrypt');
const secretAngelInviteEmail = require('../emailTemplate/secretAngelInviteEmail');
const sendEmail = require('../helpers/sendEmail');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs')

const secretAngelService = {

    createGame: async (gameData) => {
        try {
            const colors = [
                '#FF9F68',
                '#72BDA3',
                '#A16AE8',
                '#FF6B6B',
                '#FFD700',
                '#4CAF50',
                '#2196F3',
                '#FF5722',
                '#8E44AD',
                '#F39C12',
                '#2ECC71',
                '#E74C3C',
                '#1ABC9C',
                '#3498DB',
                '#F1C40F',
                '#9B59B6',
                '#34495E',
                '#ECF0F1',
                '#D35400',
                '#BDC3C7',
                '#34495E'
            ];
            const maxRoom = await SecretAngelGame.findOne().sort({ roomId: -1 });
            const newRoomId = maxRoom ? maxRoom.roomId + 1 : 1;
            const hashedPassword = await bcrypt.hash(gameData.password, 10);

            const game = new SecretAngelGame({
                ...gameData,
                password: hashedPassword,
                members: [{
                    user: gameData.host,
                    isHost: true,
                    isReady: false
                }],
                roomId: newRoomId,
                color: colors[Math.floor(Math.random() * colors.length)],
            });


            await game.save();

            return game;

        } catch (error) {
            throw new Error(error.message);
        }
    },

    joinGame: async (roomId, userId, password, bypass = false) => {
        try {
            const game = await SecretAngelGame.findOne({ roomId });
            if (!game) return { success: false, message: 'Game not found' };

            if (game.password && !bypass) {
                const isMatch = await bcrypt.compare(password, game.password);
                if (!isMatch) throw new Error('Invalid password');
            }

            if (!game.members.map(el => el.user.toString()).includes(userId.toString())) {
                game.members.push({ user: userId, isHost: false, isReady: false });
                await game.save();
            }

            return { success: true, message: 'Joined successfully', game };
        } catch (err) {
            console.error(err);
            throw new Error(err.message);
        }
    },
    startGame: async (gameId) => {
        try {
            const game = await SecretAngelGame.findById(gameId)
            if (!game) throw new Error('Game not found');
            if (game.members.length < 2) throw new Error('Not enough players to start the game');
            if (game.members.some(member => member.isReady === false && !member.isHost)) throw new Error('All players must be ready to start the game');

            const shuffledMembers = shuffleArray([...game.members]);

            const assignments = shuffledMembers.map((member, index) => ({
                user: member.user,
                secretAngel: shuffledMembers[(index + 1) % shuffledMembers.length].user,
            }));

            game.assignment = assignments;
            game.gameStatus = 'started';

            await game.save();
            return game;

        } catch (error) {
            throw new Error(error.message);
        }
    },

    toggleReadyToStart: async (gameId, userId) => {
        try {
            const game = await SecretAngelGame.findById(gameId);
            if (!game) throw new Error('Game not found');
            const memberIndex = game.members.findIndex(member => member.user.toString() === userId.toString());
            if (memberIndex === -1) throw new Error('User not found in game');
            game.members[memberIndex].isReady = !game.members[memberIndex].isReady;
            await game.save();
            await game.populate('members.user');
            return game;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    getAllGames: async () => {
        try {
            return await SecretAngelGame.find({ isDeleted: false, gameStatus: { $ne: 'completed' } })
                .populate('host', 'name _id')
                .populate('members', 'name _id');
        } catch (error) {
            throw new Error(error.message);
        }
    },


    getSingleGame: async (params) => {
        try {
            return await SecretAngelGame.findOne(params)
                .populate({ path: 'host', select: '_id name' })
                .populate({ path: 'members.user', select: '_id name' })
                .populate({ path: 'assignment.user', select: '_id name' })
                .populate({ path: 'assignment.secretAngel', select: '_id name' })
                .populate({ path: 'chat.sender', select: '_id name' });


        } catch (error) {
            throw new Error(error.message);
        }
    },
    invitePlayer: async (roomId, emailList) => {

        try {
            const game = await SecretAngelGame.findOne({ roomId });
            if (!game) throw new Error('Game not found');
            const inviteLink = `http://localhost:3000/secretAngel/room/${roomId}/${game._id}`;
            for (const email of emailList) {
                await sendEmail({ to: email, subject: "Invitaiton email for a secret Angel Game", html: secretAngelInviteEmail(inviteLink) });
            }

        } catch (error) {
            throw new Error(error.message);
        }

    },


    updateGame: async (gameId, updatedData) => {
        try {
            const game = await SecretAngelGame.findByIdAndUpdate(gameId, updatedData, { new: true });
            if (!game) throw new Error('Game not found');
            return game;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    checkKey: async ({ roomId, key }) => {
        try {
            const game = await SecretAngelGame.findOne({ roomId });
            if (!game) return false;
            const isMatch = game._id.toString() === key
            if (!isMatch) return false;
            return true;
        } catch (error) {
            throw new Error(error.message);
        }
    },

    revealResult: async (roomId) => {
        try {
            const game = await SecretAngelGame.findOne({ roomId })
                .populate({ path: 'assignment.user', select: '_id name' })
                .populate({ path: 'assignment.secretAngel', select: '_id name' });

            if (!game) throw new Error('Game not found');
            const userIdList = game.members.map(member => member.user.toString());
            const emailList = await User.find({ _id: { $in: userIdList } }, { email: 1 });

            const templatePath = path.join(__dirname, '../emailTemplate/secretAngelResultEmail.ejs');
            const templateStr = fs.readFileSync(templatePath, 'utf8');
            const html = ejs.render(templateStr, {
                assignments: game.assignment
            });

            for (const { email } of emailList) {
                await sendEmail({ to: email, subject: "Secret Angel Game Result", html });
            }

            game.gameStatus = 'completed';
            await game.save();
            return
        }
        catch (error) {
            throw new Error(error.message);
        }
    },
    deleteGame: async (id) => {
        try {

            const game = await SecretAngelGame.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
            if (!game) throw new Error('Game not found');
            return game;
        } catch (error) {
            throw new Error(error.message);
        }
    }
};

module.exports = secretAngelService;

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

