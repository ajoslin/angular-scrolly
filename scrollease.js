
angular.module('ui.scrollease', [])

.controller('AppCtrl', function($scope) {
  $scope.items = [];
  for (var i=0; i<50; i++) {
    $scope.items.push(i);
  }
})

.provider('$dragger', function() {

  //Taken from snap.js http://github.com/jakiestfu/snap.js
  //Returns any parent element that has an attribute, or null
  function parentWithAttr(el, attr) {
    while (el.parentNode) {
      if (el.getAttribute && el.getAttribute(attr)) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  //Minimum distance we need to go before counting a move as a scroll
  var _minDistanceForDrag = 6;
  //If we move our finger, then hold motionless on a spot for this many ms,
  //we need to not give momentum when they lift their finger. We just hold
  //still there.
  var maxTimeMotionless = 300;

  this.minDistanceForDrag = function(newMinDistanceForDrag) {
    arguments.length && (_minDistanceForDrag = newMinDistanceForDrag);
    return _minDistanceForDrag;
  };

  this.maxTimeMotionless = function(newMaxTimeMotionless) {
    arguments.length && (maxTimeMotionless = newMaxTimeMotionless);
    return maxTimeMotionless;
  };

  this.$get = function($window) {

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
        //Starting
        startY: -1,
        startX: -1,
        startTime: -1,
        //Moving
        x: -1,
        y: -1,
        deltaX: -1,
        deltaY: -1,
        previousMoveTime: -1,
        //End
        motionlessStop: false,
        //General
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
              if (t == elm) return;
            }
            dragEnd(e);
          }
        });
      }


      //Restarts the drag : makes the start be x and y, and 
      //sets the startTime.
      function restartDragState(x, y) {
        state.startX = x;
        state.startY = y;
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
        state.deltaX = state.deltaY = 0;
        state.x = state.y = 0;

        restartDragState(point.pageX, point.pageY);

        dispatchEvent('start', state);
      }
      function dragMove(e) {
        e.preventDefault();
        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;
          state.deltaX = point.pageX - state.x;
          state.deltaY = point.pageY - state.y;
          state.x = point.pageX;
          state.y = point.pageY;

          if (state.x === 0 && state.y === 0) {
            return;
          }
          if (Math.abs(state.y - state.startY) < _minDistanceForDrag &&
              Math.abs(state.x - state.startX) < _minDistanceForDrag) {
            return;
          }

          state.moved = true;

          //If the user moves again after staying motionless for enough time,
          //the user 'stopped'.  If he starts dragging again after stopping,
          //we pseudo-restart his drag.
          /*var timeSinceMove = state.previousMoveTime - state.startTime;
            if (timeSinceMove > maxTimeMotionless) {
            restartDragState(state.x, state.y);
            }*/

          dispatchEvent('move', state);

          //Set the 'previous move timestamp' after we dispatch the event
          state.previousMoveTime = e.timeStamp || Date.now();
        }
      }
      function dragEnd(e) {
        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;

          state.totalDeltaX = state.x < state.startX ?
            state.x - state.startX :
            state.startX - state.x;
          state.totalDeltaY = state.y < state.startY ?
            state.y - state.startY :
            state.startY - state.y;

          state.dragging = false;
          state.duration = Date.now() - state.startTime;
          //state.motionlessStop = (state.duration > maxTimeMotionless);

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
})

.provider('$translator', function() {
  //TODO support other vendors
  var transformProp = 'webkitTransform';
  var transformPropDash = '-webkit-transform';
  var transitionProp = 'webkitTransition';
  var transitionEndProp = transitionProp + 'End';

  var timingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
  this.timingFunction = function(newTimingFunction) {
    arguments.length && (timingFunction = newTimingFunction);
    return timingFunction;
  };

  var nextFrame = (function() {
    return window.requestAnimationFrame || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame || 
      window.oRequestAnimationFrame || 
      window.msRequestAnimationFrame || 
      function(callback) { return setTimeout(callback, 17); };
  })();

  var cancelFrame = (function () {
    return window.cancelRequestAnimationFrame || 
      window.webkitCancelAnimationFrame || 
      window.webkitCancelRequestAnimationFrame || 
      window.mozCancelRequestAnimationFrame || 
      window.oCancelRequestAnimationFrame || 
      window.msCancelRequestAnimationFrame || 
      clearTimeout;
  })();
  // shim layer with setTimeout fallback
  var requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  this.$get = function($window) {

    //Creates a translator for an element
    function translator(elm) {
      var self = {};
      var raw = elm[0];

      self.updatePosition = function() {
        var style = $window.getComputedStyle(raw);
        var matrix = style[transformProp].replace(/[^0-9-.,]/g,'').split(',');
        if (matrix.length > 1) {
          self.x = parseInt(matrix[4], 10);
          self.y = parseInt(matrix[5], 10);
        } else {
          self.x = self.y = 0;
        }
      };
      self.updatePosition();

      var stopTimeout;
      self.stop = function() {
        if (stopTimeout) {
          clearTimeout(stopTimeout);
          stopTimeout = null;
        }
        //If we are moving and we stop, we may have a transition in progress.
        //First we set our transform to what it already is (instead of changing
        //to something else) and then we remove our transform prop.
        raw.style[transitionProp] = 'none';
        self.updatePosition();
        nextFrame(function() {
          self.setTo(self.x, self.y);
        });
        self.changing = false;
      };
      self.easeTo = function(x, y, time) {
        raw.style[transitionProp] = transformPropDash + ' ' + time + 'ms ' +
          timingFunction;
        self.x = x;
        self.y = y;
        self.time = time;
        nextFrame(self.setTo);
        stopTimeout = setTimeout(self.stop, self.time + 17);
      };
      self.setTo = function(x, y) {
        self.changing = true;
        self.x = x;
        self.y = y;

        raw.style[transformProp] = 'translate3d(' + x + 'px,' + y + 'px,0)';
      };

      return self;
    }

    return translator;

  };
})

