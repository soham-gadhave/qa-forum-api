const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    text: String,
    author: String,
},
{
    timestamps: true
});

module.exports = mongoose.model("Answer", schema);