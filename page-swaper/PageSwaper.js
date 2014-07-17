define(function(require, exports, module) {
    var View = require('famous/core/View');
    var StyleGuide = require("Css/StyleGuide");
    var Modifier = require("famous/core/Modifier");
    var Transform = require('famous/core/Transform');
    var Easing = require('famous/transitions/Easing');
    var Draggable = require('famous/modifiers/Draggable');
    var StateModifier = require('famous/modifiers/StateModifier');
    var RenderController = require('famous/views/RenderController');
    var ContainerSurface = require("famous/surfaces/ContainerSurface");
    var OptionsManager = require('famous/core/OptionsManager');

    var GenericSync = require('famous/inputs/GenericSync');
    var MouseSync = require('famous/inputs/MouseSync');
    var ScrollSync = require('famous/inputs/ScrollSync');
    var TouchSync = require('famous/inputs/TouchSync');
    
    GenericSync.register({scroll : ScrollSync, mouse: MouseSync, touch : TouchSync});

    function PageSwaper(options, createCardCallback) {

        View.apply(this, arguments);

        this.options = Object.create(PageSwaper.DEFAULT_OPTIONS);
        this.optionsManager = new OptionsManager(this.options);
        if (options) this.optionsManager.patch(options);
        
        this.rootModifier = new StateModifier({
            size: [this.options.width, this.options.height],
            data: this.options.data,
        });

        _createCard = createCardCallback;

        this.mainNode = this.add(this.rootModifier);

        _createControls.call(this);
        _resetCards.call(this);
    };


    PageSwaper.prototype = Object.create(View.prototype);
    PageSwaper.prototype.constructor = PageSwaper;


    var _createCard;

    PageSwaper.DEFAULT_OPTIONS = {
        height: 480-69,
        width: 320,
        data: [],
        selected: 0,
    };

    var makeSnapRenderController = function(widthIn, widthOut, heightIn, heightOut) {
        var renderer = new RenderController({
            inTransition: {curve: Easing.inOutQuart, duration: 100},
            outTransition: {curve: Easing.inOutQuart, duration: 100},
            overlap: true,
        });
        renderer.inTransformFrom(function(progress) {
            return Transform.translate(0, 0, 10);
        });

        renderer.outTransformFrom(function(progress) {
            return Transform.translate(0, 0, -10);
        });
        renderer.inOpacityFrom(function(progress) { return 1; });
        renderer.outOpacityFrom(function(progress) { return progress*1; });

        return renderer;
    };

    var renderer = makeSnapRenderController();
    
    function _createControls() {
        this.mainNode.add(renderer);
    }

    function _resetCards() {
        renderer.hide();
        var container = new ContainerSurface();
        var pages = _loadCards(
            this.options.selected,
            this.options.data,
            this.options.height,
            function() { this.options.selected++; }.bind(this),
            function() { this.options.selected--; }.bind(this),
            function() { _resetCards.call(this); }.bind(this));
        for(var i = 0; i < 3; i++) {
            container.add(pages[i].modifier).add(pages[i].renderer);
        }
        renderer.show(container);
        this._eventOutput.emit('show', { item: this.options.data[this.options.selected] });
    }

    function _loadCards(index, data, height, inc, dec, refresh) {
        var length = data.length;
        if (length == 0) { console.log('No data check');
            return;
        }
        var pages = [];
        pages.push({
            renderer: new makeSnapRenderController(0, 0, 0, 0),
            modifier: new Modifier(),
            offset: -320,
        });
        pages.push({
            renderer: new makeSnapRenderController(0, 0, 0, 0),
            modifier: new Modifier(),
            offset: 0,
        });
        pages.push({
            renderer: new makeSnapRenderController(0, 0, 0, 0),
            modifier: new Modifier(),
            offset: 320,
        });
        for(var i = 0; i < 3; i++) {
            pages[i].modifier.setTransform(
                Transform.translate(pages[i].offset, 0, 0), {
                duration: 0,
                curve: Easing.outElastic,
            });
        }
        var draggable = new Draggable({
            xRange: [-320, 320],
            yRange: [0, 0],
        });
        var renderLeft = false;
        var renderRight = false;
        if (index < 0) {console.log('Lower boundary check'); index = 0; } // Lower boundary check
        if (index >= length) {console.log('Upper boundary check'); index = length - 1; } // Upper boundary check
        if (index > 0) { // Render left card check
            console.log('Render left: [' + index + ' > 0]');
            pages[0].card = _createCard(undefined, index-1, length, data[index-1], height);
            pages[0].renderer.show(pages[0].card);
        }
        console.log('Render card: [' + (index + 1) + ' of ' + length + ']');
        pages[1].card = _createCard(undefined, index, length, data[index], height);
        pages[1].renderer.show(pages[1].card);
        pages[1].card.bindTo(draggable); // Sets up initial event piping

        if (index < length - 1) { // Render right card check
            console.log('Render right: [' + (index + 2) + ' < ' + length + ' - 1]');
            pages[2].card = _createCard(undefined, index + 1, length, data[index + 1], height);
            pages[2].renderer.show(pages[2].card);
        }

        var draggableUpdate = function(e) {
            if ((e.position[0] < 0 && !(index < length - 1)) || (e.position[0] > 0 && !(index > 0))) {
                draggable.setPosition([0, 0]);
                return;
            }
            if (e.position[0] > 180) {
                console.log('slide right');
                draggable.removeListener('update', draggableUpdate);
                draggable.removeListener('end', draggableEnd);

                var trans = { 
                    duration:400, 
                    curve:Easing.inOutQuad
                };
                pages[0].modifier.setTransform(Transform.translate(0, 0, 0), trans);
                pages[1].modifier.setTransform(Transform.translate(320, 0, 0), trans,
                function(dec, refresh) {
                    return function() {
                        dec();
                        refresh();
                    };
                }(dec, refresh));
                return;
            }
            if (e.position[0] < -180) {
                console.log('slide left');
                draggable.removeListener('update', draggableUpdate);
                draggable.removeListener('end', draggableEnd);

                var trans = { 
                    duration:400, 
                    curve:Easing.inOutQuad
                };
                pages[1].modifier.setTransform(Transform.translate(-320, 0, 0), trans);
                pages[2].modifier.setTransform(Transform.translate(0, 0, 0), trans,
                function(inc, refresh) {
                    return function() {
                        inc();
                        refresh();
                    };
                }(inc, refresh));
                return;
            }
            for(var i = 0; i < 3; i++){
                var position = e.position[0];
                if (position < 50 && position > -50) {
                    position = 0;
                }
                pages[i].modifier.setTransform(Transform.translate(position+pages[i].offset, 0, 0));
            }
        };
        var draggableEnd = function(e) {
            for(var i = 0; i < 3; i++) {
                var transform = Transform.translate(pages[i].offset, 0, 0);
                pages[i].modifier.setTransform(transform, {curve: Easing.outBounce, duration: 500});
            }
            draggable.setPosition([0, 0]);
        };
        draggable.on('update', draggableUpdate);
        draggable.on('end', draggableEnd);
        return pages;
    };

    module.exports = PageSwaper;
});