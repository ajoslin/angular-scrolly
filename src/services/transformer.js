
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

.factory('$nextFrame', ['$window', function($window) {
  //Polyfill for requestAnimationFrame
  return $window.requestAnimationFrame || 
    $window.webkitRequestAnimationFrame || 
    $window.mozRequestAnimationFrame || 
    function fallback(cb) { 
      return $window.setTimeout(cb, 17); 
    };
}])

.provider('$transformer', [function() {

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

  this.$get = ['$window', '$nextFrame', '$sniffer', '$document', function($window, $nextFrame, $sniffer, $document) {
    //TODO remove this fix when angular-1.2 comes out
    //Fixes a known bug with android $sniffer in angular-1.1.x
    if (!$sniffer.vendorPrefix) {
      if (isString( $document[0].body.style.webkitTransition )) {
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
    var transitionEndProp = prefix ? (prefix + 'TransitionEnd') : 'transitionend';

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
     *   - `{object}` `pos` - A point giving the current x and y transform of the element.  Is an object with number fields `x` and `y`.
     *   - `{void}` `setTo({object} point)` - Sets the current transform to the given x and y position. Expects point object with fields `x` and/or `y`. If only `x` or `y` is given, it will only set that field. For example, `transformer.setTo({x: 33})` will only change the current x-position.
     *   - `{void}` `easeTo({object} point, {number} time, {function=} done)` - Eases to the given position in `time` milliseconds. If given, the `done` callback will be called when the transition ends. Expects point object with fields `x` and `y`.
     *   - `{void}` `stop({function=} done)` - Stops any current animation. If given, the `done` function will be called when the stop is done (after the next frame).
     *
     */

    function transitionString(transitionTime) {
      return transformPropDash + ' ' + transitionTime + 'ms ' + timingFunction;
    }
    function transformString(x, y) {
      return 'translate3d(' + (x||0) + 'px,' + (y||0) + 'px,0)';
    }

    //Creates a transformer for an element
    function $transformer(elm) {
      var self = {};
      var raw = elm[0];
      var currentTransformer = elm.data('$scrolly.transformer');
      if (currentTransformer) {
        return currentTransformer;
      } else {
        elm.data('$scrolly.transformer', self);
      }

      elm.bind('$destroy', function() {
        self.pos = null;
        changingDoneCallback = null;
      });

      self.pos = {x: 0, y: 0};

      //Gets the current x and y transform of the element
      self.updatePosition = function() {
        var style = $window.getComputedStyle(raw);
        var matrix = (style[transformProp] || '')
          .replace(/[^0-9-.,]/g,'')
          .split(',');
        if (matrix.length > 1) {
          self.pos.x = parseInt(matrix[4], 10);
          self.pos.y = parseInt(matrix[5], 10);
        }
        return self.pos;
      };
      self.updatePosition();

      var changingDoneCallback;
      elm.bind(transitionEndProp, onTransitionEnd);
      function onTransitionEnd() {
        if (self.changing) {
          self.stop(changingDoneCallback);
        }
      }

      self.stop = function(done) {
        //Stop transitions, and set self.pos to wherever we were.
        raw.style[transitionProp] = '';
        self.updatePosition();
        self.changing = false;

        //On next frame, set our element's position - this wait is so the
        //transition style on the element has time to 'remove' itself
        $nextFrame(function() {
          self.setTo(self.pos);
          (done || noop)();
        });
      };

      self.easeTo = function(pos, transitionTime, done) {
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
          changingDoneCallback = done;

          //On next frame, start transition - this wait is so the transition
          //style on the element has time to 'apply' itself before the elm's
          //position is set
          $nextFrame(function() {
            self.setTo(pos);
          });
        }
      };

      //Allow setting with setTo(x,y) or setTo({x:x, y:y})
      self.setTo = function(pos) {
        isDefined(pos.x) && (self.pos.x = pos.x);
        isDefined(pos.y) && (self.pos.y = pos.y);
        raw.style[transformProp] = transformString(self.pos.x, self.pos.y);
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
     * @name ajoslin.scrolly.$transformer#transitionProp
     * @propertyOf ajoslin.scrolly.$transformer
     *
     * @description {string} The property used for element transitions.  For example "webkitTransition".
     */
    $transformer.transitionProp = transitionProp;

    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$transformer#transitionEndProp
     * @propertyOf ajoslin.scrolly.$transformer
     *
     * @description {string} The property used for binding element transitionEnd. For example "webkitTransitionEnd".
     */
    $transformer.transitionEndProp = transitionEndProp;

    return $transformer;

  }];
}]);
