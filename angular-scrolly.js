/*
 * angular-scrolly - v0.0.7 - 2013-10-15
 * http://github.com/ajoslin/angular-scrolly
 * Created by Andy Joslin; Licensed under Public Domain
 */
(function() {

/*
 * @ngdoc module
 * @name ajoslin.scrolly
 * @description
 * 
 * 'ajoslin.scrolly' Is the one module that includes all of the others.
 */
angular.module('ajoslin.scrolly', [
  'ajoslin.scrolly.scroller',
  'ajoslin.scrolly.directives'
]);

var jqLite = angular.element,
  noop = angular.noop,
  isDefined = angular.isDefined,
  copy = angular.copy,
  forEach = angular.forEach,
  isString = angular.isString,
  extend = angular.extend;


/**
 * @ngdoc directive
 * @name ajoslin.scrolly.directive:scrollyScroll
 * @restrict A
 *
 * @description
 * Attaches a {@link #/ajoslin.scrolly.$scroller $scroller} to the given element.
 *
 * ## Example
 * <pre>
 * <ul scrolly-scroll>
 *   <li ng-repeat="i in items">Scroll me! {{i}}</li>
 * </ul>
 * </pre>
 */

angular.module('ajoslin.scrolly.directives', ['ajoslin.scrolly.scroller'])
.directive('scrollyScroll', ['$scroller', '$document', function($scroller, $document) {
  jqLite(document.body).bind('touchmove', function(e) {
    e.preventDefault();
  });
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var scroller = new $scroller(elm);
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ajoslin.scrolly.directive:scrollyDraggerIgnore
 * @restrict A
 *
 * @description
 * Makes it so this element and all of its children ignore any $dragger behavior. In other words, this element and children will behave like normal when dragged.
 */
angular.module('ajoslin.scrolly.directives')
.directive('scrollyDraggerIgnore', [function() {
  return {
    restrict: 'A',
    controller: noop // just so we can see if it exists, add a controller
  };
}]);


angular.module('ajoslin.scrolly.desktop', [])

.provider('$desktopScroller', [function() {

  var KEYS = { 
    38: 150, //up arrow -> up
    40: -150, //down arrow -> down
    32: -600 //spacebar -> down
  };
  this.key = function(keyCode, delta) {
    if (arguments.length > 1) {
      KEYS[keyCode] = delta;
    }
    return KEYS[keyCode];
  };

  var _mouseWheelDistanceMulti = 0.5;
  this.mouseWheelDistanceMulti = function(newMulti) {
    arguments.length && (_mouseWheelDistanceMulti = newMulti);
    return _mouseWheelDistanceMulti;
  };

  this.$get = function($document) {

    $desktopScroller.mouseWheelDistanceMulti = _mouseWheelDistanceMulti;
    $desktopScroller.easeTimeMulti = 0.66;
    
    function $desktopScroller(elm, scroller) {
      var self = {};

      elm.bind('$destroy', function() {
        $document.unbind('mousewheel', onMousewheel);
        $document.unbind('keydown', onKey);
      });
      $document.bind('mousewheel', onMousewheel);
      $document.bind('keydown', onKey);

      function onMousewheel(e) {
        var delta = e.wheelDeltaY * $desktopScroller.mouseWheelDistanceMulti;

        if (!delta) {
          return;
        }

        //Only go if the scroll is targeting this element
        //We are on desktop when this is called, so we are less worried about performance
        var target = jqLite(e.target);
        while (target.length) {
          if (target[0] === elm.parent()[0]) {
            scroll(delta);
            e.preventDefault();
            break;
          }
          target = target.parent();
        }
      }

      function scroll(delta) {
        scroller.calculateHeight();
        var newPos = scroller.transformer.pos.y + delta;
        scroller.transformer.setTo({y: clamp(-scroller.scrollHeight, newPos, 0)});
      }

      var INPUT_REGEX = /INPUT|TEXTAREA|SELECT/i;
      function onKey(e) {
        //Don't do key events if typing
        if (document.activeElement && document.activeElement.tagName &&
            document.activeElement.tagName.match(INPUT_REGEX)) {
          return;
        }

        var delta = KEYS[e.keyCode || e.which];
        if (delta) {
          e.preventDefault();
          if (scroller.transformer.changing) return;
          scroller.calculateHeight();

          var newPos = scroller.transformer.pos.y + delta;
          newPos = clamp(-scroller.scrollHeight, newPos, 0);

          if (newPos !== scroller.transformer.pos.y) {
            var newDelta = newPos - scroller.transformer.pos.y;
            var time = Math.abs(newDelta * $desktopScroller.easeTimeMulti);

            scroller.transformer.easeTo({y: newPos}, time);
          }
        }
      }
      return self;
    }

    function clamp(a, b, c) {
      return Math.min( Math.max(a, b), c );
    }

    return $desktopScroller;
  };
}]);


/**
 * @ngdoc object
 * @name ajoslin.scrolly.$draggerProvider
 *
 * @description
  Used for configuring drag options. 
 *
 */

angular.module('ajoslin.scrolly.dragger', [])
.provider('$dragger', [function() {

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$draggerProvider#shouldBlurOnTouch
   * @methodOf ajoslin.scrolly.$draggerProvider
   * 
   * @description
   * Sets/gets whether any active element should be blurred when the user touches and starts dragging.
   * If there is an active element and then the user does dragging, some
   * major visual problems with the position of the cursor occur. 
   *
   * Defaults to true.
   *
   * @param {boolean=} newShouldBlur Sets whether the active element should blur on touch.
   * @returns {boolean} shouldBlurOnDrag Current should blur value.
   */
  var _shouldBlurOnDrag = true;
  this.shouldBlurOnDrag = function(shouldBlur) {
    arguments.length && (_shouldBlurOnDrag = !!shouldBlur);
    return _shouldBlurOnDrag;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$draggerProvider#allowedDragAngle
   * @methodOf ajoslin.scrolly.$draggerProvider
   *
   * @description
   * Sets/gets the maximum allowed angle a user can drag from the vertical or horizontal axis
   * for a drag to be counted as a vertical or horizontal drag.
   *
   * @param {number=} newAllowedDragAngle Sets the new allowed drag angle.
   * @returns {number} allowedDragAngle Current allowed drag angle.
   */
  var _allowedDragAngle = 40;
  this.allowedDragAngle = function(newDragAngle) {
    arguments.length && (_allowedDragAngle = newDragAngle);
    return _allowedDragAngle;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$draggerProvider#maxTimeMotionless
   * @methodOf ajoslin.scrolly.$draggerProvider
   *
   * @description
   * Sets/gets the maximum time a user can be motionless, in milliseconds, before 
   * the user is counted as 'not actively dragging' anymore.
   *
   * @param {number=} newTime Sets the maximum time, milliseconds.
   * @returns {number} maxTimeMotionless The current maximum time motionless value.
   */
  var _maxTimeMotionless = 300;
  this.maxTimeMotionless = function(newMaxTimeMotionless) {
    arguments.length && (_maxTimeMotionless = newMaxTimeMotionless);
    return _maxTimeMotionless;
  };


  this.$get = ['$window', '$document', function($window, $document) {

    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$dragger#DIRECTION_VERTICAL
     * @propertyOf ajoslin.scrolly.$dragger
     *
     * @description A constant used to denote vertical (up and down) direction. Usually used when constructing a dragger and in dragger event data.
     */
    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$dragger#DIRECTION_HORIZONTAL
     * @propertyOf ajoslin.scrolly.$dragger
     *
     * @description A constant used to denote horizontal (left and right) direction. Usually used when constructing a dragger and in dragger event data.
     */
    /**
     * @ngdoc property
     * @name ajoslin.scrolly.$dragger#DIRECTION_ANY
     * @propertyOf ajoslin.scrolly.$dragger
     *
     * @description A constant used to denote any direction. Usually used when constructing a dragger and in dragger event data.
     */
    var DIRECTION_VERTICAL = $dragger.DIRECTION_VERTICAL = 1;
    var DIRECTION_HORIZONTAL = $dragger.DIRECTION_HORIZONTAL = 2;
    var DIRECTION_ANY = $dragger.DIRECTION_ANY = 3;

    /**
     * @ngdoc object
     * @name ajoslin.scrolly.$dragger
     *
     * @description
     * A factory for creating drag-listeners on elements. 
     *
     * @param {element} element Element to attach drag listeners to.
     * @param {object=} options Options object. Able to have the following properties:
     *  - **`mouse`** - {boolean=} - Whether to bind mouse events for this dragger. Default `true`.
     *  - **`touch`** - {boolean=} - Whether to bind touch events for this dragger. Default `true`.
     *  - **`stopPropagation**` - {boolean=} Whether to stop propagation of drag events. Default `false`.
     *
     * @returns {object} Newly created dragger object with the following properties:
     *
     *   - `{void}` `addListener({constant=} dragDirection, {function} callback)` - Adds a new drag listener with the specified callback. Default direction: DIRECTION_ANY.
     *   - `{void}` `removeListener({constant=} dragDirection, {function} callback)` Removes the given callback from the list of listeners. Default direction: DIRECTION_ANY.
     *   - Allowed directions are constants on $dragger: `$dragger.DIRECTION_HORIZONTAL`, `$dragger.DIRECTION_VERTICAL`, `$dragger.DIRECTION_ANY`.
     *
     * The `callback` given to addListener is called whenever a `start`, 
     * `move`, or `end` drag event happens.  An event will only be dispatched if the `dragDirection` given matches the direction of the drag, or if the `dragDirection` given is `DIRECTION_ANY`. 
     *
     * The callback given to `addListener` takes the following parameters:
     *
     *   - **`dragType`** - {string} - 'start', 'move', or 'end'.
     *   - **`dragData`** - {object} - Data pertaining to the drag event. Has the following properties:
     *
     *    * `{object}` `origin` - Where the drag started. Is a point, with number fields `x` and `y`.
     *    * `{object}` `pos` - The current position of the drag.  Is a point, with number fields `x` and `y`.
     *    * `{object}` `delta` - The change in position since the last event was fired.  Is a vector, with number fields `x`, `y`, and `magnitude`.
     *    * `{object}` `distance` - The change in position since the start of the drag. Is a vector, with number fields `x`, `y`, and `magitude`.
     *    * `{number}` `startedAt` - The timestamp of when the drag started.
     *    * `{number}` `updatedAt` - The timestamp of when the drag was last updated.
     *    * `{number}` `direction` - The direction of the drag. Could be any of the constants on $dragger: `DIRECTION_VERTICAL`, `DIRECTION_HORIZONTAL`, or `DIRECTION_ANY`. Not applicable for `start` events.
     *    * `{boolean}` `stopped` - True if the user's pointer was motionless for awhile during the drag for greater time than maxTimeMotionless, and never started moving again.  Only applicable for 'end' events.
     *
     * ### Ignoring Drag
     *
     * To make an element and all its children ignore dragging, check out the {@link ajoslin.scrolly.directive:scrollyDraggerIgnore scrollyDraggerIgnore} directive.
     *
     * ## Example
     *  <pre>
     *  var dragger = new $dragger(element, $dragger.DIRECTION_VERTICAL);
     *
     *  dragger.addListener(function(dragType, dragData) {
     *    switch(dragType) {
     *      case 'start':
     *        alert("We just started a drag at " + dragData.origin.x + ", " + dragData.origin.y + "!");
     *        break;
     *      case 'move':
     *        alert("We have moved " + dragData.delta.magnitude + " since the last move.");
     *        break;
     *      case 'end':
     *        alert("We just finished a drag, moving a total of " + dragData.distance.magnitude + "px");
     *    }
     *  });
     *  </pre>
     */

    //Creates a dragger for an element
    function $dragger(elm, options) {
      options = extend({
        mouse: true,
        touch: true,
        stopPropagation: false
      }, options);

      var self = {};
      var raw = elm[0];
      var listeners = {};
      listeners[DIRECTION_VERTICAL] = [];
      listeners[DIRECTION_HORIZONTAL] = [];
      listeners[DIRECTION_ANY] = [];

      var currentDragger = elm.data('$scrolly.dragger');
      if (currentDragger) { 
        return currentDragger;
      } else {
        elm.data('$scrolly.dragger', self);
      }

      self.state = {};

      self.addListener = function(direction, callback) {
        if (arguments.length === 1) {
          callback = direction;
          direction = DIRECTION_ANY;
        }
        listeners[direction].push(callback || noop);
      };

      self.removeListener = function(direction, callback) {
        if (arguments.length === 1) {
          callback = direction;
          direction = DIRECTION_ANY;
        }
        var callbacks = listeners[direction];
        var index = callbacks && callbacks.indexOf(callback);
        if (callbacks && index > -1) {
          callbacks.splice(index, 1);
        }
      };

      if (options.touch) {
        elm.bind('touchstart', dragStart);
        elm.bind('touchmove', dragMove);
        elm.bind('touchend touchcancel', dragEnd);
      }
      if (options.mouse) {
        elm.bind('mousedown', dragStart);
        elm.bind('mousemove', dragMove);
        elm.bind('mouseup mouseout', dragEnd);
      }

      elm.bind('$destroy', function() {
        delete listeners[DIRECTION_VERTICAL];
        delete listeners[DIRECTION_HORIZONTAL];
        delete listeners[DIRECTION_ANY];
      });

      function dragStart(e) {
        e = e.originalEvent || e; //for jquery

        var target = jqLite(e.target || e.srcElement);
        //Ignore element or parents with scrolly-drag-ignore
        if (target.controller('scrollyDraggerIgnore')) {
          return;
        }

        options.stopPropagation && e.stopPropagation();

        var point = e.touches ? e.touches[0] : e;

        //No drag on ignored elements
        //This way of doing it is taken straight from snap.js
        //Ignore this element if it's within a 'dragger-ignore' element

        //Blur stuff on scroll if the option says we should
        if (_shouldBlurOnDrag && isInput(target)) {
          document.activeElement && document.activeElement.blur();
        }

        self.state = startDragState({x: point.pageX, y: point.pageY});

        dispatchEvent('start', true);
      }
      function dragMove(e) {
        e = e.originalEvent || e; //for jquery

        if (self.state.active) {
          e.preventDefault();
          options.stopPropagation && e.stopPropagation();

          var point = e.touches ? e.touches[0] : e;
          point = {x: point.pageX, y: point.pageY};
          var timeSinceLastMove = Date.now() - self.state.updatedAt;

          //If the user moves and then stays motionless for enough time,
          //the user 'stopped'.  If he starts dragging again after stopping,
          //we pseudo-restart his drag.
          if (timeSinceLastMove > _maxTimeMotionless) {
            self.state = startDragState(point);
          }
          moveDragState(self.state, point);

          var deg = findDragDegrees(point, self.state.origin) % 180;
          if (deg < 90 + _allowedDragAngle && deg > 90 - _allowedDragAngle) {
            self.state.direction = DIRECTION_VERTICAL;
          } else if (deg < _allowedDragAngle && deg > -_allowedDragAngle) {
            self.state.direction = DIRECTION_HORIZONTAL;
          } else {
            self.state.direction = DIRECTION_ANY;
          }

          dispatchEvent('move');
        }
      }

      function dragEnd(e) {

        if (self.state.active) {
          e = e.originalEvent || e; // for jquery
          options.stopPropagation && e.stopPropagation();

          self.state.updatedAt = Date.now();
          self.state.stopped = (self.state.updatedAt - self.state.startedAt) > _maxTimeMotionless;

          dispatchEvent('end', true);
          self.state = {};
        }
      }
      
      function dispatchEvent(eventType, force) {
        var data = copy(self.state); // don't want to give them exact same data
        forEach(listeners, function(callbacks, listenerDirection) {
          /* jshint eqeqeq: false */
          if (force || !data.direction || data.direction == listenerDirection || 
              listenerDirection == DIRECTION_ANY) {
            forEach(callbacks, function(cb) {
              cb(eventType, data);
            });
          }
        });
      }

      function findDragDegrees(point2, point1) {
        var theta = Math.atan2(-(point1.y - point2.y), point1.x - point2.x);
        if (theta < 0) {
          theta += 2 * Math.PI;
        }
        var degrees = Math.floor(theta * (180 / Math.PI) - 180);
        if (degrees < 0 && degrees > -180) {
          degrees = 360 - Math.abs(degrees);
        }
        return Math.abs(degrees);
      }

      //Restarts the drag at the given position
      function startDragState(point) {
        return {
          origin: {x: point.x, y: point.y},
          pos: {x: point.x, y: point.y},
          distance: {x: 0, y: 0, magnitude: 0},
          delta: {x: 0, y: 0, magnitude: 0},

          startedAt: Date.now(),
          updatedAt: Date.now(),

          stopped: false,
          active: true
        };
      }

      function moveDragState(state, point) {
        state.delta = distanceBetween(point, state.pos);
        state.distance = distanceBetween(point, state.origin);
        state.pos = {x: point.x, y: point.y};
        state.updatedAt = Date.now();
      }
      
      function distanceBetween(p2, p1) {
        var dist = {
          x: p2.x - p1.x,
          y: p2.y - p1.y
        };
        dist.magnitude = Math.sqrt(dist.x*dist.x + dist.y*dist.y);
        return dist;
      }

      function isInput(raw) {
        return raw && (raw.tagName === "INPUT" ||
          raw.tagName === "SELECT" || 
          raw.tagName === "TEXTAREA");
      }

      return self;
    }

    return $dragger;

  }];
}]);


/**
 * @ngdoc object
 * @name ajoslin.scrolly.$scrollerProvider
 * 
 * @description
 * Used for configuring scroll options.
 */

angular.module('ajoslin.scrolly.scroller', [
  'ajoslin.scrolly.dragger',
  'ajoslin.scrolly.transformer',
  'ajoslin.scrolly.desktop'
])
.provider('$scroller', [function() {

  var _decelerationRate = 0.001;
  this.decelerationRate = function(newDecelerationRate) {
    arguments.length && (_decelerationRate = newDecelerationRate);
    return _decelerationRate;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#supportDesktop
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets whether the scroller should support desktop events (mousewheel, 
   * arrow keys, etc).  Default true.
   *
   * @param {boolean=} newSupport New value to set for desktop support.
   * @returns {boolean} support Current desktop support.
   */
  var _supportDesktop = true;
  this.supportDesktop = function(newSupport) {
    _supportDesktop = !!newSupport;
    return _supportDesktop;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#pastBoundaryScrollRate
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets the rate scrolling should go when the user goes past the boundary.
   * In other words, if the user is at the top of the list and tries to scroll up
   * some more, he will only be able to scroll at half the rate by default.  This option changes
   * that rate.
   *
   * @param {number=} newRate The new pastBoundaryScrollRate to set.
   * @returns {number} pastBoundaryScrollRate The current scroll rate.
   */
  var _pastBoundaryScrollRate = 0.5;
  this.pastBoundaryScrollRate = function(newRate) {
    arguments.length && (_pastBoundaryScrollRate = newRate);
    return _pastBoundaryScrollRate;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#minDistanceForAcceleration
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets the minimum distance the user needs to scroll for acceleration to happen when
   * he/she lifts his/her finger.
   *
   * @param {number=} newRate The new minDistanceForAcceleration to set.
   * @returns {number} minDistanceForAcceleration The current minimum scroll distance.
   */
  var _minDistanceForAcceleration = 10;
  this.minDistanceForAcceleration = function(newMinScrollDistance) {
    arguments.length && (_minDistanceForAcceleration = newMinScrollDistance);
    return _minDistanceForAcceleration;
  };

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#bounceBuffer
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets the buffer allowed for the scroll to 'bounce' past the actual
   * content area.  Set this to 0 to effectively disable bouncing.
   *
   * @param {number=} newBounceBuffer The new bounce buffer to set.
   * @returns {number} bounceBuffer The current bounce buffer.
   */
  var _bounceBuffer = 40;
  this.bounceBuffer = function(newBounceBuffer) {
    arguments.length && (_bounceBuffer = newBounceBuffer);
    return _bounceBuffer;
  };


  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#bounceBackMinTime
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * See {@link ajoslin.scrolly.$scrollerProvider#bounceBackDistanceMulti bounceBackDistanceMulti}.
   *
   * @param {number=} newTime The new bounce back minimum time to set.
   * @returns {number} bounceBackMinTime The current bounce back minimum time.
   */

  /**
   * @ngdoc method
   * @name ajoslin.scrolly.$scrollerProvider#bounceBackDistanceMulti
   * @methodOf ajoslin.scrolly.$scrollerProvider
   *
   * @description
   * When the user scrolls past the content area into the bounce buffer, 
   * we need to bounce back.  To decide how long the bounce back animation will
   * take, there are two factors: a minimum time, in milliseconds, and a 
   * distance multiplier.  
   *
   * The equation for deciding how much time the animation to bounce back to
   * the main content area should take, we do the following:
   *
   * <pre>
   * function getBounceTime(distancePastContent) {
   *   return bounceBackMinTime + distancePastContent * bounceBackDistanceMulti;
   * }
   * </pre>
   *
   * This makes it so the farther away the user has scrolled from the content
   * area, the longer the animation to bring the content back into view will
   * take. The minimum time exists so even short distances still take a little 
   * bit of time.
   *
   * @param {number=} newDistanceMulti The new bounce back distance multiplier.
   * @returns {number} bounceBackDistanceMulti The current bounce back distance multiplier.
   */

  var _bounceBackMinTime = 200;
  var _bounceBackDistanceMulti = 1.5;

  this.bounceBackMinTime = function(newBounceBackMinTime) {
    arguments.length && (_bounceBackMinTime = newBounceBackMinTime);
    return _bounceBackMinTime;
  };
  this.bounceBackDistanceMulti = function(newBounceBackDistanceMult) {
    arguments.length && (_bounceBackDistanceMulti = newBounceBackDistanceMult);
    return _bounceBackDistanceMulti;
  };

  //Quicker than Math.floor
  //http://jsperf.com/math-floor-vs-math-round-vs-parseint/69
  function floor(n) { return n | 0; }

  this.$get = ['$dragger', '$transformer', '$window', '$document', '$desktopScroller', function($dragger, $transformer, $window, $document, $desktopScroller) {

    $scroller.getContentRect = function(raw) {
      var style = window.getComputedStyle(raw);
      var offTop = parseInt(style.getPropertyValue('margin-top'), 10) +
        parseInt(style.getPropertyValue('padding-top'), 10);
      var offBottom = parseInt(style.getPropertyValue('margin-bottom'), 10) +
        parseInt(style.getPropertyValue('padding-bottom'), 10);

      var top = parseInt(style.getPropertyValue('top'), 10);
      var bottom = parseInt(style.getPropertyValue('bottom'), 10);

      var height = parseInt(style.getPropertyValue('height'), 10);
      return {
        top: offTop + (isNaN(top) ? 0 : top),
        bottom: offBottom + (isNaN(bottom) ? 0 : bottom),
        height: height
      };
    };


    function bounceTime(howMuchOut) {
      return Math.abs(howMuchOut) * _bounceBackDistanceMulti + 
        _bounceBackMinTime;
    }

    /**
     * @ngdoc object
     * @name ajoslin.scrolly.$scroller
     *
     * @description
     * A factory for creating a scroll-manipulator on an element. Once called
     * on an element, it will listen to drag events and use those to change
     * the element's transform appropriately to simulate scrolling. 
     * Intended to look as close as possible to native iOS scrolling.
     *
     * @param {element} element Element to attach scroller to.
     * @returns {object} Newly created scroller object.
     *
     */

    function $scroller(elm) {
      var self = {};
      var currentScroller = elm.data('$scrolly.scroller');
      if (currentScroller) {
        return currentScroller;
      } else {
        elm.data('$scrolly.scroller', self);
      }

      var raw = elm[0];
      var transformer = self.transformer = new $transformer(elm);
      var dragger = self.dragger = new $dragger(elm, {
        touch: true,
        mouse: false
      });
      if (_supportDesktop) {
        var desktopScroller = new $desktopScroller(elm, self);
      }
      dragger.addListener($dragger.DIRECTION_VERTICAL, dragListener);
      elm.bind('$destroy', function() {
        dragger.removeListener($dragger.DIRECTION_VERTICAL, dragListener);
      });

      self.calculateHeight = function() {
        var rect = $scroller.getContentRect(raw);
        //TODO find a better way to get the height of the wrapper/screen
        var screenHeight = $window.innerHeight;
        //If our content doesn't fill the whole area, just act like it's
        //exactly one screen tall for scrolling purposes
        if (rect.height < screenHeight) {
          self.scrollHeight = 0;
        } else {
          self.scrollHeight = rect.height - screenHeight + rect.top + rect.bottom;
        }
        return self.scrollHeight;
      };
      self.calculateHeight();

      self.outOfBounds = function(pos) {
        if (pos > 0) return pos;
        if (pos < -self.scrollHeight) return pos + self.scrollHeight;
        return false;
      };

      function dragListener(eventType, data) {
        switch(eventType) {
          case 'start':
            if (transformer.changing) {
              transformer.stop();
            }
            self.calculateHeight();
            break;

          case 'move':
            var newPos = transformer.pos.y + data.delta.y;
            //If going past boundaries, scroll at half speed
            //TODO make the 0.5 a provider option
            if ( self.outOfBounds(newPos) ) {
              newPos = transformer.pos.y + floor(data.delta.y * 0.5);
            }
            transformer.setTo({y: newPos});
            break;

          case 'end':
            //If we're out of bounds, or held on to our spot for too long,
            //no momentum.  Just check that we're in bounds.
            if (self.outOfBounds(transformer.pos.y) || data.stopped) {
              self.checkBoundaries();
            } else if (Math.abs(data.distance.y) >= _minDistanceForAcceleration) {
              var momentum = self.momentum(data);
              if (momentum.position !== transformer.pos.y) {
                transformer.easeTo(
                  {y: momentum.position},
                  momentum.time,
                  self.checkBoundaries
                );
              }
            }
            break;
        }
      }
      self.checkBoundaries = function() {
        self.calculateHeight();

        var howMuchOut = self.outOfBounds(transformer.pos.y);
        if (howMuchOut) {
          var newPosition = howMuchOut > 0 ? 0 : -self.scrollHeight;
          transformer.easeTo({y: newPosition}, bounceTime(howMuchOut));
        } 
      };
      self.momentum = function(dragData) {
        self.calculateHeight();

        var speed = Math.abs(dragData.distance.y) / (dragData.updatedAt - dragData.startedAt);
        var newPos = transformer.pos.y + (speed * speed) /
          (2 * _decelerationRate) *
          (dragData.distance.y < 0 ? -1 : 1);
        var time = speed / _decelerationRate;

        var howMuchOver = self.outOfBounds(newPos);
        var distance;
        if (howMuchOver) {
          if (howMuchOver > 0) {
            newPos = Math.min(howMuchOver, _bounceBuffer);
          } else if (howMuchOver < 0) {
            newPos = Math.max(newPos, -(self.scrollHeight + _bounceBuffer));
          }
          distance = Math.abs(newPos - transformer.pos.y);
          time = distance / speed;
        }
        return {
          position: newPos,
          time: floor(time)
        };
      };

      return self;
    }

    return $scroller;
  }];

}]);


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
     *   - `{void}` `clear()` - Clears out any transform or transition styles currently set on the element by this transformer.
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
        var style = $window.getComputedStyle(elm[0]);
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
          elm.css(transitionProp, transitionString(transitionTime));

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
        elm.css(transformProp, transformString(self.pos.x, self.pos.y));
      };

      self.clear = function() {
        elm.css(transformProp, '');
        elm.css(transitionProp, '');
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

}());