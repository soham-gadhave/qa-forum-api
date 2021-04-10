const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    author: String,
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