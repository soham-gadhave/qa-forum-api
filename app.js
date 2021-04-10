const   express  = require('express'),
        mongoose = require('mongoose'),
        app      = express(),
        settings = require("./settings")
        Question = require("./models/Question"),
        Answer   = require("./models/Answer")
        PORT     = settings.PORT;
        auth   = require("./auth")

app.use(express.json())

//Connecting to MongoDB Atlas
mongoose.connect(settings.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log("connection successful"))
.catch(error => console.log(error))

//Routes for Authentication

app.post("/api/auth/signup", auth.signup)

app.post("/api/auth/signin", auth.signin)

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

app.post("/api/question", async (request, response) => {
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

//Routes for Answers

app.post("/api/question/:id/answer", async (request, response) => {
    
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

app.listen(PORT, () => console.log(`Server is up and running on PORT ${PORT}`));