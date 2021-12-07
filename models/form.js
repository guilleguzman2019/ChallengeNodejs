//Requiring mongoose package
var mongoose=require("mongoose");

// Schema
var formSchema=new mongoose.Schema({
	name : String,
	surname : String,
	key : String,
	email : String
});

const Form = mongoose.model("Form",formSchema);

module.exports = Form;
