define(function(require, exports, module) {
	var View = require('famous/core/View');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var Easing = require('famous/transitions/Easing');
	var Transform = require('famous/core/Transform');

	function PageSwiper() {
		View.apply(this, arguments);

		this.rootModifier = new StateModifier({
			size: [this.options.width, this.options.height],
		})
		_createControls.call(this);
	}

	PageSwiper.prototype = Object.create(View.prototype);
	PageSwiper.prototype.constructor = PageSwiper;
	PageSwiper.prototype.init = function (index, viewModel) {
		this.options.index = index;
		this.options.viewModel = viewModel;
		_resetPages.call(this);
	};

	PageSwiper.DEFAULT_OPTIONS = {
		width: 320, // Defaults to iPhone5 width
		height: 480, // Defaults to iPhone5 height
		index: 0, // Show the first card by default
		viewModel: [], // Empty page set
		viewFactory: function() {}, // Default to noop
	};

	var _renderer;

	function _createControls() {
		_renderer = new RenderController({
			// This determines the style of swipe animation
			inTransition: { curve: Easing.inOutQuart, duration: 100 },
			outTransition: { curve: Easing.inOutQuart, duration: 100 },
			overlap: true,
		});
		_renderer.inTranformFrom(function(progress) {
			return Transform.translate(0,0,1); // Move to a positive z
		});
		_renderer.outTransformFrom(function(progress) {
			return Transform.translate(0,0,-1); // Move to a negative z
		});
		// Reset opacity changes
		_renderer.inOpacityFrom(function(progress) { return 1; });
		_renderer.outOpacityFrom(function(progress) { return 1; });
		// Attach the renderer we just defined to the view
		this.mainNode.add(_renderer);
	}

	function _loadCards(viewModel) {
		var length = viewModel.length;
		if (length == 0) {
			return; // Don't process empty page list
		}
		var pages = [];
		pages.push({
			renderer: new makeSnapRenderController(0, 0, 0, 0),
			modifier: new Modifier(),
			offset: -this.options.width,
		});
		pages.push({
			renderer: new makeSnapRenderController(0, 0, 0, 0),
			modifier: new Modifier(),
			offset: 0,
		});
		pages.push({
			renderer: new makeSnapRenderController(0, 0, 0, 0),
			modifier: new Modifier(),
			offset: this.options.width,
		});
		for(var i = 0; i < 3; i++) {
			pages[i].modifier.setTransform(
				Transform.translate(pages[i].offset, 0, 0), {
				duration: 0,
				curve: Easing.outElastic,
			});
		}
		var draggable = new Draggable({
			xRange: [-this.options.width, this.options.width],
			yRange: [0, 0],
		});
		var renderLeft = false;
		var renderRight = false;
		if (index < 0) { index = 0; } // Lower boundary check
		if (index >= length) { index = length - 1; } // Upper boundary check
		if (index > 0) { // Render left card check
			//console.log('Render left: [' + index + ' > 0]');
			pages[0].card = _createCard(undefined, index-1, length, data[index-1], height);
			pages[0].renderer.show(pages[0].card);
		}
		//console.log('Render card: [' + (index + 1) + ' of ' + length + ']');
		pages[1].card = _createCard(undefined, index, length, data[index], height);
		pages[1].renderer.show(pages[1].card);
		pages[1].card.bindTo(draggable); // Sets up initial event piping

		if (index < length - 1) { // Render right card check
			//console.log('Render right: [' + (index + 2) + ' < ' + length + ' - 1]');
			pages[2].card = _createCard(undefined, index + 1, length, data[index + 1], height);
			pages[2].renderer.show(pages[2].card);
		}
		return pages;
	}
	/*
	function _resetPages() {

	}
	function _temp() {
		// The bound source of cards to render
		var cards = [];

		// Make a container to wrap the Scrollview and enforce size
		var container = new ContainerSurface({
			size: [this.options.width, this.options.height],
			properties: {
				overflow: 'hidden',
			},
		});
		// Container for the set of cards created from viewModel
		var scrollview = new Scrollview({
			height: this.options.height,
		});
		// Bind the scrollview to the card collection
		scrollview.sequenceFrom(cards);


	}
	*/

	module.exports = PageSwiper;
});