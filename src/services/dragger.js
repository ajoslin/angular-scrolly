
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
        touch: true
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
        listeners[direction].push(callback || angular.noop);
      };

      self.removeListener = function(direction, callback) {
        if (arguments.length === 1) {
          callback = direction;
          direction = DIRECTION_ANY;
        }
        var index = listeners[direction].indexOf(callback);
        if (index > -1) {
          listeners[direction].splice(index, 1);
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
        delete listeners[DIRECTION_VERITCAL];
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

        e.stopPropagation();
        var point = e.touches ? e.touches[0] : e;

        //No drag on ignored elements
        //This way of doing it is taken straight from snap.js
        //Ignore this element if it's within a 'dragger-ignore' element

        //Blur stuff on scroll if the option says we should
        if (_shouldBlurOnDrag && isInput(target)) {
          document.activeElement && document.activeElement.blur();
        }

        self.state = startDragState({x: point.pageX, y: point.pageY});

        dispatchEvent('start');
      }
      function dragMove(e) {
        e = e.originalEvent || e; //for jquery

        if (self.state.active) {
          e.preventDefault();
          e.stopPropagation();

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
          e.stopPropagation();

          self.state.updatedAt = Date.now();
          self.state.stopped = (self.state.updatedAt - self.state.startedAt) > _maxTimeMotionless;

          dispatchEvent('end');
          self.state = {};
        }
      }
      
      function dispatchEvent(eventType) {
        var data = copy(self.state); // don't want to give them exact same data
        forEach(listeners, function(callbacks, listenerDirection) {
          /* jshint eqeqeq: false */
          if (!data.direction || data.direction == listenerDirection || 
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

