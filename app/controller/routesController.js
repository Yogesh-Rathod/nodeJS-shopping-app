const express = require('express'),
		  app = express(),
	  	bodyParser = require('body-parser'),
	  	multer = require('multer'),
	  	flash = require('connect-flash'),
	  	expresssession = require('express-session'),
  		expressValidator = require('express-validator'),
  		path = require('path');

// Stripe
const keyPublishable = 'pk_test_XWSXOxT1ZmAehAOMGQWyZ6ue';
const keySecret = 'sk_test_D4SmGbT8qVUKgdT12nRHJ7gV';
const stripe = require("stripe")(keySecret);

// grab the Products model
var Products = require('../models/products');

module.exports = (app) => {

	app.use( bodyParser.json() );
	app.use( bodyParser.urlencoded({ extended: true }) );
	// Configure Express Validator
	app.use(expressValidator({
	  errorFormatter: function(param, msg, value) {
	      var namespace = param.split('.')
	      , root    = namespace.shift()
	      , formParam = root;

	    while(namespace.length) {
	      formParam += '[' + namespace.shift() + ']';
	    }
	    return {
	      param : formParam,
	      msg   : msg,
	      value : value
	    };
	  }
	}));

	// Configure Multer File Upload
	var upload = multer({ dest: './public/images/products' });

	// Configure Express Session
	app.use(expresssession({
		secret: 'secret',
		saveUninitialized: true,
		resave: true
	}));

	// Configure Flash Messages
	app.use(flash());
	app.use(require('connect-flash')());
	app.use(function (req, res, next) {
	  res.locals.messages = require('express-messages')(req, res);
	  next();
	});

	// Default / Home page
	app.get('/', homePage );

	// Admin Area
	app.get('/admin', adminPage);

	// Admin Login
	app.get('/admin-login', adminLoginPage);

	// Admin Edit
	app.get('/edit/:id', productEdit);

	// Admin Edit
	app.get('/delete/:id', productDelete);

	// Products Detail Page
	app.get('/details/:id', productDetail);

	// Products Cart Page
	app.get('/cart', productCart);

	// Admin Login
	app.post('/adminLogin', adminLoginCheck);

	// Save Product to DataBase
	app.post('/productSave', upload.single('productImage'), saveProduct);

	// Products Cart Page
	app.post('/cart/:id', addProductToCart);

	// Save Edited Product
	app.post('/saveEditedProduct/:id', upload.single('productImage'), saveEditedProduct);

	// Stripe Payment Gateway
	app.post("/charge", stripePaymentGateway);
};

// Default / Home page
let homePage = (req, res) => {
	Products.find({}, (err, products) => {
		if (err) { console.log(err); }
		res.render('pages/index',
			{
				Pagetitle: 'Home',
				products: products
			}
		);
	})
};

// Admin Area
let adminPage = (req, res) => {

	if (req.session.validUser) {
		// Get List Of Products
		Products.find({}, (err, products) => {
		  if (err) { console.log(err); }
			res.render('pages/admin',
				{
					Pagetitle: 'Admin',
					products: products,
					validationErrors: null
				}
			);
		});
	} else {
		res.redirect('/admin-login');
	}
}

// Admin Login
let adminLoginPage = (req, res) => {
	res.render('pages/admin-login', { Pagetitle: 'Admin Login' });
}

// Admin Edit Pagetitle
let productEdit = (req, res) => {
	if (req.session.validUser) {
		let productId = req.params.id;
		Products.findOne({ _id: productId} , (err, product) => {
			res.render('pages/edit',
				{
					Pagetitle: 'Product Edit',
					product: product
				});
		});
	} else {
		res.redirect('/admin-login');
	}
}

// Product Detail Page
let productDetail = (req, res) => {
	let productId = req.params.id;
	Products.findOne({_id: productId}, (err, product) => {
		if (err) { console.log(err); }
		res.render('pages/details',{
			Pagetitle: 'Product Detail',
			product: product
		});
	});
}

// Delete a Product
let productDelete = (req, res) => {
	let pId = req.params.id;
	Products.findByIdAndRemove(pId, (err, callback) => {
		if (err) { console.log(err); }
		req.flash('success', 'Product Successfully Deleted.');
	  res.redirect('/admin');
	});
}

