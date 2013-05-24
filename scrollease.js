
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
  var _maxTimeMotionless = 300;

  this.minDistanceForDrag = function(newMinDistanceForDrag) {
    arguments.length && (_minDistanceForDrag = newMinDistanceForDrag);
    return _minDistanceForDrag;
  };

  this.maxTimeMotionless = function(newMaxTimeMotionless) {
    arguments.length && (_maxTimeMotionless = newMaxTimeMotionless);
    return _maxTimeMotionless;
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
        startTime: -1,
        //Moving
        y: -1,
        delta: -1,
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
      function restartDragState(y) {
        state.startPos = y;
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
          state.delta = point.pageY - state.pos;
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

          state.totalDelta = state.pos < state.startPos ?
            state.pos - state.startPos :
            state.startPos - state.pos;

          state.dragging = false;
          state.duration = Date.now() - state.startTime;
          state.motionlessStop = (state.duration > _maxTimeMotionless);

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
      function fallback(cb) { return setTimeout(cb, 17); };
  })();

  this.$get = function($window) {

    //Creates a translator for an element
    function translator(elm) {
      var self = {};
      var raw = elm[0];

      self.calcPosition = function() {
        var matrix = window.getComputedStyle(raw)[transformProp]
          .replace(/[^0-9-.,]/g,'').split(',');
        if (matrix.length > 1) {
          return parseInt(matrix[5], 10);
        } else {
          return 0;
        }
      };
      self.pos = self.calcPosition();

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
        self.pos = self.calcPosition();
        nextFrame(function() {
          self.setTo(self.pos);
        });
        self.changing = false;
      };
      self.easeTo = function(y, time) {
        raw.style[transitionProp] = transformPropDash + ' ' + time + 'ms ' +
          timingFunction;
        self.pos = y;
        nextFrame(function() {
          self.setTo(y);
        });
        stopTimeout = setTimeout(self.stop, self.time + 17);
      };
      self.setTo = function(y) {
        self.changing = true;
        self.pos = y;

        raw.style[transformProp] = 'translate3d(0,' + y + 'px,0)';
      };

      return self;
    }

    return translator;

  };
})

.provider('$scroller', function() {

  var _decelerationRate = 0.0006;
  //Number of pixels to allow past the top or bottom of scroll: the buffer we
  //allow to 'snap' past top/bototm
  var _snapBuffer = 40;

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
  function getHeight(elm) {
    var style = window.getComputedStyle(elm);
    return parseInt(style.height, 10) + 
      parseInt(style['margin-bottom'], 10) +
      parseInt(style['margin-top'], 10);
  }

  //Quicker than Math.floor
  //http://jsperf.com/math-floor-vs-math-round-vs-parseint/69
  function floor(n) { return n | 0; }
  function clamp(a, b, c) { return a < b ? (b < c ? b : c) : a; }

  this.$get = function($dragger, $translator) {
    function scroller(elm) {
      var self = {};
      var raw = elm[0];

      var translator = new $translator(elm);
      var dragger = new $dragger(elm);

      var scrollHeight;
      function calculateHeight() {
        scrollHeight = getHeight(raw);
      }

      function dragListener(eventType, data) {
        if (eventType == 'start') {
          if (translator.changing) {
            translator.stop();
          }
          calculateHeight();

        } else if (eventType == 'move') {
          var newPos = translator.pos + data.delta;
          if (newPos > 0 || newPos < -scrollHeight) {
            newPos = translator.pos + floor(data.delta * 0.6);
          }

          translator.setTo(newPos);

        } else if (eventType == 'end') {
          dragEnd(data);
        }
      }
      function dragEnd(data) {

        function calcMomentum() {
          var speed = Math.abs(data.totalDelta) / data.duration;
          var momentum = (speed * speed) / (2 * _decelerationRate);
          var newPosition = translator.pos + 
            (data.totalDelta < 0 ? -1 : 1) * momentum;

          newPosition = clamp(
            -(scrollHeight + _snapBuffer),
            newPosition,
            _snapBuffer
          );
          speed = floor(speed / _decelerationRate);
          return {
            position: newPosition,
            speed: speed
          };
        }

        calculateHeight();
        
        //If we stop on a spot, hold for a sec, then let go, then
        //it's a "motionless stop", and no momentum
        if (!data.motionlessStop && data.moved) {
          var momentum = calcMomentum();

          if (momentum.position != translator.pos) {
            translator.easeTo(momentum.position, momentum.speed);
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
