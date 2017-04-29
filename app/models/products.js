var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let ProductsSchema = new Schema({
	title: String,
	description: String,
	addinformation: String,
	image: String,
	price: String,
	created_at: Date
});

var Products = module.exports = mongoose.model('Products', ProductsSchema);