// Product Cart Page
let productCart = (req, res) => {
	// Get Cart from Session
	let cart = req.session.cart;
	let displayCart = { items: [], total: 0 };
	let total = 0;

	for(let item in cart) {
		displayCart.items.push(cart[item]);
		total += (cart[item].qty * cart[item].price );
	}

	displayCart.total = total;
	res.render('pages/cart', {
		Pagetitle: 'Product Cart' ,
		cart: displayCart,
		keyPublishable: keyPublishable
	});
}

// Create New Product
let saveProduct = (req, res) => {

	let title = req.body.title,
	  	description = req.body.description,
	  	addinformation = req.body.information,
	  	price = req.body.price,
	  	created_at = new Date();

	if ( req.file ) {
		var productImage = req.file.filename;
		// validating Image MIME Type
		var filetypes = /jpeg|jpg|png/;
		var mimetype = filetypes.test(req.file.mimetype);
		var extname = filetypes.test(path.extname(req.file.originalname).toLowerCase());
		if (mimetype && extname) {
    } else {
    	req.flash('error', 'Product Image Should be Image Only.');
    	var imageValidationError = true;
    }
	} else {
		var productImage = 'productImageDefault.png';
	}

	// Checking validation Errors
	req.assert('title', 'Product Title is Required').notEmpty();
	req.assert('description', 'Product Description is Required').notEmpty();
	req.assert('price', 'Product Price is Required').notEmpty()
	req.assert('price', 'Product Price Should Be Numeric').isNumeric();

	var validationErrors = req.validationErrors();

	if (validationErrors || imageValidationError) {
		Products.find({}, (err, products) => {
			if (err) { console.log(err); }
			req.flash('error', 'Validation Errors Found.');
		  res.render('pages/admin',
		  	{
		  		Pagetitle: 'Admin',
		  		validationErrors: validationErrors,
		  		products: products
		  	}
		  );
		});
	} else {
		// create a new Product
		let newProduct = Products({
		  title: title,
		  description: description,
		  addinformation: addinformation,
		  image: productImage,
		  price: price,
		  created_at: new Date()
		});

		// save the Product
		newProduct.save( (err) => {
		  if (err) { console.log(err); }
		  req.flash('success', 'New Product Successfully Added.');
		  res.redirect('/admin');
		});
	}
}

// Add Product To Cart
let addProductToCart = (req, res) => {
	req.session.cart = req.session.cart || {};

	let cart = req.session.cart,
			productId = req.params.id;

	Products.findOne({ _id: productId }, (err, product) => {
		if(err) { console,log(err); }
		if(cart[productId]) {
			cart[productId].qty++;
		} else {
				cart[productId] = {
					title: product.title,
					price: product.price,
					qty: 1
				}
		}
		req.flash('success', 'Product Successfully Added To Your Cart.');
		res.redirect('/cart');
	});
}

// Admin Login Check
let adminLoginCheck = (req, res) => {

	let username = req.body.username,
			password = req.body.password;

	if(username == 'admin' && password == 'admin') {
		req.session.validUser = true;
		res.redirect('/admin');
	} else {
		req.flash('error', 'Wrong Username or Password');
		req.session.validUser = false;
		res.redirect('/admin-login');
	}
}

// Save Edited Product
let saveEditedProduct = (req, res) => {

	let productImage = req.body.existingImage;

	if (req.file) {
		productImage = req.file.filename;
	}

	let productId = req.params.id,
			productTitle = req.body.title,
			productDescription = req.body.description,
			productPrice = req.body.price,
			productAddinformation = req.body.information;

	Products.findByIdAndUpdate(productId,
		{
			$set: {
				title: productTitle,
				description: productDescription,
				addinformation: productAddinformation,
				image: productImage,
				price: productPrice,
				created_at: new Date()
			}
		}, (err, done) => {
			if (err) { console.log(err); }
		  req.flash('success', 'Product Information Successfully Updated.');
		  res.redirect('/admin');
		});
}

// Stripe Payment Gateway
let stripePaymentGateway = (req, res) => {
  let amount = req.body.totalPaymentAmount;
  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken
  })
  .then(customer =>
    stripe.charges.create({
      amount,
      description: "Sample Charge",
         currency: "inr",
         customer: customer.id
    }))
  .then(charge => {
  		req.session.cart = {};
  		res.render("pages/charge", { Pagetitle: 'Sucessful payment' } );
  	});
}