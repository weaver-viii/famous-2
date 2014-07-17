define(function(require, exports, module) {
    var ScrollView = require('famous/views/Scrollview');
    var Transitionable  = require('famous/transitions/Transitionable');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Surface = require('famous/core/Surface');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Transform = require('famous/core/Transform');
    var SnapTransition  = require('famous/transitions/SnapTransition');
    var OptionsManager = require('famous/core/OptionsManager');

    Transitionable.registerMethod('snap',SnapTransition);

    var snap = { method:'snap', period:200, dampingRatio:0.6 }

    function RefreshScrollView(options, callback) {
        ScrollView.apply(this, arguments);

        this.options = Object.create(RefreshScrollView.DEFAULT_OPTIONS);
        this.optionsManager = new OptionsManager(this.options);
        if (options) this.optionsManager.patch(options);

        if(!callback){
            console.log('WARNING!!! Callback needed as second argument. Example: \n function(completeCallback) { \n console.log("reset triggered"); \n Timer.setTimeout(function() { \n console.log("reset triggered set timeout"); \n completeCallback(); \n }, 1000); \n } ');
        }

        _refreshCallback = callback;

        this.clipSize = this.options.height;
        _createControls.call(this);
    };

    RefreshScrollView.prototype = Object.create(ScrollView.prototype);
    RefreshScrollView.prototype.constructor = RefreshScrollView;

    var _refreshCallback;


    RefreshScrollView.DEFAULT_OPTIONS = {
        imageOrigin:[0.5,0.5],//image origin
        imageAlign:[0.5,0.22],
      //image: './img/pulldown.png',//url for an image to rotate.
        imageSize: [37,12],//image size.
        refreshOffset: 60,  // Top padding for refresh control positioning  
        refreshThreshold: 50, // Number of pixels the pull down requires before firing refresh event
        pullDownText: 'Pull to refresh', //Content shown when pulling down before hitting refresh threshold
        releaseText: 'Release to refresh', //Content shown when pulling down after hitting refresh threshold
        refreshingText: 'Refreshing...', //Content shown after release past thereshold and until refresh has finished.
        fadeStart: -48,//Sets the position start point for the content to begin fading in.
        fadeEnd: -120,//Sets the position finish point for the content to be fully visible.
        refreshSurfaceHeight: 60,//The hight of the surface that contains the pull down and release content.
        refreshClasses: ['refreshProp'],//Classes for when refreshing text is visbile.
        pullRefreshClasses: ['pullRefreshProp'],//Classes for when pull down text is visible.
        releaseRefreshClasses: ['releaseRefreshProp'],//Classes for when release text is visible.
    };

    function _createControls() {

        var refresh = 'Refreshing...';

        this.trans = new Transitionable(0);

        this.reset = function() {
            this._scroller.positionFrom(this.getPosition.bind(this));
        }
        this.sync.on('start', function() {
            this.trans.halt();
            var pos = this.trans.get()
            if (pos !== 0) this.setPosition(pos);
            this.reset();
        }.bind(this));

        var refreshInit = function() {
            _refreshCallback(resetRefresh);
        }.bind(this);
        var resetRefresh = function() {
            this.trans.halt();
            opacityMod.setOpacity(0);
            pullRefresh.setContent(this.options.pullDownText);
            pullRefresh.setClasses(this.options.pullRefreshClasses);
            this.trans.set(0,snap,function(){
                this.reset();
            }.bind(this));
        }.bind(this);

        this.sync.on('end', function() {
            var pos = this.getPosition();
            if (pos < (-this.options.refreshThreshold)) {
                pullRefresh.setContent(this.options.refreshingText);
                pullRefresh.setClasses(this.options.refreshClasses);
                if (this.options.image != undefined) {
                    imageMod.halt();
                    imageMod.setOpacity(0);
                    imageMod.setTransform(Transform.rotateZ(0), { duration : 400});
                }

                this.trans.halt();
                this.trans.set(pos);

                this._scroller.positionFrom(function(){
                    return this.trans.get();
                }.bind(this));

                this.trans.set(-this.options.refreshThreshold ,snap, refreshInit);
            } else if (pos == 0) {
                opacityMod.halt();
                opacityMod.setOpacity(0);
                if (this.options.image != undefined) {
                    imageMod.halt();
                    imageMod.setOpacity(0);
                    imageMod.setTransform(Transform.rotateZ(0), { duration : 400});
                }
                pullRefresh.setContent(this.options.refreshingText);
                pullRefresh.setClasses(this.options.refreshClasses);
            } else {
                this.trans.halt();
                this.trans.set(0);
            }
        }.bind(this));

        var pullRefresh = new Surface({
            size:[undefined,this.options.refreshSurfaceHeight],
            content: this.options.pullDownText,
            classes: this.options.pullRefreshClasses,
            properties: {zIndex:'-2'}
        });
        if(this.options.image != undefined){
            var image = new ImageSurface({
                size: this.options.imageSize,
                content: this.options.image,
                properties: {zIndex:'-2'}
            });
            var imageMod = new StateModifier({
                opacity: 1,
                origin: this.options.imageOrigin,
                align: this.options.imageAlign,
            });
            this.options.container.add(imageMod).add(image);
        }
        var opacityMod = new StateModifier({
            opacity: 0,
            transform: Transform.translate(0, this.options.refreshOffset, 0),
        });
        this.options.container.add(opacityMod).add(pullRefresh);


        this.sync.on('update', function () {
            refreshContent = pullRefresh.getContent;
            var scrollView = this;
            var position = scrollView.getPosition();

            if ( position > scrollView.options.fadeStart ) {
                opacityMod.halt();
                opacityMod.setOpacity(0);
                if (this.options.image != undefined) {
                    imageMod.halt();
                    imageMod.setOpacity(0);
                    imageMod.setTransform(Transform.rotateZ(0));
                }
                pullRefresh.setContent(scrollView.options.pullDownText);
            } else if ( position > scrollView.options.fadeEnd ) {
                opacity = (position - scrollView.options.fadeStart) / ( scrollView.options.fadeEnd - scrollView.options.fadeStart );
                opacityMod.halt();
                opacityMod.setOpacity(opacity);
                if (this.options.image != undefined) {
                    imageMod.halt();
                    imageMod.setOpacity(opacity);
                }
            } else {
                    if (this.options.image != undefined) {
                        imageMod.setTransform(Transform.rotateZ(3.14159265), { duration : 400});
                    }
                    pullRefresh.setClasses(scrollView.options.releaseRefreshClasses);
                    pullRefresh.setContent(scrollView.options.releaseText);
            }

        }.bind(this));
    }

    module.exports = RefreshScrollView;
});
