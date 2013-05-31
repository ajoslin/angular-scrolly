
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

  this.$get = function($window, $nextFrame) {
    //TODO support other vendors
    var transformProp = 'webkitTransform';
    var transformPropDash = '-webkit-transform';
    var transitionProp = 'webkitTransition';

    /**
     * @ngdoc object
     * @name ajoslin.scrolly.$transformer
     *
     * @description
     * A factory for creating a transformation-manipulator on an element.  It manipulates the transform of an element vertically, allowing you to set, get, and animate the given element's transform.
     *
     * @param {element} element Element to manipulate the transformation of.
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

    //Creates a transformer for an element
    function $transformer(elm) {
      var self = {};
      var raw = elm[0];

      //This method is only exposed for testing purposes
      //Gets the current y transform of the element
      self.$$calcPosition = function() {
        var matrix = $window.getComputedStyle(raw)[transformProp]
          .replace(/[^0-9-.,]/g,'').split(',');
        if (matrix.length > 1) {
          return parseInt(matrix[5], 10);
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

      self.easeTo = function(y, transitionTime, done) {
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
            self.setTo(y);
            transitionEndTimeout = $window.setTimeout(function() {
              self.stop();
              done && done();
            }, transitionTime);
          });
        }
      };
      self.setTo = function(y) {
        self.pos = y;
        raw.style[transformProp] = 'translate3d(0,' + y + 'px,0)';
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
