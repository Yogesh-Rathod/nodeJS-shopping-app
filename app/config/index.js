let credentials = require('./credentials');

let databaseString = "mongodb://localhost/shopping-app";

if (process.env.NODE_ENV) {
	databaseString = "mongodb://"+ credentials.username +":"+ credentials.password +"@ds125481.mlab.com:25481/shopping-app";
}

module.exports = {
	dbConnection: () => {
		return databaseString;
	}
}