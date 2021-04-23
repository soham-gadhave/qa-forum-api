const   express         = require('express'),
        mongoose        = require('mongoose'),
        app             = express(),
        settings        = require("./settings"),
        Question        = require("./models/Question"),
        Answer          = require("./models/Answer"),
        Order           = require("./models/Order"),
        User            = require("./models/User"),
        PORT            = process.env.PORT || settings.PORT,
        auth            = require("./auth"),
        authenticate    = require('./middlewares/authenticate'),
        authorize       = require('./middlewares/authorize'),
        Razorpay        = require('razorpay'),
        crypto           = require('crypto'),
        generateErrorInformation = require('./utils')

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

// Route for users

app.get("/api/user/:userid/questions", authenticate, async (request, response) => {
    const userid = request.params.userid;

    try {
        const questions = await Question.find({ "author.id": userid })
        return response.json(questions)
    }
    catch(error) {
        response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error))
    }

})

app.get("/api/user/:userid/answers", authenticate, async (request, response) => {
    const userid = request.params.userid;

    try {
        const answers = await Answer.find({ "author.id": userid })
        return response.json(answers)
    }
    catch(error) {
        response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error))
    }
    
})

app.put("/api/user/:userid", authenticate, async (request, response) => {
    
    const userUpdate = request.body
    const userid = request.params.userid;
    User.findByIdAndUpdate(userid, userUpdate, options)
    .then(user => {
        if(user)
            response.json(user)
        else 
            response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error))
    })
    .catch(error => {
        response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error))
    })
})

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

//Routes for payment

app.post("/api/order", authenticate, async (request, response) => {
    
    const { plan, duration, currency, payer } = request.body
    
    razorpay = new Razorpay({
        key_id: settings.RAZORPAY_KEY_ID,
        key_secret: settings.RAZORPAY_KEY_SECRET
    });

    const amount = settings.PLANS[plan].price[duration]
    const receipt = "order_rcpt#" + (new Date()).toISOString();

    const options =  {
        amount: amount,
        currency: currency,
        receipt: receipt
    }

    razorpay.orders.create(options)
    .then(order => {
        Order.create({
            _id: order.id, 
            payer: payer, 
            amount: settings.PLANS[plan].price[duration],
            currency: currency,
            receipt: receipt
        })
        .then(order => response.json(order))
        .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", error)))
    })
    .catch(error => response.status(502).send(generateErrorInformation("Encountered some problem while creating order", error))) 

})

app.post("/api/order/:orderid/pay", authenticate, authorize, async (request, response) => {
    
    const order_id = request.params.orderid
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body;
    const signature = crypto.createHmac(
        "SHA256",
        settings.RAZORPAY_KEY_SECRET
    )
    .update(order_id + "|" + razorpay_payment_id)
    .digest("hex");  

    if(signature.toString() === razorpay_signature.toString())
        Order.findByIdAndUpdate(order_id, { payment_id: razorpay_payment_id }, options)
        .then(order => response.json(order))
        .catch(error => response.status(500).send(generateErrorInformation("Encountered some problem with the Database, please try again", errro)))
    else
        response.status(402).send(generateErrorInformation("Payment not verified"));
})

//Handling all unmatched routes 
// app.all("*", (request, response) => {
//     response.status(404).send(generateErrorInformation("The path with the given method does not exist"))
// })

app.listen(PORT, () => console.log(`Server is up and running on PORT ${PORT}`));