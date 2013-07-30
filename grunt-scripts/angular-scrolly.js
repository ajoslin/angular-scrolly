/*
 * angular-scrolly - v0.0.1 - 2013-07-30
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
]);angular.module('ajoslin.scrolly.desktop', []).factory('$desktopScroller', [
  '$document',
  function ($document) {
    return function $desktopScroller(elm, scroller) {
      elm.bind('$destroy', function () {
        $document.unbind('mousewheel', onMousewheel);
        $document.unbind('keydown', onKey);
      });
      $document.bind('mousewheel', onMousewheel);
      $document.bind('keydown', onKey);
      function onMousewheel(e) {
        var delta = e.wheelDeltaY / 2;
        scroller.calculateHeight();
        var newPos = scroller.transformer.pos + delta;
        scroller.transformer.setTo(clamp(-scroller.scrollHeight, newPos, 0));
        e.preventDefault();
      }
      var KEYS = {
          38: 150,
          40: -150,
          32: -600
        };
      function onKey(e) {
        var delta = KEYS[e.keyCode || e.which];
        if (delta) {
          e.preventDefault();
          if (scroller.transformer.changing)
            return;
          scroller.calculateHeight();
          var newPos = scroller.transformer.pos + delta;
          newPos = clamp(-scroller.scrollHeight, newPos, 0);
          if (newPos !== scroller.transformer.pos) {
            var newDelta = newPos - scroller.transformer.pos;
            var time = Math.abs(delta / 1.5) * (newDelta / delta);
            scroller.transformer.easeTo(newPos, time);
          }
        }
      }
    };
    function clamp(a, b, c) {
      return Math.min(Math.max(a, b), c);
    }
  }
]);angular.module('ajoslin.scrolly.dragger', []).provider('$dragger', function () {
  var _shouldBlurOnDrag = true;
  this.shouldBlurOnDrag = function (shouldBlur) {
    arguments.length && (_shouldBlurOnDrag = !!shouldBlur);
    return _shouldBlurOnDrag;
  };
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
    '$document',
    function ($window, $document) {
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
        elm.bind('touchstart', dragStart);
        elm.bind('touchmove', dragMove);
        elm.bind('touchend touchcancel', dragEnd);
        function restartDragState(y) {
          state.startPos = state.pos = y;
          state.startTime = Date.now();
          state.dragging = true;
        }
        function isInput(raw) {
          return raw && raw.tagName === 'INPUT' || raw.tagName === 'SELECT' || raw.tagName === 'TEXTAREA';
        }
        function dragStart(e) {
          e = e.originalEvent || e;
          var target = e.target || e.srcElement;
          var point = e.touches ? e.touches[0] : e;
          if (parentWithAttr(target, 'data-dragger-ignore')) {
            return;
          }
          if (_shouldBlurOnDrag && isInput(target)) {
            document.activeElement && document.activeElement.blur();
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
          e = e.originalEvent || e;
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
          e = e.originalEvent || e;
          if (state.dragging) {
            state.dragging = false;
            var now = Date.now();
            var duration = now - state.startTime;
            var inactiveDrag = now - state.lastMoveTime > _maxTimeMotionless;
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
      return $dragger;
    }
  ];
});angular.module('ajoslin.scrolly.scroller', [
  'ajoslin.scrolly.dragger',
  'ajoslin.scrolly.transformer',
  'ajoslin.scrolly.desktop'
]).provider('$scroller', function () {
  var _decelerationRate = 0.001;
  this.decelerationRate = function (newDecelerationRate) {
    arguments.length && (_decelerationRate = newDecelerationRate);
    return _decelerationRate;
  };
  var _supportDesktop = true;
  this.supportDesktop = function (newSupport) {
    _supportDesktop = !!newSupport;
    return _supportDesktop;
  };
  var _pastBoundaryScrollRate = 0.5;
  this.pastBoundaryScrollRate = function (newRate) {
    arguments.length && (_pastBoundaryScrollRate = newRate);
    return _pastBoundaryScrollRate;
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
  function floor(n) {
    return n | 0;
  }
  this.$get = [
    '$dragger',
    '$transformer',
    '$window',
    '$document',
    '$desktopScroller',
    function ($dragger, $transformer, $window, $document, $desktopScroller) {
      $scroller.getContentRect = function (raw) {
        var style = window.getComputedStyle(raw);
        var offTop = parseInt(style.getPropertyValue('margin-top'), 10) + parseInt(style.getPropertyValue('padding-top'), 10);
        var offBottom = parseInt(style.getPropertyValue('margin-bottom'), 10) + parseInt(style.getPropertyValue('padding-bottom'), 10);
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
        return Math.abs(howMuchOut) * _bounceBackDistanceMulti + _bounceBackMinTime;
      }
      function $scroller(elm) {
        var self = {};
        var raw = elm[0];
        var transformer = self.transformer = new $transformer(elm);
        var dragger = self.dragger = new $dragger(elm);
        if (_supportDesktop) {
          var desktopScroller = new $desktopScroller(elm, self);
        }
        self.calculateHeight = function () {
          var rect = $scroller.getContentRect(raw);
          var screenHeight = $window.innerHeight;
          if (rect.height < screenHeight) {
            self.scrollHeight = 0;
          } else {
            self.scrollHeight = rect.height - screenHeight + rect.top + rect.bottom;
          }
          return self.scrollHeight;
        };
        self.calculateHeight();
        self.outOfBounds = function (pos) {
          if (pos > 0)
            return pos;
          if (pos < -self.scrollHeight)
            return pos + self.scrollHeight;
          return false;
        };
        function dragListener(dragData) {
          switch (dragData.type) {
          case 'start':
            if (transformer.changing) {
              transformer.stop();
            }
            self.calculateHeight();
            break;
          case 'move':
            var newPos = transformer.pos + dragData.delta;
            if (self.outOfBounds(newPos)) {
              newPos = transformer.pos + floor(dragData.delta * 0.5);
            }
            transformer.setTo(newPos);
            break;
          case 'end':
            if (self.outOfBounds(transformer.pos) || dragData.inactiveDrag) {
              self.checkBoundaries();
            } else {
              var momentum = self.momentum(dragData);
              if (momentum.position !== transformer.pos) {
                transformer.easeTo(momentum.position, momentum.time, self.checkBoundaries);
              }
            }
            break;
          }
        }
        self.checkBoundaries = function () {
          self.calculateHeight();
          var howMuchOut = self.outOfBounds(transformer.pos);
          if (howMuchOut) {
            var newPosition = howMuchOut > 0 ? 0 : -self.scrollHeight;
            transformer.easeTo(newPosition, bounceTime(howMuchOut));
          }
        };
        self.momentum = function (dragData) {
          self.calculateHeight();
          var speed = Math.abs(dragData.distance) / dragData.duration;
          var newPos = transformer.pos + speed * speed / (2 * _decelerationRate) * (dragData.distance < 0 ? -1 : 1);
          var time = speed / _decelerationRate;
          var howMuchOver = self.outOfBounds(newPos);
          var distance;
          if (howMuchOver) {
            if (howMuchOver > 0) {
              newPos = Math.min(howMuchOver, _bounceBuffer);
            } else if (howMuchOver < 0) {
              newPos = Math.max(newPos, -(self.scrollHeight + _bounceBuffer));
            }
            distance = Math.abs(newPos - transformer.pos);
            time = distance / speed;
          }
          return {
            position: newPos,
            time: floor(time)
          };
        };
        dragger.addListener(dragListener);
        elm.bind('$destroy', function () {
          dragger.removeListener(dragListener);
        });
        return self;
      }
      return $scroller;
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
    '$sniffer',
    function ($window, $nextFrame, $sniffer) {
      var prefix = $sniffer.vendorPrefix;
      var transformProp = prefix ? prefix + 'Transform' : 'transform';
      var transformPropLower = prefix ? prefix.toLowerCase() + 'Transform' : 'transform';
      var transformPropDash = prefix ? '-' + prefix.toLowerCase() + '-transform' : 'transform';
      var transitionProp = prefix ? prefix + 'Transition' : 'transition';
      function transitionString(transitionTime) {
        return transformPropDash + ' ' + transitionTime + 'ms ' + timingFunction;
      }
      function transformGetterX(n) {
        return 'translate3d(' + n + 'px,0,0)';
      }
      function transformGetterY(n) {
        return 'translate3d(0,' + n + 'px,0)';
      }
      function $transformer(elm, options) {
        var self = {};
        var raw = elm[0];
        var _transformGetter;
        var _matrixIndex;
        options = options || {};
        if (options.translateX) {
          _transformGetter = transformGetterX;
          _matrixIndex = 4;
        } else {
          _transformGetter = transformGetterY;
          _matrixIndex = 5;
        }
        self.$$calcPosition = function () {
          var style = $window.getComputedStyle(raw);
          var matrix = (style[transformProp] || style[transformPropLower] || '').replace(/[^0-9-.,]/g, '').split(',');
          if (matrix.length > 1) {
            return parseInt(matrix[_matrixIndex], 10);
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
        self.easeTo = function (n, transitionTime, done) {
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
              self.setTo(n);
              transitionEndTimeout = $window.setTimeout(function () {
                self.stop();
                done && done();
              }, transitionTime);
            });
          }
        };
        self.setTo = function (n) {
          self.pos = n;
          raw.style[transformProp] = _transformGetter(n);
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