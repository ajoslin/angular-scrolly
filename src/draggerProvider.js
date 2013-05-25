
/**
 * @ngdoc object
 * @name scrolly.$draggerProvider
 *
 * @description
 * Used for configuring drag options. 
 *
 */

angular.module('scrolly').provider('$dragger', function() {

  //Returns any parent element that has an attribute, or null
  //The main way we use this is to look if any parent of the 
  //touched element has a 'data-dragger-ignore' attribute,
  //and if so ignore it
  //Idea taken from snap.js http://github.com/jakiestfu/snap.js
  function parentWithAttr(el, attr) {
    while (el.parentNode) {
      if (el.getAttribute && el.getAttribute(attr)) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  /**
   * @ngdoc method
   * @name scrolly.$draggerProvider#minDistanceForDrag
   * @methodOf scrolly.$draggerProvider
   *
   * @description
   * Sets/gets the minimum distance the user needs to move his finger before
   * it is counted as a drag.
   *
   * @param {number=} newDistance Sets the minimum distance value.
   * @returns {number} minDistanceForDrag Current minimum distance value.
   */
  var _minDistanceForDrag = 6;
  this.minDistanceForDrag = function(newMinDistanceForDrag) {
    arguments.length && (_minDistanceForDrag = newMinDistanceForDrag);
    return _minDistanceForDrag;
  };

  /**
   * @ngdoc method
   * @name scrolly.$draggerProvider#maxTimeMotionless
   * @methodOf scrolly.$draggerProvider
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

  this.$get = function($window) {

    /**
     * @ngdoc object
     * @name scrolly.$dragger
     *
     * @description
     * A factory for creating drag-listeners on elements. It only cares about vertical drag, usually used for scrolling.
     *
     * @param {element} element Element to attach drag listeners to.
     * @returns {object} Newly created dragger object with the following methods:
     *
     *   - `{void}` `addListener({function} callback)` - Adds a new drag listener with the specified callback. 
     *   - `{void}` `removeListener({function} callback)` Removes the given callback from the list of listeners.
     *
     * The `callback` given to addListener is called whenever a `start`, `move`, or `end` drag event happens.  It takes the following parameters:
     *
     *   - **`eventType`** - {string} - The drag eventType.  It will be `start`, `move`, or `end`.
     *   - **`dragData`** - {object} - Data having to do with the drag, abstracted to be more useful data than plain DOM events. See below for the format of the data.
     *    
     * ### Drag Data
     *
     * The callbacks given to `addListener` take a `dragData` parameter, with the following format:
     *
     *   - `{number}` `startPos` - The position on the page where the drag started.
     *   - `{number}` `startTime` - The timestamp of when the drag started.
     *   - `{number}` `pos` - The current position of the drag on the page.
     *   - `{number}` `delta` - The change in position since the last `move` event.
     *   - `{number}` `previousMoveTime` - The timestamp of the previous `move` event.
     *   - `{boolean}` `inactiveDrag` - Whether the user held his finger still for longer than the {@link scrolly.$draggerProvider#maxTimeMotionless maximum allowed time}.
     *   - `{boolean}` `dragging` - Whether the user is currently dragging or not.
     *
     * ### Ignoring Drag
     *
     * To make an element and all its children ignore dragging, add the `data-dragger-ignore` attribute to the element, like so:
     * <pre>
     *   <div data-dragger-ignore>
     *     <button>Drag on me, it won't count!</button>
     *   </div>
     * </pre>
     *
     * ## Example
     *  <pre>
     *  var dragger = new $dragger(element);
     *
     *  dragger.addListener(function(eventType, dragData) {
     *    if (eventType == "start") {
     *      alert("We just started at " + dragData.startPos);
     *    } else if (eventType == "move") {
     *      alert("We just moved " + dragData.delta + " more pixels.");
     *    } else if (eventType == "end") {
     *      alert("drag is over!");
     *    }
     *  });
     *  </pre>
     */

    var hasTouch = 'ontouchstart' in $window;
    var event = {
      start: hasTouch ? 'touchstart' : 'mousedown',
      move: hasTouch ? 'touchmove' : 'mousemove',
      end: hasTouch ? 'touchend' : 'mouseup',
      cancel: hasTouch ? 'touchcancel' : 'mouseup'
    };

    //Creates a dragger for an element
    function dragger(elm) {
      var self = {};
      var raw = elm[0];

      var state = {
        startPos: -1,
        startTime: -1,
        pos: -1,
        delta: -1,
        previousMoveTime: -1,
        inactiveDrag: false,
        dragging: false
      };
      var listeners = [];

      function dispatchEvent(eventType, arg) {
        angular.forEach(listeners, function(cb) {
          cb(eventType, arg);
        });
      }

      elm.bind(event.start, dragStart);
      elm.bind(event.move, dragMove);
      elm.bind(event.end, dragEnd);
      elm.bind(event.cancel, dragEnd);
      if (!hasTouch) {
        elm.bind('mouseout', function mouseout(e) {
          var t = e.relatedTarget;
          if (!t) { 
            dragEnd(e);
          } else {
            while ( (t = t.parentNode) ) {
              if (t === elm) return;
            }
            dragEnd(e);
          }
        });
      }


      //Restarts the drag : makes the start be x and y, and 
      //sets the startTime.
      function restartDragState(y) {
        state.startPos = state.pos = y;
        state.startTime = Date.now();
        state.dragging = true;
      }

      function dragStart(e) {
        //Only left click drag for scroll
        if (!hasTouch && e.button !== 0) return;

        var dragEl = e.target || e.srcElement;
        var point = e.touches ? e.touches[0] : e;

        //No drag on ignored elements
        //This way of doing it is taken straight from snap.js
        //Ignore this element if it's within a 'data-dragger-ignore' element
        if ( parentWithAttr(dragEl, 'data-dragger-ignore') ) {
          return;
        }

        state.moved = false;
        state.motionlessStop = false;
        state.delta = 0;
        state.pos = 0;

        restartDragState(point.pageY);

        dispatchEvent('start', state);
      }
      function dragMove(e) {
        e.preventDefault();
        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;
          var delta = point.pageY - state.pos;

          state.delta = delta;
          state.pos = point.pageY;

          if (Math.abs(state.pos - state.startPos) < _minDistanceForDrag) {
            return;
          }

          state.moved = true;

          //If the user moves again after staying motionless for enough time,
          //the user 'stopped'.  If he starts dragging again after stopping,
          //we pseudo-restart his drag.
          var timeSinceMove = state.previousMoveTime - state.startTime;
          if (timeSinceMove > _maxTimeMotionless) {
            restartDragState(state.pos);
          }

          dispatchEvent('move', state);

          //Set the 'previous move timestamp' after we dispatch the event
          state.previousMoveTime = e.timeStamp || Date.now();
        }
      }
      function dragEnd(e) {
        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;

          state.totalDelta = state.pos - state.startPos;

          state.dragging = false;
          state.duration = Date.now() - state.startTime;

          state.inactiveDrag = (state.duration > _maxTimeMotionless);

          dispatchEvent('end', state);
        }
      }

      self.addListener = function(callback) {
        listeners.push(callback);
      };
      self.removeListener = function(callback) {
        var index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };

      return self;
    }

    return dragger;

  };
});

