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
},
{
    timestamps: true
});

module.exports = mongoose.model("Answer", schema);