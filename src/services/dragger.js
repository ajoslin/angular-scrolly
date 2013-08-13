
/**
 * @ngdoc object
 * @name ajoslin.scrolly.$draggerProvider
 *
 * @description
  Used for configuring drag options. 
 *
 */

angular.module('ajoslin.scrolly.dragger', [])
.provider('$dragger', function() {

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
   * @name ajoslin.scrolly.$draggerProvider#minDistanceForDrag
   * @methodOf ajoslin.scrolly.$draggerProvider
   *
   * @description
   * Sets/gets the minimum distance the user needs to move his finger before
   * it is counted as a drag.
   *
   * If the user drags his finger greater than this distance in the other direction
   * before dragging this distance in the main direction, the drag will be cancelled.
   *
   * In other words, if the drag is set to vertical and the user moves horizontal at
   * this distance before moving vertical this distance, the drag will be aborted.
   *
   * @param {number=} newDistance Sets the minimum distance value.
   * @returns {number} minDistanceForDrag Current minimum distance value.
   */
  var _minDistanceForDrag = 8;
  this.minDistanceForDrag = function(newMinDistanceForDrag) {
    arguments.length && (_minDistanceForDrag = newMinDistanceForDrag);
    return _minDistanceForDrag;
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

  //Returns any parent element that has an attribute, or null
  //Taken from snap.js http://github.com/jakiestfu/snap.js
  function parentWithAttr(el, attr) {
    while (el.parentNode) {
      if (el.getAttribute && el.getAttribute(attr)) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  this.$get = function($window, $document) {

    /**
     * @ngdoc object
     * @name ajoslin.scrolly.$dragger
     *
     * @description
     * A factory for creating drag-listeners on elements. It only cares about
     * vertical drag, usually used for scrolling.
     *
     * @param {element} element Element to attach drag listeners to.
     * @returns {object} Newly created dragger object with the following methods:
     *
     *   - `{void}` `addListener({function} callback)` - Adds a new drag 
     *   listener with the specified callback. 
     *   - `{void}` `removeListener({function} callback)` Removes the given
     *   callback from the list of listeners.
     *
     * The `callback` given to addListener is called whenever a `start`, 
     * `move`, or `end` drag event happens.  It takes the following parameter:
     *
     *   - **`dragData`** - {object} - Data having to do with the drag, 
     *   abstracted to be more useful data than plain DOM events. See below 
     *   for the format of the data.
     *    
     * ### Drag Data
     *
     * The callbacks given to `addListener` take a `dragData` parameter, with
     * the following properties for each event:
     *
     *   - `{string}` `type` - The type of drag event being emitted.  This will
     *   be "start", "move", or "end".
     *
     * **Given for `start`, `move`, and `end` events:**
     *
     *   - `{number}` `startPos` - The position on the page where the drag started.
     *   - `{number}` `startTime` - The timestamp of when the drag started.
     *
     * **Given for only `move` and `end` events:**
     *
     *   - `{number}` `pos` - The current position of the drag on the page.
     *   - `{number}` `delta` - The change in position since the last `move` event.
     *   - `{number}` `distance` - The total distance the drag has moved.
     *
     * **Given for only `end` events:**
     * 
     *   - `{boolean}` `inactiveDrag` - Whether the user held his finger still 
     *   for longer than the {@link ajoslin.scrolly.$draggerProvider#maxTimeMotionless maximum allowed time}.
     *   - `{number}` `duration` - The total time the drag lasted.
     *
     * ### Ignoring Drag
     *
     * To make an element and all its children ignore dragging, add the `dragger-ignore` attribute to the element, like so:
     * <pre>
     *   <div dragger-ignore>
     *     <button>Drag on me, it won't count!</button>
     *   </div>
     * </pre>
     *
     * ## Example
     *  <pre>
     *  var dragger = new $dragger(element);
     *
     *  dragger.addListener(function(dragData) {
     *    switch(dragData.type) {
     *      case 'start':
     *        alert("We just started a drag at " + dragData.startPos + "px");
     *        break;
     *      case 'move':
     *        alert("We have moved " + dragData.delta + " since the last move.");
     *        break;
     *      case 'end':
     *        alert("We just finished a drag, moving a total of " + dragData.distance + "px");
     *    }
     *  });
     *  </pre>
     */
    
    function getX(point) {
      return point.pageX;
    }
    function getY(point) {
      return point.pageY;
    }

    //Creates a dragger for an element
    function $dragger(elm, options) {
      var self = {};
      var raw = elm[0];
      var getPos, getOtherPos;

      options = options || {};
      if (options.horizontal) {
        getPos = getX;
        getOtherPos = getY;
      } else {
        getPos = getY;
        getOtherPos = getX;
      }
 
      var state = {
        startPos: 0,
        startTime: 0,
        pos: 0,
        delta: 0,
        distance: 0,
        lastMoveTime: 0,
        inactiveDrag: false,
        dragging: false
      };
      var listeners = [];

      function dispatchEvent(eventType, arg) {
        angular.forEach(listeners, function(cb) {
          cb(eventType, arg);
        });
      }

      elm.bind('touchstart', dragStart);
      elm.bind('touchmove', dragMove);
      elm.bind('touchend touchcancel', dragEnd);

      //Restarts the drag at the given position
      function restartDragState(point) {
        state.startPos = state.pos = getPos(point);
        state.otherStartPos = state.otherPos = getOtherPos(point);
        state.startTime = Date.now();
        state.dragging = true;
      }

      function isInput(raw) {
        return raw && (raw.tagName === "INPUT" ||
          raw.tagName === "SELECT" || 
          raw.tagName === "TEXTAREA");
      }

      function dragStart(e) {
        e = e.originalEvent || e; //for jquery
        e.stopPropagation();

        var target = e.target || e.srcElement;
        var point = e.touches ? e.touches[0] : e;

        //No drag on ignored elements
        //This way of doing it is taken straight from snap.js
        //Ignore this element if it's within a 'dragger-ignore' element
        if ( parentWithAttr(target, 'dragger-ignore') ) {
          return;
        }

        //Blur stuff on scroll if the option says we should
        if (_shouldBlurOnDrag && isInput(target)) {
          document.activeElement && document.activeElement.blur();
        }

        state.moved = false;
        state.inactiveDrag = false;
        state.delta = 0;
        state.pos = 0;
        state.distance = 0;

        restartDragState(point);

        dispatchEvent({
          type: 'start',
          startPos: state.startPos,
          startTime: state.startTime
        });
      }
      function dragMove(e) {
        e = e.originalEvent || e; //for jquery
        e.preventDefault();
        e.stopPropagation();

        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;
          var delta = getPos(point) - state.pos;

          state.delta = delta;
          state.pos = getPos(point);
          state.otherPos = getOtherPos(point);
          state.distance = state.pos - state.startPos;
          state.otherDistance = state.otherPos - state.otherStartPos;

          if (!state.moved) {
            //if we go far enough in other direction, let's cancel it
            if (Math.abs(state.otherDistance) > _minDistanceForDrag) {
              return dragEnd(e);
            } else if (Math.abs(state.distance) > _minDistanceForDrag) {
              state.moved = true;
            } else {
              return;
            }
          }

          //If the user moves and then stays motionless for enough time,
          //the user 'stopped'.  If he starts dragging again after stopping,
          //we pseudo-restart his drag.
          var timeSinceMove = state.lastMoveTime - state.startTime;
          if (timeSinceMove > _maxTimeMotionless) {
            restartDragState(point);
          }
          state.lastMoveTime = e.timeStamp || Date.now();

          dispatchEvent({
            type: 'move',
            startPos: state.startPos,
            startTime: state.startTime,
            pos: state.pos,
            delta: state.delta,
            distance: state.distance
          });
        }
      }
      function dragEnd(e) {
        e = e.originalEvent || e; // for jquery
        e.stopPropagation();

        if (state.dragging) {
          state.dragging = false;

          var now = Date.now();
          var duration = now - state.startTime;
          var inactiveDrag = ((now - state.lastMoveTime) > _maxTimeMotionless);

          dispatchEvent({
            type: 'end',
            startPos: state.startPos,
            startTime: state.startTime,
            pos: state.pos,
            delta: state.delta,
            distance: state.distance,
            duration: duration,
            inactiveDrag: inactiveDrag
          });
        }
      }

      self.addListener = function(callback) {
        if ( !angular.isFunction(callback) ) {
          throw new Error("Expected callback to be a function, instead got '" +
            typeof callback + '".');
        }

        listeners.push(callback);
      };
      self.removeListener = function(callback) {
        if ( !angular.isFunction(callback) ) {
          throw new Error("Expected callback to be a function, instead got '" +
            typeof callback + '".');
        }
        var index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };

      return self;
    }

    return $dragger;

  };
});

