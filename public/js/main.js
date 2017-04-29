// Modular JS
// JS in Modular Pattern
var NODEAPP = (function () {

	// Init an Empty Object
  var obj = {};

  obj.init = function () {
  	this.cacheDom();
  	this.bindEvents();

  	// All Window Load Should be Here
		$(window).on('load', function() {
      // new WOW().init();
		});

    // $('.products-container').masonry({
    //   // options
    //   itemSelector: '.col-xs-4',
    //   columnWidth: '.col-xs-4',
    //   // percentPosition: true,
    //   fitWidth: true
    // });

		// All Window Scroll Should be Here
		// $(window).on('scroll', function(event) {
		// 	console.log("scroll");

		// });
  };

  obj.cacheDom = function () {

  }

  obj.bindEvents = function () {

  }

	// Detects If A Element Present on ViewPort
	$.fn.isOnScreen = function() {
    var win = $(window);
    var viewport = {
        top : win.scrollTop() - 250,
        left : win.scrollLeft()- 250
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
	};

	obj.init();

	return obj;

}());
