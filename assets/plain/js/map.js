/*

 Copyright (c) 2015 Loginov Artem http://loginov.biz
 Dual licensed under the MIT license and GPL license

*/

var GoogleMap = (function(window, undefined) {

    'use strict';

    function loadAPI() {

        var script = document.createElement('script');

        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=GoogleMap.init';

        document.body.appendChild(script);

    }

    function init() {

        // Custom prototypes
        google.maps.Map.prototype.setCenterWithOffset = function(latlng, centerOffset) {

            var map = this,
                ov = new google.maps.OverlayView();

            ov.onAdd = function() {

                var proj = this.getProjection(),
                    aPoint = proj.fromLatLngToContainerPixel(latlng);

                aPoint.x = aPoint.x+centerOffset[0];
                aPoint.y = aPoint.y+centerOffset[1];

                map.setCenter(proj.fromContainerPixelToLatLng(aPoint));

            };

            ov.draw = function() {};
            ov.setMap(this);

        };

        // Marker customization

        function CustomMarker(latlng, map, args, dimensions) {

            this.latlng = latlng;
            this.args = args;
            this.dimensions = dimensions || [16, 16];
            this.setMap(map);

        }

        CustomMarker.prototype = new google.maps.OverlayView();

        CustomMarker.prototype.draw = function() {

            var self = this;

            var div = this.div;

            if (!div) {

                div = this.div = document.createElement('div');

                div.className = 'b-contacts_map_marker';

                div.style.position = 'absolute';
                div.style.cursor = 'pointer';

                if (typeof(self.args.marker_id) !== 'undefined' && typeof(div.dataset) !== 'undefined') {
                    div.dataset.marker_id = self.args.marker_id;
                }

                /*google.maps.event.addDomListener(div, "click", function(event) {
                 //google.maps.event.trigger(self, "click");
                 });*/

                var panes = this.getPanes();
                panes.overlayImage.appendChild(div);

            }

            var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

            if (point) {
                div.style.left = (point.x - (this.dimensions[0] / 2)) + 'px';
                div.style.top = (point.y - (this.dimensions[1] / 2)) + 'px';
            }
        };

        CustomMarker.prototype.remove = function() {
            if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
            }
        };

        CustomMarker.prototype.getPosition = function() {
            return this.latlng;
        };

        var $map = $('#contacts_map'),

            zoom = $map.data('zoom'),
            addresses = $map.data('address'),
            coordinates = $map.data('coordinates'),

            geoCoder = new google.maps.Geocoder(),
            latLng = new google.maps.LatLng(0, 0),
            bounds = new google.maps.LatLngBounds(),

            options = {
                zoom: zoom || 8,
                scrollwheel: false,
                center: latLng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true
            },

            map = new google.maps.Map($map[0], options),

            overlay,
            location,

            addressArray = !!addresses && addresses != '' ? addresses.split(';') : false,
            coordinatesArray = !!coordinates && coordinates != '' ? coordinates.split(';') : false;

        if (addressArray && addressArray.length && !coordinatesArray) {

            for (var ali = 0; ali < addressArray.length; ali++) {

                getLatLng.call(geoCoder, addressArray[ali], function(results) {

                    location = results[0].geometry.location;
                    overlay = new CustomMarker(location, map, { marker_id: 'b_contacts_map_marker' }, [48, 48]);

                    setCenterMap(addressArray.length);

                    google.maps.event.addDomListener(window, 'resize', function() {

                        google.maps.event.trigger(map, 'resize');
                        setCenterMap(addressArray.length);

                    });

                });

            }

        } else if (coordinatesArray && coordinatesArray.length) {

            for (var cli = 0; cli < coordinatesArray.length; cli++) {

                var LatLng = coordinatesArray[cli].split(',');

                LatLng[0] = parseFloat(LatLng[0], 10);
                LatLng[1] = parseFloat(LatLng[1], 10);

                location = new google.maps.LatLng(LatLng[0], LatLng[1]);
                overlay = new CustomMarker(location, map, { marker_id: 'b_contacts_map_marker' }, [48, 48]);

                setCenterMap(coordinatesArray.length);

                google.maps.event.addDomListener(window, 'resize', function() {

                    google.maps.event.trigger(map, 'resize');
                    setCenterMap(coordinatesArray.length);

                });

            }

        }

        function setCenterMap(quantity) {

            if (quantity > 1) {

                bounds.extend(location);
                map.fitBounds(bounds);

            } else {

                //map.setCenter(location);
                map.setCenterWithOffset(location, offsetCalc());
                map.setZoom(zoom || 15);

            }

        }

        // Get lat/lng

        function getLatLng(address, callback) {

            this.geocode( { address: address }, function(results, status) {

                if (status == google.maps.GeocoderStatus.OK) {

                    callback(results);

                } else {

                    if ('console' in window) {
                        console.log('Geocoder failed due to: ' + status);
                        console.log(results);
                    }

                }
            });

        }

        // Get center map offset

        function offsetCalc() {

            var centerOffset = [0, 0],
                $container = $('.b-contacts_inner');

            switch (helpers.screen()) {

                case 'xs':

                    centerOffset = [0, -225];
                    break;

                case 'sm':

                    centerOffset = [0, -225];
                    break;

                case 'md':

                    centerOffset = [-($container.width() / 4), 0];
                    break;

                default:
                case 'lg':

                    centerOffset = [-($container.width() / 6), 0];
                    break;

            }

            return centerOffset;

        }

    }

    return {
        init: init,
        loadAPI: loadAPI
    };

})(window);