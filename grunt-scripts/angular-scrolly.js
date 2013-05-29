/*
 * angular-scrolly - v0.0.1 - 2013-05-29
 * http://github.com/ajoslin/angular-scrolly
 * Created by Andy Joslin; Licensed under Public Domain
 */
angular.module('ajoslin.scrolly', [
  'ajoslin.scrolly.dragger',
  'ajoslin.scrolly.transformer',
  'ajoslin.scrolly.scroller',
  'ajoslin.scrolly.directives'
]);angular.module('ajoslin.scrolly.directives', ['ajoslin.scrolly.scroller']).directive('scrollyScroll', [
  '$scroller',
  '$document',
  function ($scroller, $document) {
    angular.element(document.body).bind('touchmove', function (e) {
      e.preventDefault();
    });
    return {
      restrict: 'A',
      link: function (scope, elm, attrs) {
        var scroller = new $scroller(elm);
      }
    };
  }
]);angular.module('ajoslin.scrolly.dragger', []).provider('$dragger', function () {
  var _minDistanceForDrag = 6;
  this.minDistanceForDrag = function (newMinDistanceForDrag) {
    arguments.length && (_minDistanceForDrag = newMinDistanceForDrag);
    return _minDistanceForDrag;
  };
  var _maxTimeMotionless = 300;
  this.maxTimeMotionless = function (newMaxTimeMotionless) {
    arguments.length && (_maxTimeMotionless = newMaxTimeMotionless);
    return _maxTimeMotionless;
  };
  function parentWithAttr(el, attr) {
    while (el.parentNode) {
      if (el.getAttribute && el.getAttribute(attr)) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }
  this.$get = [
    '$window',
    function ($window) {
      var hasTouch = 'ontouchstart' in $window;
      var events = {
          start: hasTouch ? 'touchstart' : 'mousedown',
          move: hasTouch ? 'touchmove' : 'mousemove',
          end: hasTouch ? 'touchend' : 'mouseup',
          cancel: hasTouch ? 'touchcancel' : ''
        };
      function $dragger(elm) {
        var self = {};
        var raw = elm[0];
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
          angular.forEach(listeners, function (cb) {
            cb(eventType, arg);
          });
        }
        elm.bind(events.start, dragStart);
        elm.bind(events.move, dragMove);
        elm.bind(events.end, dragEnd);
        events.cancel && elm.bind(events.cancel, dragEnd);
        if (!hasTouch) {
          elm.bind('mouseout', function mouseout(e) {
            var t = e.relatedTarget;
            if (!t) {
              dragEnd(e);
            } else {
              while (t = t.parentNode) {
                if (t === elm)
                  return;
              }
              dragEnd(e);
            }
          });
        }
        function restartDragState(y) {
          state.startPos = state.pos = y;
          state.startTime = Date.now();
          state.dragging = true;
        }
        function dragStart(e) {
          if (!hasTouch && e.button)
            return;
          var dragEl = e.target || e.srcElement;
          var point = e.touches ? e.touches[0] : e;
          if (parentWithAttr(dragEl, 'data-dragger-ignore')) {
            return;
          }
          state.moved = false;
          state.inactiveDrag = false;
          state.delta = 0;
          state.pos = 0;
          state.distance = 0;
          restartDragState(point.pageY);
          dispatchEvent({
            type: 'start',
            startPos: state.startPos,
            startTime: state.startTime
          });
        }
        function dragMove(e) {
          e.preventDefault();
          if (state.dragging) {
            var point = e.touches ? e.touches[0] : e;
            var delta = point.pageY - state.pos;
            state.delta = delta;
            state.pos = point.pageY;
            state.distance = state.pos - state.startPos;
            if (Math.abs(state.pos - state.startPos) < _minDistanceForDrag) {
              return;
            }
            state.moved = true;
            var timeSinceMove = state.lastMoveTime - state.startTime;
            if (timeSinceMove > _maxTimeMotionless) {
              restartDragState(state.pos);
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
          if (state.dragging) {
            state.dragging = false;
            var duration = Date.now() - state.startTime;
            var inactiveDrag = duration > _maxTimeMotionless;
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
        self.addListener = function (callback) {
          if (!angular.isFunction(callback)) {
            throw new Error('Expected callback to be a function, instead got \'' + typeof callback + '".');
          }
          listeners.push(callback);
        };
        self.removeListener = function (callback) {
          if (!angular.isFunction(callback)) {
            throw new Error('Expected callback to be a function, instead got \'' + typeof callback + '".');
          }
          var index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
        return self;
      }
      $dragger.events = function () {
        return events;
      };
      return $dragger;
    }
  ];
});angular.module('ajoslin.scrolly.scroller', [
  'ajoslin.scrolly.dragger',
  'ajoslin.scrolly.scroller'
]).provider('$scroller', function () {
  var _decelerationRate = 0.001;
  this.decelerationRate = function (newDecelerationRate) {
    arguments.length && (_decelerationRate = newDecelerationRate);
    return _decelerationRate;
  };
  var _bounceBuffer = 40;
  this.bounceBuffer = function (newBounceBuffer) {
    arguments.length && (_bounceBuffer = newBounceBuffer);
    return _bounceBuffer;
  };
  var _bounceBackMinTime = 200;
  var _bounceBackDistanceMulti = 1.5;
  this.bounceBackMinTime = function (newBounceBackMinTime) {
    arguments.length && (_bounceBackMinTime = newBounceBackMinTime);
    return _bounceBackMinTime;
  };
  this.bounceBackDistanceMulti = function (newBounceBackDistanceMult) {
    arguments.length && (_bounceBackDistanceMulti = newBounceBackDistanceMult);
    return _bounceBackDistanceMulti;
  };
  function getRect(elm) {
    var style = window.getComputedStyle(elm);
    var offTop = parseInt(style['margin-top'], 10) + parseInt(style['padding-top'], 10);
    var offBottom = parseInt(style['margin-bottom'], 10) + parseInt(style['padding-bottom'], 10);
    var height = parseInt(style.height, 10);
    return {
      top: offTop,
      bottom: offBottom,
      height: height
    };
  }
  function floor(n) {
    return n | 0;
  }
  function bounceTime(howMuchOut) {
    return Math.abs(howMuchOut) * _bounceBackDistanceMulti + _bounceBackMinTime;
  }
  this.$get = [
    '$dragger',
    '$transformer',
    '$window',
    function ($dragger, $transformer, $window) {
      function scroller(elm) {
        var self = {};
        var raw = elm[0];
        var transformer = new $transformer(elm);
        var dragger = new $dragger(elm);
        function calculateHeight() {
          var rect = getRect(raw);
          var screenHeight = $window.innerHeight;
          console.log(rect, screenHeight);
          if (rect.height < screenHeight) {
            self.scrollHeight = 0;
          } else {
            self.scrollHeight = rect.height - screenHeight + rect.top + rect.bottom;
          }
          return self.scrollHeight;
        }
        window.s = self;
        calculateHeight();
        function outOfBounds(pos) {
          if (pos > 0)
            return pos;
          if (pos < -self.scrollHeight)
            return pos + self.scrollHeight;
          return false;
        }
        function dragListener(dragData) {
          switch (dragData.type) {
          case 'start':
            if (transformer.changing) {
              transformer.stop();
            }
            calculateHeight();
            break;
          case 'move':
            var newPos = transformer.pos + dragData.delta;
            if (outOfBounds(newPos)) {
              newPos = transformer.pos + floor(dragData.delta * 0.5);
            }
            transformer.setTo(newPos);
            break;
          case 'end':
            if (outOfBounds(transformer.pos) || dragData.inactiveDrag) {
              checkBoundaries();
            } else {
              calculateHeight();
              var momentum = calcMomentum(dragData);
              if (momentum.position !== transformer.pos) {
                transformer.easeTo(momentum.position, momentum.time, checkBoundaries);
              }
            }
            break;
          }
        }
        function checkBoundaries() {
          calculateHeight();
          var howMuchOut = outOfBounds(transformer.pos);
          if (howMuchOut) {
            var newPosition = howMuchOut > 0 ? 0 : -self.scrollHeight;
            transformer.easeTo(newPosition, bounceTime(howMuchOut));
          }
        }
        function calcMomentum(dragData) {
          var speed = Math.abs(dragData.distance) / dragData.duration;
          var newPos = transformer.pos + speed * speed / (2 * _decelerationRate) * (dragData.distance < 0 ? -1 : 1);
          var time = speed / _decelerationRate;
          var howMuchOver = outOfBounds(newPos);
          var distance;
          if (howMuchOver) {
            if (howMuchOver > 0) {
              newPos = Math.min(howMuchOver, _bounceBuffer);
              distance = Math.abs(newPos - transformer.pos);
              time = distance / speed;
            } else if (howMuchOver < 0) {
              newPos = Math.max(newPos, -(self.scrollHeight + _bounceBuffer));
              distance = Math.abs(newPos - transformer.pos);
              time = distance / speed;
            }
          }
          return {
            position: newPos,
            time: floor(time)
          };
        }
        dragger.addListener(dragListener);
        elm.bind('$destroy', function () {
          dragger.removeListener(dragListener);
        });
        return self;
      }
      return scroller;
    }
  ];
});angular.module('ajoslin.scrolly.transformer', []).factory('$nextFrame', [
  '$window',
  function ($window) {
    return $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame || function fallback(cb) {
      return $window.setTimeout(cb, 17);
    };
  }
]).provider('$transformer', function () {
  var timingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  this.timingFunction = function (newTimingFunction) {
    arguments.length && (timingFunction = newTimingFunction);
    return timingFunction;
  };
  this.$get = [
    '$window',
    '$nextFrame',
    function ($window, $nextFrame) {
      var transformProp = 'webkitTransform';
      var transformPropDash = '-webkit-transform';
      var transitionProp = 'webkitTransition';
      function transitionString(transitionTime) {
        return transformPropDash + ' ' + transitionTime + 'ms ' + timingFunction;
      }
      function $transformer(elm) {
        var self = {};
        var raw = elm[0];
        self.$$calcPosition = function () {
          var matrix = $window.getComputedStyle(raw)[transformProp].replace(/[^0-9-.,]/g, '').split(',');
          if (matrix.length > 1) {
            return parseInt(matrix[5], 10);
          } else {
            return 0;
          }
        };
        self.pos = self.$$calcPosition();
        var transitionEndTimeout;
        self.stop = function (done) {
          if (transitionEndTimeout) {
            $window.clearTimeout(transitionEndTimeout);
            transitionEndTimeout = null;
          }
          raw.style[transitionProp] = 'none';
          self.pos = self.$$calcPosition();
          self.changing = false;
          $nextFrame(function () {
            self.setTo(self.pos);
            done && done();
          });
        };
        self.easeTo = function (y, transitionTime, done) {
          if (!angular.isNumber(transitionTime) || transitionTime < 0) {
            throw new Error('Expected a positive number for time, got \'' + transitionTime + '\'.');
          }
          if (self.changing) {
            self.stop(doTransition);
          } else {
            doTransition();
          }
          function doTransition() {
            raw.style[transitionProp] = transitionString(transitionTime);
            self.changing = true;
            $nextFrame(function () {
              self.setTo(y);
              transitionEndTimeout = $window.setTimeout(function () {
                self.stop();
                done && done();
              }, transitionTime);
            });
          }
        };
        self.setTo = function (y) {
          self.pos = y;
          raw.style[transformProp] = 'translate3d(0,' + y + 'px,0)';
        };
        return self;
      }
      $transformer.transformProp = transformProp;
      $transformer.transformPropDash = transformPropDash;
      $transformer.transitionProp = transitionProp;
      return $transformer;
    }
  ];
});