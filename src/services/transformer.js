
/**
 * @ngdoc object
 * @name scrolly.$transformerProvider
 * 
 * @description
 * Used for configuring transformer options.  
 */
angular.module('scrolly.transformer', [])

/**
 * @ngdoc object
 * @name scrolly.$requestAnimationFrame
 * 
 * @description 
 * Uses {@link https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame requestAnimationFrame}, or a fallback if it is not available.
 *
 * The main reason we put this into a factory is for ease of mocking it during tests.
 *
 * @param {function} callback Callback to call when the DOM has redrawn - when the next farme is ready.
 * @returns {number} requestId Unique id identifying this request, to be passed to {@link https://developer.mozilla.org/en-US/docs/Web/API/window.cancelAnimationFrame scrolly.cancelAnimationFrame}. (cancelAnimationFrame not implemented currently, because it is not used).
 */

.factory('$requestAnimationFrame', function($window) {
  //Polyfill for requestAnimationFrame
  return $window.requestAnimationFrame || 
    $window.webkitRequestAnimationFrame || 
    $window.mozRequestAnimationFrame || 
    function fallback(cb) { 
      return $window.setTimeout(cb, 17); 
    };
})

.provider('$transformer', function() {
  //TODO support other vendors
  var transformProp = 'webkitTransform';
  var transformPropDash = '-webkit-transform';
  var transitionProp = 'webkitTransition';

  /**
   * @ngdoc method
   * @name scrolly.$transformerProvider#timingFunction
   * @methodOf scrolly.$draggerProvider
   * 
   * @description
   * Sets/gets the CSS timing function used for transform-transitions. For example "ease-in-out".
   *
   * @param {string=} newTimingFunction The CSS timing function to be used.
   * @returns {string} timingFunction The current CSS timing function.
   */
  var timingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
  this.timingFunction = function(newTimingFunction) {
    arguments.length && (timingFunction = newTimingFunction);
    return timingFunction;
  };

  this.$get = function($window, $requestAnimationFrame) {

    /**
     * @ngdoc object
     * @name scrolly.$transformer
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
     *   - `{void}` `stop()` - Stops any current animation.
     *
     */

    //Creates a transformer for an element
    function $transformer(elm) {
      var self = {};
      var raw = elm[0];

      //This method is only exposed for testing purposes
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

      var stopTimeout;
      //If we are moving and we stop, we may have a transition in progress.
      //First we set our transform to what it already is (instead of changing
      //to something else) and then we remove our transform prop.
      self.stop = function(done) {
        if (stopTimeout) {
          $window.clearTimeout(stopTimeout);
          stopTimeout = null;
        }

        raw.style[transitionProp] = 'none';
        self.pos = self.$$calcPosition();
        self.changing = false;

        //On next frame, set our position - this is so the transition style
        //on the element has time to 'remove' itself
        $requestAnimationFrame(function() {
          self.setTo(self.pos);
          done && done();
        });
      };
      self.easeTo = function(y, time, done) {
        if (!angular.isNumber(time) || time < 0) {
          throw new Error("Expected a positive number for time, got '" + time + "'.");
        }
        if (self.changing) {
          self.stop(afterStop);
        } else {
          afterStop();
        }
        function afterStop() {
          raw.style[transitionProp] = transformPropDash + ' ' + time + 'ms ' +
            timingFunction;
          self.changing = true;

          //On next frame, start transition - this is so the transition style
          //on the element has time to 'apply' itself
          $requestAnimationFrame(function() {
            self.setTo(y);
            stopTimeout = $window.setTimeout(function() {
              self.stop();
              done && done();
            }, time);
          });
        }
      };
      self.setTo = function(y) {
        self.pos = y;
        raw.style[transformProp] = 'translate3d(0,' + y + 'px,0)';
      };

      return self;
    }

    $transformer.transformProp = transformProp;
    $transformer.transformPropDash = transformPropDash;
    $transformer.transitionProp = transitionProp;

    return $transformer;

  };
});
