/*! jQuery Tiny Layer - v0.2.0
 * https://github.com/floriancapelle/jquery-tiny-layer
 * Licensed MIT
 */
(function ( root, factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(jQuery);
    }
}(this, function ( $ ) {
    'use strict';

    // Public API
    var api = {};

    /* Configuration
     * @property {object} conf
     * @property {string} conf.triggerSelector - will be used as filter for elements triggering a layer in click event delegation for body
     * @property {string} conf.triggerTargetKey - data key of trigger element for layer id
     * @property {string} conf.layerItemClass
     * @property {string} conf.layerItemContentClass
     * @property {string} conf.layerItemTpl - used to create layer items with jQuery
     * @property {object} conf.visibilityToggleClass - css class for open and close handling
     * ------------------
     * @property {object} conf.layerOptions - options per layer
     * @property {string} conf.layerOptions.closeBtnMarkup - markup of the close button to be appended, false if not
     * @property {bool} conf.layerOptions.autoCloseOthers - close other open layers when opening a layer
     * @property {bool} conf.layerOptions.closeOnOverlayClick - close the layer whose overlay was clicked
     * @property {array} conf.layerOptions.events - supply jQuery-like events with delegation, delegateTarget is item root
     */
    var conf = {
        triggerSelector: '[data-layer-target]',
        triggerTargetKey: 'layerTarget',
        layerItemClass: 'tiny-layer-item',
        layerItemContentClass: 'layer-item-content',
        layerItemTpl: '<article class="tiny-layer-item"><div class="layer-item-content"></div></article>',
        visibilityToggleClass: 'is-visible',
        layerOptions: {
            closeBtnMarkup: '<button class="layer-item-close" type="button"> <img src="2016III/images/close.png"> </button>',
            autoCloseOthers: true,
            closeOnOverlayClick: true,
            events: []
        }
    };
    var $root;
    var $layerItemTpl;

    /**
     * Initialize the component
     * @returns {{}}
     */
    function init() {
        // create wrapper and append to configured element
        var $body = $('body');
        $root = $('<aside class="tiny-layer"></aside>');
        $layerItemTpl = $(conf.layerItemTpl);

        // append wrapper to body
        $body.append($root);

        // trigger event handling
        // open target layer on click on a trigger
        $body.on('click.tinyLayer', conf.triggerSelector, function( event ) {
            var $trigger = $(this);
            var layerId = $trigger.data(conf.triggerTargetKey);

            // stop if the layer already has been added
            if ( getLayerInRoot(layerId).length ) return;

            initLayer(layerId);
            open(layerId);
        });

        // overlay event handling
        // close layer on click on overlay
        $root.on('click.tinyLayer', '.' + conf.layerItemClass, function( event ) {
            var $layer = $(this);

            if ( !$layer.is(event.target) ) return;
            if ( $layer.data('options').closeOnOverlayClick !== true ) return;
            close($layer.data('id'));
        });
        // close layer on click on close btn
        $root.on('click.tinyLayer', '.layer-item-close', function( event ) {
            close($(this).closest('.' + conf.layerItemClass).data('id'));
        });
    }

    /**
     * Initialize a layer by copying the source layer content and appending it to a new layer
     * @param layerId - layer id like '#layer', will be used as jQuery selector
     * @returns {boolean} - whether the initialization was successful or not
     */
    function initLayer( layerId ) {
        if ( !layerId ) return false;

        var $sourceLayer = $(layerId);
        if ( !$sourceLayer || !$sourceLayer.length ) return false;

        var layerContent = $sourceLayer.html();
        if ( typeof layerContent === 'undefined' ) return false;

        // create a new layer item
        var $newLayer = $layerItemTpl.clone();
        var $newLayerContent = $newLayer.children('.' + conf.layerItemContentClass);
        // merge options with defaults and options on the source layer tag if defined
        // like: data-close-btn-markup="false" => closeBtnMarkup: false
        var options = $.extend(true, {}, conf.layerOptions, $sourceLayer.data());

        // set id and options for later use
        $newLayer.data('id', layerId);
        $newLayer.data('options', options);
        // append the source markup to the new item content
        $newLayerContent.append(layerContent);

        if ( options.closeBtnMarkup ) {
            $newLayerContent.append($(options.closeBtnMarkup));
        }
        // copy all classes from target layer to new layer item
        // except the hide class
        $newLayer.addClass($sourceLayer.attr('class').replace('tiny-layer-hide', ''));
        // apply custom events if defined
        options.events.forEach(function( val ) {
            $newLayer.on(val);
        });

        $root.append($newLayer);
        return true;
    }

    /**
     * open a layer
     * @param {string} layerId
     * @returns {{}}
     */
    function open( layerId ) {
        layerId = layerId || '';

        var $layer = getLayerInRoot(layerId);
        // if the layer is not initialized yet, do it and open it afterwards
        if ( !$layer || !$layer.length ) {
            if ( initLayer(layerId) === true ) {
                open(layerId);
            }
            return api;
        }

        var layerOptions = $layer.data('options');

        if ( layerOptions.autoCloseOthers === true ) {
            // close every child layer that's visible
            $root.children(conf.visibilityToggleClass).each(function() {
                close($(this).data('id'));
            });
        }

        // force layout, to enable css transitions
        $layer.width();
        $layer.addClass(conf.visibilityToggleClass);

        return api;
    }

    /**
     * Close and remove a layer
     * @param {string} layerId
     * @returns {{}}
     */
    function close( layerId ) {
        if ( !layerId ) return api;

        var $layer = getLayerInRoot(layerId);

        // wait for transitionend event to remove the layer
        $layer.on('transitionend.tinyLayer webkitTransitionEnd.tinyLayer', function( event ) {
            if ( !$layer.is(event.target) ) return;
            $layer.remove();
        });
        $layer.removeClass(conf.visibilityToggleClass);

        return api;
    }

    /**
     * Get layer element by id in wrapper, match layerId with data property
     * @param {string} layerId
     * @returns {*|HTMLElement}
     */
    function getLayerInRoot( layerId ) {
        var $layer = $();

        $root.children().each(function() {
            if ( $(this).data('id') === layerId ) {
                $layer = $(this);
                return false;
            }
        });

        return $layer;
    }


    $.extend(api, {
        defaults: conf,
        open: open,
        close: close
    });

    $(function() {
        init();
        $.tinyLayer = api;
    });
}));




