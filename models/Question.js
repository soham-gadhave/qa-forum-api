const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    author: {
        name: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    details: String,
    answers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer"
        }
    ],
},
{
    timestamps: true
});

module.exports = mongoose.model("Question", schema);