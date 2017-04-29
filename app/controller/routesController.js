const express = require('express'),
		  app = express(),
	  	bodyParser = require('body-parser'),
	  	multer = require('multer'),
	  	flash = require('connect-flash'),
	  	expresssession = require('express-session');

// grab the Products model
var Products = require('../models/products');

module.exports = (app) => {

	app.use( bodyParser.json() );
	app.use( bodyParser.urlencoded({ extended: true }) );
	var upload = multer({ dest: './public/images/products' });


	// Express Session
	app.use(expresssession({
		secret: 'secret',
		saveUninitialized: true,
		resave: true
	}));

	// Flash Messages
	app.use(flash());
	app.use(require('connect-flash')());
	app.use(function (req, res, next) {
	  res.locals.messages = require('express-messages')(req, res);
	  next();
	});

	// Default / Home page
	app.get('/', homePage );

	// Products Page
	app.get('/', productsPage );

	// Admin Area
	app.get('/admin', adminPage);

	// Admin Edit
	app.get('/edit/:id', productEdit);

	// Admin Edit
	app.get('/delete/:id', productDelete);

	// Products Detail Page
	app.get('/details/:id', productDetail);

	// Products Cart Page
	app.get('/cart', productCart);

	// Save Product to DataBase
	app.post('/productSave', upload.single('productImage'), saveProduct);

	// Products Cart Page
	app.post('/cart/:id', addProductToCart);
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

// Products Page
let productsPage = (req, res) => {
	res.render('pages/products', { Pagetitle: 'Products',
			products: products });
}

// Product Details
let detailsPage = (req, res) => {

	res.render('pages/details',
		{
			Pagetitle: 'Product Details'
		}
	);
}

// Admin Area
let adminPage = (req, res) => {
	// Get List Of Products
	Products.find({}, (err, products) => {
	  if (err) { console.log(err); }
		res.render('pages/admin',
			{
				Pagetitle: 'Admin',
				products: products
			}
		);
	});
}

// Admin Edit Pagetitle
let productEdit = (req, res) => {
	res.render('pages/edit', { Pagetitle: 'Product Edit' });
}

// Get All productSave
let getAllProducts = (req, res) => {
	Products.find({}, (err, products) => {
	  if (err) { console.log(err); }
	  return products;
	});
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
		cart: displayCart
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
	} else {
		var productImage = 'productImageDefault.png';
	}

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