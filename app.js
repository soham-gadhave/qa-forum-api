const   express         = require('express'),
        mongoose        = require('mongoose'),
        cors            = require('cors'),
        app             = express(),
        settings        = require("./settings")
        Question        = require("./models/Question"),
        Answer          = require("./models/Answer")
        PORT            = process.env.PORT || settings.PORT;
        auth            = require("./auth")
        authenticate    = require('./middlewares/authenticate')
        authorize       = require('./middlewares/authorize')

// app.use(cors())
app.use(function(request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
app.use(express.json())

//Connecting to MongoDB Atlas
mongoose.connect(settings.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log("connection successful"))
.catch(error => console.log(error))

//Routes for Authentication

app.post("/api/auth/signup", auth.signup)

app.post("/api/auth/signin", auth.signin)

//MongoDB Query options
const options = {
    new: true
}

//Route for feed

app.get("/api/feed", async (request, response) => {
    
    //Get feed(questions for now) from the DB and populate the "answers" with actual answer documents 
    Question.find({}).populate("answers")
    .then(questions => {
        response.json(questions)
    })
    .catch(error => {
        console.log(error); 
        response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error})
    })

})

//Routes for Question

app.get("/api/question/:id", async (request, response) => {
    Question.findById(request.params.id).populate("answers")
    .then(question => response.json(question))
    .catch(error => response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error}))
})

app.post("/api/question", authenticate, async (request, response) => {
    //get the anser from the request's body
    const question = request.body;

    //If the request's body is empty or doesn't contains text or author attribute, do no insert
    const attributes = Object.keys(question)

    if(attributes && attributes.includes("text") && attributes.includes("author")) {
        //Add question in the database
        Question.create(question)
        .then(question => {
            response.json(question)
        })
        .catch(error => {
            console.log(error)
            response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error})
        })
    }
    else
        response.status(422).send({"message": "Send proper data", "error": "Missing Attributes or the Object is empty"})

});

app.put("/api/question/:id", authenticate, authorize, async (request, response) => {
    const id = request.params.id;
    const questionUpdate = request.body
    Question.findByIdAndUpdate(id, questionUpdate, options).populate("answers")
    .then(question => response.json(question))
    .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))
})

app.delete("/api/question/:id", authenticate, authorize, async (request, response) => {
    const id = request.params.id;
    Question.findByIdAndDelete(id)
    .then(async question => {
        //Put this in try catch or use .then() .catch()
        await Answer.deleteMany({ "_id": { $in: question.answers } })
        response.json(question)
    })
    .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))
})

//Routes for Answers

app.post("/api/question/:id/answer", authenticate, async (request, response) => {
    
    //First insert answer into "Answer" collection
    Answer.create(request.body)
    .then(answer => {
        //If successfully inserted answer, then insert the answer's "_id" into the question for which it is answered
        Question.findById(request.params.id)
        .then(question => {
            //Push the answer's id into the "answers" array of the question
            const answers = question.answers
            answers.push(answer._id)
            //Update the question
            Question.findByIdAndUpdate(request.params.id, { answers: answers }, {new: true})
            .then(question => response.json(question))
            .catch(error => {
                //Error handling 
                console.log(error); 
                response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error})
            })
        })
        .catch(error => {
            //Error handling 
            console.log(error); 
            response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error})
        })
    })
    .catch(error => {
        //Error handling
        console.log(error); 
        response.status(500).send({"message": "Encountered some problem with the Database, please try again", "error": error})
    })
})

app.put("/api/question/:id/answer/:answerid", authenticate, authorize, async (request, response) => {
    
    //Take care of Empty or null answerid
    const answerUpdate = request.body;
    Answer.findByIdAndUpdate(request.params.answerid, answerUpdate, options)
    .then(answer => response.json(answer))
    .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))
})

app.delete("/api/question/:id/answer/:answerid", authenticate, authorize, async (request, response) => {
    const answerid = request.params.answerid;
    Answer.findByIdAndDelete(answerid)
    .then(answer => {
        Question.findOneAndUpdate({ answers: answer._id }, { $pull: { answers: answerid } })
        .then(question => console.log(question))
        .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))
        response.json(answer)
    })
    .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))

    

})

app.listen(PORT, () => console.log(`Server is up and running on PORT ${PORT}`));