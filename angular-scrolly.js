/*
 * angular-scrolly - v0.0.5 - 2013-09-30
 * http://github.com/ajoslin/angular-scrolly
 * Created by Andy Joslin; Licensed under Public Domain
 */
angular.module('ajoslin.scrolly', [
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
]);angular.module('ajoslin.scrolly.desktop', []).provider('$desktopScroller', function () {
  var KEYS = {
      38: 150,
      40: -150,
      32: -600
    };
  this.key = function (keyCode, delta) {
    if (arguments.length > 1) {
      KEYS[keyCode] = delta;
    }
    return KEYS[keyCode];
  };
  var _mouseWheelDistanceMulti = 0.5;
  this.mouseWheelDistanceMulti = function (newMulti) {
    arguments.length && (_mouseWheelDistanceMulti = newMulti);
    return _mouseWheelDistanceMulti;
  };
  this.$get = [
    '$document',
    function ($document) {
      $desktopScroller.mouseWheelDistanceMulti = _mouseWheelDistanceMulti;
      $desktopScroller.easeTimeMulti = 0.66;
      function $desktopScroller(elm, scroller) {
        var self = {};
        elm.bind('$destroy', function () {
          $document.unbind('mousewheel', onMousewheel);
          $document.unbind('keydown', onKey);
        });
        $document.bind('mousewheel', onMousewheel);
        $document.bind('keydown', onKey);
        function onMousewheel(e) {
          var delta = e.wheelDeltaY * $desktopScroller.mouseWheelDistanceMulti;
          scroller.calculateHeight();
          var target = angular.element(e.target);
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
          var newPos = scroller.transformer.pos.y + delta;
          scroller.transformer.setTo({
            x: 0,
            y: clamp(-scroller.scrollHeight, newPos, 0)
          });
        }
        var INPUT_REGEX = /INPUT|TEXTAREA|SELECT/i;
        function onKey(e) {
          if (document.activeElement && document.activeElement.tagName && document.activeElement.tagName.match(INPUT_REGEX)) {
            return;
          }
          var delta = KEYS[e.keyCode || e.which];
          if (delta) {
            e.preventDefault();
            if (scroller.transformer.changing)
              return;
            scroller.calculateHeight();
            var newPos = scroller.transformer.pos.y + delta;
            newPos = clamp(-scroller.scrollHeight, newPos, 0);
            if (newPos !== scroller.transformer.pos.y) {
              var newDelta = newPos - scroller.transformer.pos.y;
              var time = Math.abs(newDelta * $desktopScroller.easeTimeMulti);
              scroller.transformer.easeTo({
                x: 0,
                y: newPos
              }, time);
            }
          }
        }
        return self;
      }
      function clamp(a, b, c) {
        return Math.min(Math.max(a, b), c);
      }
      return $desktopScroller;
    }
  ];
});angular.module('ajoslin.scrolly.dragger', []).provider('$dragger', function () {
  var _shouldBlurOnDrag = true;
  this.shouldBlurOnDrag = function (shouldBlur) {
    arguments.length && (_shouldBlurOnDrag = !!shouldBlur);
    return _shouldBlurOnDrag;
  };
  var _allowedDragAngle = 40;
  this.allowedDragAngle = function (newDragAngle) {
    arguments.length && (_allowedDragAngle = newDragAngle);
    return _allowedDragAngle;
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
      var DIRECTION_VERTICAL = $dragger.DIRECTION_VERTICAL = 1;
      var DIRECTION_HORIZONTAL = $dragger.DIRECTION_HORIZONTAL = 2;
      var DIRECTION_ANY = $dragger.DIRECTION_ANY = 3;
      function $dragger(elm, draggerDirection) {
        draggerDirection = draggerDirection || DIRECTION_VERTICAL;
        var self = {};
        var raw = elm[0];
        var listeners = [];
        self.state = {};
        elm.bind('touchstart', dragStart);
        elm.bind('touchmove', dragMove);
        elm.bind('touchend touchcancel', dragEnd);
        elm.bind('$destroy', function () {
          listeners.length = 0;
        });
        function dragStart(e) {
          e = e.originalEvent || e;
          e.stopPropagation();
          var target = e.target || e.srcElement;
          var point = e.touches ? e.touches[0] : e;
          if (parentWithAttr(target, 'dragger-ignore')) {
            return;
          }
          if (_shouldBlurOnDrag && isInput(target)) {
            document.activeElement && document.activeElement.blur();
          }
          self.state = startDragState({
            x: point.pageX,
            y: point.pageY
          });
          dispatchEvent('start');
        }
        function dragMove(e) {
          e = e.originalEvent || e;
          e.preventDefault();
          e.stopPropagation();
          if (self.state.active) {
            var point = e.touches ? e.touches[0] : e;
            point = {
              x: point.pageX,
              y: point.pageY
            };
            var timeSinceLastMove = Date.now() - self.state.updatedAt;
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
            if (draggerDirection === DIRECTION_ANY || draggerDirection === self.state.direction) {
              dispatchEvent('move');
            }
          }
        }
        function dragEnd(e) {
          e = e.originalEvent || e;
          e.stopPropagation();
          if (self.state.active) {
            self.state.updatedAt = Date.now();
            self.state.stopped = self.state.updatedAt - self.state.startedAt > _maxTimeMotionless;
            dispatchEvent('end');
            self.state = {};
          }
        }
        function dispatchEvent(eventType) {
          var eventData = angular.copy(self.state);
          for (var i = 0, ii = listeners.length; i < ii; i++) {
            listeners[i](eventType, eventData);
          }
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
        function startDragState(point) {
          return {
            origin: {
              x: point.x,
              y: point.y
            },
            pos: {
              x: point.x,
              y: point.y
            },
            distance: {
              x: 0,
              y: 0,
              magnitude: 0
            },
            delta: {
              x: 0,
              y: 0,
              magnitude: 0
            },
            startedAt: Date.now(),
            updatedAt: Date.now(),
            stopped: false,
            active: true
          };
        }
        function moveDragState(state, point) {
          state.delta = distanceBetween(point, state.pos);
          state.distance = distanceBetween(point, state.origin);
          state.pos = {
            x: point.x,
            y: point.y
          };
          state.updatedAt = Date.now();
        }
        function distanceBetween(p2, p1) {
          var dist = {
              x: p2.x - p1.x,
              y: p2.y - p1.y
            };
          dist.magnitude = Math.sqrt(dist.x * dist.x + dist.y * dist.y);
          return dist;
        }
        function isInput(raw) {
          return raw && (raw.tagName === 'INPUT' || raw.tagName === 'SELECT' || raw.tagName === 'TEXTAREA');
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
  var _minDistanceForAcceleration = 10;
  this.minDistanceForAcceleration = function (newMinScrollDistance) {
    arguments.length && (_minDistanceForAcceleration = newMinScrollDistance);
    return _minDistanceForAcceleration;
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
        var currentScroller = elm.data('$scrolly.scroller');
        if (currentScroller) {
          return currentScroller;
        } else {
          elm.data('$scrolly.scroller', self);
        }
        var raw = elm[0];
        var transformer = self.transformer = new $transformer(elm);
        var dragger = self.dragger = new $dragger(elm, $dragger.DIRECTION_VERTICAL);
        if (_supportDesktop) {
          var desktopScroller = new $desktopScroller(elm, self);
        }
        dragger.addListener(dragListener);
        elm.bind('$destroy', function () {
          dragger.removeListener(dragListener);
        });
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
        function dragListener(eventType, data) {
          switch (eventType) {
          case 'start':
            if (transformer.changing) {
              transformer.stop();
            }
            self.calculateHeight();
            break;
          case 'move':
            var newPos = transformer.pos.y + data.delta.y;
            if (self.outOfBounds(newPos)) {
              newPos = transformer.pos.y + floor(data.delta.y * 0.5);
            }
            transformer.setTo({
              x: 0,
              y: newPos
            });
            break;
          case 'end':
            if (self.outOfBounds(transformer.pos.y) || data.stopped) {
              self.checkBoundaries();
            } else if (Math.abs(data.distance.y) >= _minDistanceForAcceleration) {
              var momentum = self.momentum(data);
              if (momentum.position !== transformer.pos.y) {
                transformer.easeTo({
                  x: 0,
                  y: momentum.position
                }, momentum.time, self.checkBoundaries);
              }
            }
            break;
          }
        }
        self.checkBoundaries = function () {
          self.calculateHeight();
          var howMuchOut = self.outOfBounds(transformer.pos.y);
          if (howMuchOut) {
            var newPosition = howMuchOut > 0 ? 0 : -self.scrollHeight;
            transformer.easeTo({
              x: 0,
              y: newPosition
            }, bounceTime(howMuchOut));
          }
        };
        self.momentum = function (dragData) {
          self.calculateHeight();
          var speed = Math.abs(dragData.distance.y) / (dragData.updatedAt - dragData.startedAt);
          var newPos = transformer.pos.y + speed * speed / (2 * _decelerationRate) * (dragData.distance.y < 0 ? -1 : 1);
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
    '$document',
    function ($window, $nextFrame, $sniffer, $document) {
      if (!$sniffer.vendorPrefix) {
        if (angular.isString($document[0].body.style.webkitTransition)) {
          $sniffer.vendorPrefix = 'webkit';
        }
      }
      var prefix = $sniffer.vendorPrefix;
      if (prefix && prefix !== 'Moz' && prefix !== 'O') {
        prefix = prefix.substring(0, 1).toLowerCase() + prefix.substring(1);
      }
      var transformProp = prefix ? prefix + 'Transform' : 'transform';
      var transformPropDash = prefix ? '-' + prefix.toLowerCase() + '-transform' : 'transform';
      var transitionProp = prefix ? prefix + 'Transition' : 'transition';
      function transitionString(transitionTime) {
        return transformPropDash + ' ' + transitionTime + 'ms ' + timingFunction;
      }
      function transformString(x, y) {
        return 'translate3d(' + (x || 0) + 'px,' + (y || 0) + 'px,0)';
      }
      function $transformer(elm) {
        var self = {};
        var raw = elm[0];
        var currentTransformer = elm.data('$scrolly.transformer');
        if (currentTransformer) {
          return currentTransformer;
        } else {
          elm.data('$scrolly.transformer', self);
        }
        self.pos = {
          x: 0,
          y: 0
        };
        self.updatePosition = function () {
          var style = $window.getComputedStyle(raw);
          var matrix = (style[transformProp] || '').replace(/[^0-9-.,]/g, '').split(',');
          if (matrix.length > 1) {
            self.pos.x = parseInt(matrix[4], 10);
            self.pos.y = parseInt(matrix[5], 10);
          }
          return self.pos;
        };
        self.updatePosition();
        var transitionEndTimeout;
        self.stop = function (done) {
          if (transitionEndTimeout) {
            $window.clearTimeout(transitionEndTimeout);
            transitionEndTimeout = null;
          }
          raw.style[transitionProp] = 'none';
          self.updatePosition();
          self.changing = false;
          $nextFrame(function () {
            self.setTo(self.pos);
            (done || angular.noop)();
          });
        };
        self.easeTo = function (pos, transitionTime, done) {
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
              self.setTo(pos);
              transitionEndTimeout = $window.setTimeout(function () {
                self.stop();
                (done || angular.noop)();
              }, transitionTime);
            });
          }
        };
        self.setTo = function (pos) {
          self.pos.x = pos.x;
          self.pos.y = pos.y;
          raw.style[transformProp] = transformString(self.pos.x, self.pos.y);
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