.provider('$scroller', function() {

  var _disableVertical = false;
  var _disableHorizontal = true;
  var _decelerationRate = 0.0006;
  //Number of pixels to allow past the top or bottom of scroll: the buffer we
  //allow to 'snap' past top/bototm
  var _snapBuffer = 40;

  this.disableVertical = function(newDisableVertical) {
    arguments.length && (_disableVertical = newDisableVertical);
    return _disableVertical;
  };
  this.disableHorizontal = function(newDisableHorizontal) {
    arguments.length && (_disableHorizontal = newDisableHorizontal);
    return _disableHorizontal;
  };
  this.decelerationRate = function(newDecelerationRate) {
    arguments.length && (_decelerationRate = newDecelerationRate);
    return _decelerationRate;
  };
  this.snapBuffer = function(newSnapBuffer) {
    arguments.length && (_snapBuffer = newSnapBuffer);
    return _snapBuffer;
  };

  //http://stackoverflow.com/questions/10787782/full-height-of-a-html-element-div-including-border-padding-and-margin
  //Gets the height & width of the container of our element
  function getDimensions(elm) {
    var style = window.getComputedStyle(elm);

    var height = parseInt(style.height, 10) + 
      parseInt(style['margin-bottom'], 10) +
      parseInt(style['margin-top'], 10);
    var width = parseInt(style.width, 10) +
      parseInt(style['margin-left'], 10) + 
      parseInt(style['margin-right'], 10);

    return {
      width: width,
      height: height
    };
  }

  //Quicker than Math.floor
  //http://jsperf.com/math-floor-vs-math-round-vs-parseint/69
  function floor(n) { return n | 0; }

  function clamp(a, b, c) { return a < b ? (b < c ? b : c) : a; }


  var momentum = window.m = function momentum(options) {
    var dragDistance = options.dragDistance;
    var dragDuration = options.dragDuration;
    var maxScroll = options.maxScroll;
    var position = options.position;

    var speed = Math.abs(dragDistance) / dragDuration;
    var momentumDelta = (speed * speed) / (2 * _decelerationRate);
    var newPosition = position + (dragDistance < 0 ? -1 : 1) * momentumDelta;

    newPosition = clamp(-(maxScroll + _snapBuffer), newPosition, _snapBuffer);
    speed = floor(speed / _decelerationRate);
    return {
      position: newPosition,
      speed: speed
    };
  };

  this.$get = function($dragger, $translator) {
    function scroller(elm) {
      var self = {};
      var raw = elm[0];

      var translator = new $translator(elm);
      var dragger = new $dragger(elm);

      var containerBounds;
      function calculateBounds() {
        containerBounds = getDimensions(raw);
      }

      function dragListener(eventType, data) {
        if (eventType == 'start') {
          if (translator.changing) {
            translator.stop();
          }
          calculateBounds();

        } else if (eventType == 'move') {
          var dx = _disableHorizontal ? 0 : data.deltaX;
          var dy = _disableVertical ? 0 : data.deltaY;

          var newX = translator.x + dx;
          var newY = translator.y + dy;
          /*
             if (newX > 0 || newX < -containerBounds.width) {
             newX = translator.x + floor(dx * 0.6);
             }
             if (newY > 0 || newY < -containerBounds.height) {
             newY = translator.y + floor(dy * 0.6);
             }*/

          translator.setTo(newX, newY);

        } else if (eventType == 'end') {
          dragEnd(data);
        }
      }
      function dragEnd(data) {
        //TODO if we didn't actually move, see if we need to fake a click
        //like iscroll does. http://git.io/ezT2ig
        //Really dunno why iscroll does that, but there must be a reason

        calculateBounds();
        //If we stop on a spot, hold for a sec, then let go, then
        //it's a "motionless stop", and no momentum
        if (true) {
          var momentumX = { position: translator.x, speed: 0 };
          var momentumY = { position: translator.y, speed: 0 };
          if (!_disableHorizontal) {
          }
          if (!_disableVertical) {
            momentumY = momentum({
              dragDistance: data.totalDeltaY,
              dragDuration: data.duration,
              top: 0,
              bottom: containerBounds.height,
              position: translator.y
            });
          }

          if (momentumX.position != translator.x || 
              momentumY.position != translator.y) {
            translator.easeTo(
              floor(momentumX.position), 
            floor(momentumY.position),
            Math.max(momentumX.speed, momentumY.speed)
            );
          }
        }
      }
      dragger.addListener(dragListener);
      elm.bind('$destroy', function() {
        dragger.removeListener(dragListener);
      });


      return self;
    }

    return scroller;
  };

})

.directive('uiScrollease', function($scroller, $document) {
  angular.element(document.body).bind('touchmove', function(e) {
    e.preventDefault();
  });
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var scroller = new $scroller(elm);
    }
  };
});
