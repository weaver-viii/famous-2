/*** Main Application Entry ***/

define(function(require) {
    var Engine  = require('famous/core/Engine');
    var Surface = require('famous/core/Surface');

    var PageSwiper = require('views/PageSwiper');

	var _width = 320;
    // Figure out height so I know if I'm dealing with iphone 4 or 5
    var _height = window.innerHeight;
    if (_height > 568) {
        _height = 569;
    }
    if (_height < 480) {
        _height = 480;
    }

	var surfaces = [];
	for(var i = 0; i < 8; i++) {
	  	surfaces.push(new Surface({
		    content: "panel " + (i + 1),
		    size: [320, 480],
		    properties: {
		      backgroundColor: "hsl(" + (i * 360 / 8) + ", 100%, 50%)",
		      color: "#404040",
		      lineHeight: '200px',
		      textAlign: 'center'
		    }
	  	}));
	}

    var init = function() {
        var engine = Engine.createContext();
        
        var pageSwiper = new PageSwiper({
	        width: 320, // Defaults to iPhone5 width
			height: 480, // Defaults to iPhone5 height
			index: 0, // Show the first card by default
			viewModel: surfaces, // Empty page set
		});

        engine.add(pageSwiper);
    };

    // Call this at the end to ensure app functions have been initialized
    init();
});