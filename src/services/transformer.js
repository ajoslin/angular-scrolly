
/**
 * @ngdoc object
 * @name ajoslin.scrolly.$transformerProvider
 * 
 * @description
 * Used for configuring transformer options.  
 */
angular.module('ajoslin.scrolly.transformer', [])

/**
 * @ngdoc object
 * @name ajoslin.scrolly.$nextFrame
 * 
 * @description 
 * A service to wrap {@link https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame window.requestAnimationFrame}, or a fallback if it is not available.
 *
 * The main reason this is in a service is for ease of mocking it during tests.
 *
 * @param {function} callback Callback to call when the DOM has redrawn - when the next frame is ready.
 * @returns {number} `requestId` Unique id identifying this request, to be passed to {@link https://developer.mozilla.org/en-US/docs/Web/API/window.cancelAnimationFrame window.cancelAnimationFrame}.
 */

.factory('$nextFrame', function($window) {
  //Polyfill for requestAnimationFrame
  return $window.requestAnimationFrame || 
    $window.webkitRequestAnimationFrame || 
    $window.mozRequestAnimationFrame || 
    function fallback(cb) { 
      return $window.setTimeout(cb, 17); 
    };
})

.provider('$transformer', function() {

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$transformerProvider#timingFunction
   * @methodOf ajoslin.scrolly.$transformerProvider
   * 
   * @description
   * Sets/gets the CSS timing function used for transform-transitions. For example "ease-in-out".
   *
   * @param {string=} newTimingFunction The CSS timing function to be used.
   * @returns {string} timingFunction The current CSS timing function.
   */
  var timingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  this.timingFunction = function(newTimingFunction) {
    arguments.length && (timingFunction = newTimingFunction);
    return timingFunction;
  };

  this.$get = function($window, $nextFrame, $sniffer, $document) {
    //TODO remove this fix when angular-1.2 comes out
    //Fixes a known bug with android $sniffer in angular-1.1.x
    if (!$sniffer.vendorPrefix) {
      if (angular.isString( $document[0].body.style.webkitTransition )) {
        $sniffer.vendorPrefix = 'webkit';
      }
    }

    var prefix = $sniffer.vendorPrefix;
    //ie10, older webkit - expects lowercase. firefox, opera - uppercase
    if (prefix && prefix !== 'Moz' && prefix !== 'O') {
      prefix = prefix.substring(0,1).toLowerCase() + prefix.substring(1);
    }
    var transformProp = prefix ? (prefix + 'Transform') : 'transform';
    var transformPropDash = prefix ? ('-' + prefix.toLowerCase() + '-transform') : 'transform';
    var transitionProp = prefix ? (prefix + 'Transition') : 'transition';

    /**
     * @ngdoc object
     * @name ajoslin.scrolly.$transformer
     *
     * @description
     * A factory for creating a transformation-manipulator on an element.  It manipulates the transform of an element vertically, allowing you to set, get, and animate the given element's transform.
     *
     * @param {element} element Element to manipulate the transformation of.
     * @param {object=} options Options to pass to the transformer. Pass key "horizontal" as true if you wish to operate on x instead of y.
     * @returns {object} Newly created transformer object with the following properties:
     *
     *   - `{number}` `pos` - The current vertical transform, in pixels, of the element.
     *   - `{void}` `setTo({number} y)` - Sets the current transform to the given y value.
     *   - `{void}` `easeTo({number} y, {number} time, {function=} done)` - Eases to the given position in `time` milliseconds. If given, the `done` callback will be called when the transition ends.
     *   - `{void}` `stop({function=} done)` - Stops any current animation. If given, the `done` function will be called when the stop is done (after the next frame).
     *
     */

    function transitionString(transitionTime) {
      return transformPropDash + ' ' + transitionTime + 'ms ' + timingFunction;
    }

    function transformGetterX(n) {
      return 'translate3d(' + n +'px,0,0)';
    }
    function transformGetterY(n) {
      return 'translate3d(0,' + n + 'px,0)';
    }

    //Creates a transformer for an element
    function $transformer(elm, options) {
      var self = {};
      var currentTransformer = elm.data('$scrolly.transformer');
      if (currentTransformer) {
        return currentTransformer;
      } else {
        elm.data('$scrolly.transformer', self);
      }

      var raw = elm[0];
      var _transformGetter;
      var _matrixIndex;

      options = options || {};
      if (options.horizontal) {
        _transformGetter = transformGetterX;
        _matrixIndex = 4;
      } else {
        _transformGetter = transformGetterY;
        _matrixIndex = 5;
      }

      //This method is only exposed for testing purposes
      //Gets the current y transform of the element
      self.$$calcPosition = function() {
        var style = $window.getComputedStyle(raw);
        var matrix = (style[transformProp] || '')
          .replace(/[^0-9-.,]/g,'')
          .split(',');
        if (matrix.length > 1) {
          return parseInt(matrix[_matrixIndex], 10);
        } else {
          return 0;
        }
      };
      self.pos = self.$$calcPosition();

      var transitionEndTimeout;
      self.stop = function(done) {
        //If an easeTo is currently waiting for its transition to end, stop the
        //listen. Because we are ending now with this stop() call.
        if (transitionEndTimeout) {
          $window.clearTimeout(transitionEndTimeout);
          transitionEndTimeout = null;
        }

        //Stop transitions, and set self.pos to wherever we were.
        raw.style[transitionProp] = 'none';
        self.pos = self.$$calcPosition();
        self.changing = false;

        //On next frame, set our element's position - this wait is so the
        //transition style on the element has time to 'remove' itself
        $nextFrame(function() {
          self.setTo(self.pos);
          done && done();
        });
      };

      self.easeTo = function(n, transitionTime, done) {
        if (!angular.isNumber(transitionTime) || transitionTime < 0) {
          throw new Error("Expected a positive number for time, got '" +
            transitionTime + "'.");
        }
        //If we're currently animating, we need to stop before we try to 
        //animate differently.
        if (self.changing) {
          self.stop(doTransition);
        } else {
          doTransition();
        }
        function doTransition() {
          raw.style[transitionProp] = transitionString(transitionTime);
          self.changing = true;

          //On next frame, start transition - this wait is so the transition
          //style on the element has time to 'apply' itself before the elm's
          //position is set
          $nextFrame(function() {
            self.setTo(n);
            transitionEndTimeout = $window.setTimeout(function() {
              self.stop();
              done && done();
            }, transitionTime);
          });
        }
      };

      self.setTo = function(n) {
        self.pos = n;
        raw.style[transformProp] = _transformGetter(n);
      };

      return self;
    }

    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$transformer#transformProp
     * @propertyOf ajoslin.scrolly.$transformer
     *
     * @description {string} The property used for element transformations.  For example "webkitTransform".
     */
    $transformer.transformProp = transformProp;

    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$transformer#transformPropDash
     * @propertyOf ajoslin.scrolly.$transformer
     *
     * @description {string} The property used for element transformations, "dashed version". For example "-webkit-transform". 
     */

    $transformer.transformPropDash = transformPropDash;
    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$transformer#transitionprop
     * @propertyOf ajoslin.scrolly.$transformer
     *
     * @description {string} The property used for element transitions.  For example "webkitTransition".
     */
    $transformer.transitionProp = transitionProp;

    return $transformer;

  };
});
