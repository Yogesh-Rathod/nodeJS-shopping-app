let credentials = require('./credentials');

module.exports = {
	dbConnection: () => {
		// return "mongodb://"+ credentials.username +":"+ credentials.password +"@ds131340.mlab.com:31340/firstappdb";
		return "mongodb://localhost/shopping-app";
	}
}