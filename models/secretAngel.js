const mongoose = require('mongoose');

const secretAngelGameSchema = new mongoose.Schema(
    {
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            isReady: {
                type: Boolean,
                default: false,
            },
            isHost: {
                type: Boolean,
                default: false,
            }
        }],
        roomId: {
            type: Number,
            default: 1,
        },
        budget: {
            type: Number,
            required: false,
        },
        assignment: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                secretAngel: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                }
            }
        ],
        password: {
            type: String,
            required: false,
        },
        color: {
            type: String,
            required: true,
        },
        gameStatus: {
            type: String,
            enum: ['waiting', 'started', 'completed'],
            default: 'waiting',
        },
        chat: [{
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
            isSystem: { type: Boolean, default: false },
            message: String,
            createdAt: { type: Date, default: Date.now }
        }],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const SecretAngelGame = mongoose.model('SecretAngelGame', secretAngelGameSchema);
module.exports = SecretAngelGame;
