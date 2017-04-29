let credentials = require('./credentials');

module.exports = {
	dbConnection: () => {
		return "mongodb://"+ credentials.username +":"+ credentials.password +"@ds125481.mlab.com:25481/shopping-app";
		// return "mongodb://localhost/shopping-app";
	}
}