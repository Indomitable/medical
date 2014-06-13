(function ($, undefined) {

    $.widget("ui.dragslider", $.ui.slider, {

        options: $.extend({}, $.ui.slider.prototype.options, { rangeDrag: false }),

        _create: function () {
            $.ui.slider.prototype._create.apply(this, arguments);
            this._rangeCapture = false;
        },

        _mouseCapture: function (event) {
            var o = this.options;

            if (o.disabled) return false;

            if (event.target == this.range.get(0) && o.rangeDrag == true && o.range == true) {
                this._rangeCapture = true;
                this._rangeStart = null;
            }
            else {
                this._rangeCapture = false;
            }

            $.ui.slider.prototype._mouseCapture.apply(this, arguments);

            if (this._rangeCapture == true) {
                this.handles.removeClass("ui-state-active").blur();
            }

            return true;
        },

        _mouseStop: function (event) {
            this._rangeStart = null;
            return $.ui.slider.prototype._mouseStop.apply(this, arguments);
        },

        _slide: function (event, index, newVal) {
            if (!this._rangeCapture) {
                return $.ui.slider.prototype._slide.apply(this, arguments);
            }

            if (this._rangeStart == null) {
                this._rangeStart = newVal;
            }

            var oldValLeft = this.options.values[0],
                oldValRight = this.options.values[1],
                slideDist = newVal - this._rangeStart,
                newValueLeft = oldValLeft + slideDist,
                newValueRight = oldValRight + slideDist,
                allowed;

            if (this.options.values && this.options.values.length) {
                if (newValueRight > this._valueMax() && slideDist > 0) {
                    slideDist -= (newValueRight - this._valueMax());
                    newValueLeft = oldValLeft + slideDist;
                    newValueRight = oldValRight + slideDist;
                }

                if (newValueLeft < this._valueMin()) {
                    slideDist += (this._valueMin() - newValueLeft);
                    newValueLeft = oldValLeft + slideDist;
                    newValueRight = oldValRight + slideDist;
                }

                if (slideDist != 0) {
                    newValues = this.values();
                    newValues[0] = newValueLeft;
                    newValues[1] = newValueRight;

                    // A slide can be canceled by returning false from the slide callback
                    allowed = this._trigger("slide", event, {
                        handle: this.handles[index],
                        value: slideDist,
                        values: newValues
                    });

                    if (allowed !== false) {
                        this.values(0, newValueLeft, true);
                        this.values(1, newValueRight, true);
                    }
                    this._rangeStart = newVal;
                }
            }



        },


        /*
        //only for testing purpose
        value: function(input) {
            console.log("this is working!");
            $.ui.slider.prototype.value.apply(this,arguments);
        }
        */
    });

})(jQuery);


/*
 jQuery UI Slider plugin wrapper
*/
angular.module('ui.slider', []).value('uiSliderConfig', {})
    .directive('uiSlider', ['uiSliderConfig', '$timeout', function (uiSliderConfig, $timeout) {
        uiSliderConfig = uiSliderConfig || {};
        return {
            require: 'ngModel',
            compile: function () {
                return function (scope, elm, attrs, ngModel) {

                    function parseNumber(n, decimals) {
                        return (decimals) ? parseFloat(n) : parseInt(n);
                    };

                    var options = angular.extend(scope.$eval(attrs.uiSlider) || {}, uiSliderConfig);
                    // Object holding range values
                    var prevRangeValues = {
                        min: null,
                        max: null
                    };

                    // convenience properties
                    var properties = ['min', 'max', 'step'];
                    var useDecimals = (!angular.isUndefined(attrs.useDecimals)) ? true : false;

                    var init = function () {
                        // When ngModel is assigned an array of values then range is expected to be true.
                        // Warn user and change range to true else an error occurs when trying to drag handle
                        if (angular.isArray(ngModel.$viewValue) && options.range !== true) {
                            console.warn('Change your range option of ui-slider. When assigning ngModel an array of values then the range option should be set to true.');
                            options.range = true;
                        }

                        // Ensure the convenience properties are passed as options if they're defined
                        // This avoids init ordering issues where the slider's initial state (eg handle
                        // position) is calculated using widget defaults
                        // Note the properties take precedence over any duplicates in options
                        angular.forEach(properties, function (property) {
                            if (angular.isDefined(attrs[property])) {
                                options[property] = parseNumber(attrs[property], useDecimals);
                            }
                        });

                        elm.dragslider(options);
                        init = angular.noop;
                    };

                    // Find out if decimals are to be used for slider
                    angular.forEach(properties, function (property) {
                        // support {{}} and watch for updates
                        attrs.$observe(property, function (newVal) {
                            if (!!newVal) {
                                init();
                                elm.dragslider('option', property, parseNumber(newVal, useDecimals));
                            }
                        });
                    });
                    attrs.$observe('disabled', function (newVal) {
                        init();
                        elm.dragslider('option', 'disabled', !!newVal);
                    });

                    // Watch ui-slider (byVal) for changes and update
                    scope.$watch(attrs.uiSlider, function (newVal) {
                        init();
                        if (newVal != undefined) {
                            elm.dragslider('option', newVal);
                        }
                    }, true);

                    // Late-bind to prevent compiler clobbering
                    $timeout(init, 0, true);

                    // Update model value from slider
                    elm.bind('slide', function (event, ui) {
                        ngModel.$setViewValue(ui.values || ui.value);
                        scope.$apply();
                    });

                    // Update slider from model value
                    ngModel.$render = function () {
                        init();
                        var method = options.range === true ? 'values' : 'value';

                        if (isNaN(ngModel.$viewValue) && !(ngModel.$viewValue instanceof Array))
                            ngModel.$viewValue = 0;

                        // Do some sanity check of range values
                        if (options.range === true) {

                            // Check outer bounds for min and max values
                            if (angular.isDefined(options.min) && options.min > ngModel.$viewValue[0]) {
                                ngModel.$viewValue[0] = options.min;
                            }
                            if (angular.isDefined(options.max) && options.max < ngModel.$viewValue[1]) {
                                ngModel.$viewValue[1] = options.max;
                            }

                            // Check min and max range values
                            if (ngModel.$viewValue[0] >= ngModel.$viewValue[1]) {
                                // Min value should be less to equal to max value
                                if (prevRangeValues.min >= ngModel.$viewValue[1])
                                    ngModel.$viewValue[0] = prevRangeValues.min;
                                // Max value should be less to equal to min value
                                if (prevRangeValues.max <= ngModel.$viewValue[0])
                                    ngModel.$viewValue[1] = prevRangeValues.max;
                            }

                            // Store values for later user
                            prevRangeValues.min = ngModel.$viewValue[0];
                            prevRangeValues.max = ngModel.$viewValue[1];

                        }
                        elm.dragslider(method, ngModel.$viewValue);
                    };

                    scope.$watch(attrs.ngModel, function () {
                        if (options.range === true) {
                            ngModel.$render();
                        }
                    }, true);

                    function destroy() {
                        elm.slider('destroy');
                    }
                    elm.bind('$destroy', destroy);
                };
            }
        };
    }]);

