
angular.module('ui.scrollease', [])

.controller('AppCtrl', function($scope) {
  $scope.items = [];
  for (var i=0; i<100; i++) {
    $scope.items.push(i);
  }
})

.provider('scrollease', function() {

  this.options = function(opts) {
    if (opts) {
      options = angular.extend(options, opts);
    }
    return options;
  };

  this.$get = function($q) {
    var scrollease = {};
    
    scrollease.options = function() {
      return options;
    };

    return scrollease;
  };
})

.provider('dragger', function() {

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

  //Taken from snap.js http://github.com/jakiestfu/snap.js
  function angleOfDrag(startX, startY, x, y) {
    var degrees, theta;
    //Calc theta
    theta = Math.atan2( -(startY - y), (startX - x) );
    if (theta < 0) {
      theta += 2 * Math.PI;
    }
    //Calc degrees
    degrees = Math.floor(theta * (180 / Math.PI) - 180);
    if (degrees < 0 && degrees > -180) {
      degerees = 360 - Math.abs(degrees);
    }
    return Math.abs(degrees);
  }

  this.$get = function($window) {

    var hasTouch = 'ontouchstart' in $window;
    var event = {
      start: hasTouch ? 'touchstart' : 'mousedown',
      move: hasTouch ? 'toouchmove' : 'mousemove',
      end: hasTouch ? 'touchend' : 'mouseup',
      cancel: hasTouch ? 'touchcancel' : 'mouseup'
    };

    //Creates a dragger for an element
    function draggerFactory(elm) {
      var self = {};
      var raw = elm[0];

      var state = {
        startY: -1,
        startX: -1,
        dragging: false
      };
      var listeners = [];

      function dispatchEvent(eventType, arg) {
        angular.forEach(listeners, function(cb) {
          cb(eventType, arg);
        });
      }

      elm.bind(event.start, starting);
      elm.bind(event.move, dragging);
      elm.bind(event.end + ' ' + event.cancel, stopping);

      function starting(e) {
        var dragEl = e.target || e.srcElement;

        //No drag on ignored elements
        //This way of doing it is taken straight from snap.js
        //Ignore this element if it's within a 'data-scrollease-ignore' element
        if ( parentWithAttr(dragEl, 'data-scrollease-ignore') ) {
          return;
        }

        state.startY = (e.touches && e.touches[0] || e).pageY;
        state.startX = (e.touches && e.touches[0] || e).pageX;

        dispatchEvent('start', {
          y: state.startY
        });

        state.dragging = true;
      }
      function dragging(e) {
        if (state.dragging) {
          var pageY = (e.touches && e.touches[0] || e).pageY;
          var pageX = (e.touches && e.touches[0] || e).pageX;
          var deltaY = state.startY - pageY;
        }
      }
      function stopping(e) {
      }

      self.addListener = function(callback) {
        listeners.push(callback);
      };
      self.removeListenter = function(callback) {
        var index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };

      return self;
    }

    return draggerFactory;

  };
})

.provider('translator', function() {
  //TODO support other vendors
  var transformProp = 'webkitTransform';
  var transformPropDash = '-webkit-transform';
  var transitionProp = 'webkitTransition';

  var easing = "ease-in-out";
  var speed = 1000;

  this.speed = function(newSpeed) {
    arguments.length && (speed = newSpeed);
    return speed;
  };
  this.easing = function(newEasing) {
    arguments.length && (easing = newEasing);
    return easing;
  };

  this.$get = function() {

    //Creates a translator for an element
    function translatorFactory(elm) {
      var self = {};
      var raw = elm[0];

      var state = {
        current: 0,
        target: 0,
        changing: false
      };

      self.state = function() {
        return state;
      };
      self.get = function() {
        var style = window.getComputedStyle(raw);
        var matrix = style[transformProp].match(/\((.*)\)/);
        if (matrix) {
          matrix = matrix[1].split(',');
          return parseInt(matrix[4], 10);
        }
      };
      self.stop = function() {
        raw.style[transformProp] = '';
        state.current = sef.get();
        state.changing = false;
      };
      self.easeTo = function(n) {
        raw.style[transitionProp] = transformPropDash + ' ' + speed + ' ' +
          easing;
        self.setTo(n);
      };
      self.setTo = function(n) {
        state.changing = true;
        state.target = n;

        raw.style[transformProp] = 'translate3d(0, ' + n + 'px, 0)';
      };

      return self;
    }

    return translatorFactory;
  
  };
})

.directive('uiScrollease', function(scrollease, translator) {

  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      window.t = translator(elm);
    }
  };
});
