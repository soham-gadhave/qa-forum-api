function generateErrorInformation (message, error) {
    var errorInformation = {}
    if(error)
        return {
            "message": message,
            "error": error.toString()
        }
    else
        return{
            "message": message
        }
} 

module.exports = generateErrorInformation;