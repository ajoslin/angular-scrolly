
/**
 * @ngdoc object
 * @name scrolly.$transformerProvider
 * 
 * @description
 * Used for configuring transformer options.  
 */
angular.module('scrolly.transformer', [])
.provider('$transformer', function() {
  //TODO support other vendors
  var transformProp = 'webkitTransform';
  var transformPropDash = '-webkit-transform';
  var transitionProp = 'webkitTransition';
  var transitionEndProp = transitionProp + 'End';

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

  var nextFrame = (function() {
    return window.requestAnimationFrame || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame || 
      function fallback(cb) { return setTimeout(cb, 17); };
  })();

  this.$get = function($window) {

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
     *   - `{void}` `easeTo({number} y, {number} time)` - Eases, or animates, to the given y value in given `time` milliseconds.
     *   - `{void}` `stop()` - Stops any current animation.
     *
     */

    //Creates a transformer for an element
    function transformer(elm) {
      var self = {};
      var raw = elm[0];

      function calcPosition() {
        var matrix = window.getComputedStyle(raw)[transformProp]
          .replace(/[^0-9-.,]/g,'').split(',');
        if (matrix.length > 1) {
          return parseInt(matrix[5], 10);
        } else {
          return 0;
        }
      }
      self.pos = calcPosition();

      var stopTimeout;
      //If we are moving and we stop, we may have a transition in progress.
      //First we set our transform to what it already is (instead of changing
      //to something else) and then we remove our transform prop.
      self.stop = function() {
        if (stopTimeout) {
          clearTimeout(stopTimeout);
          stopTimeout = null;
        }

        raw.style[transitionProp] = 'none';
        self.pos = calcPosition();
        self.changing = false;

        //On next frame, set our position - this is so the transition style
        //on the element has time to 'remove' itself
        nextFrame(function() {
          self.setTo(self.pos);
        });
      };
      self.easeTo = function(y, time, done) {
        raw.style[transitionProp] = transformPropDash + ' ' + time + 'ms ' +
          timingFunction;
        self.pos = y;
        self.changing = true;

        //On next frame, start transition - this is so the transition style
        //on the element has time to 'apply' itself
        nextFrame(function() {
          self.setTo(y);
          stopTimeout = setTimeout(function() {
            self.stop();
            done && done();
          }, time);
        });
      };
      self.setTo = function(y) {
        self.pos = y;
        raw.style[transformProp] = 'translate3d(0,' + y + 'px,0)';
      };

      return self;
    }

    return transformer;

  };
});
