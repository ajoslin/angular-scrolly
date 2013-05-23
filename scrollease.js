
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
  var minDistanceForDrag = 6;
  //If we move our finger, then hold motionless on a spot for this many ms,
  //we need to not give momentum when they lift their finger. We just hold
  //still there.
  var maxTimeMotionless = 300;

  this.minDistanceForDrag = function(newMinDistanceForDrag) {
    arguments.length && (minDistanceForDrag = newMinDistanceForDrag);
    return minDistanceForDrag;
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
        state.distX =  state.distY = 0;
        state.deltaX =  state.deltaY = 0;
        state.x =  state.y = 0;

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
          state.distX = state.startX - state.x;
          state.distY = state.startY - state.y;

          if (Math.abs(state.distX) < minDistanceForDrag &&
              Math.abs(state.distY) < minDistanceForDrag) {
            return;
          }

          state.moved = true;
         
          //If the user moves again after staying motionless for enough time,
          //the user 'stopped'.  If he starts dragging again after stopping,
          //we pseudo-restart his drag.
          var timeSinceMove = state.previousMoveTime - state.startTime;
          if (timeSinceMove > maxTimeMotionless) {
            restartDragState(state.x, state.y);
          }

          dispatchEvent('move', state);

          //Set the 'previous move timestamp' after we dispatch the event
          state.previousMoveTime = e.timeStamp || Date.now();
        }
      }
      function dragEnd(e) {
        if (state.dragging) {
          var point = e.touches ? e.touches[0] : e;

          state.dragging = false;
          state.duration = (e.timeStamp || Date.now()) - state.startTime;
          state.motionlessStop = (state.duration > maxTimeMotionless);

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

  var easing = 'cubic-bezier(0.33,0.66,0.66,1)';
  var speed = 1000;

  this.speed = function(newSpeed) {
    arguments.length && (speed = newSpeed);
    return speed;
  };
  this.easing = function(newEasing) {
    arguments.length && (easing = newEasing);
    return easing;
  };

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

      var doneTimeout = null;
      self.stop = function() {
        //If we are moving and we stop, we may have a transition in progress.
        //First we set our transform to what it already is (instead of changing
        //to something else) and then we remove our transform prop.
        clearTimeout(doneTimeout);
        self.updatePosition();
        self.setTo(self.x, self.y);
        raw.style[transitionProp] = '';
        self.changing = false;
        console.log('done');
      };
      self.easeTo = function(x, y, time) {
        raw.style[transitionProp] = transformPropDash + ' ' + time + 'ms ' +
          easing;
        self.x = x;
        self.y = y;
        console.log(raw.style[transitionProp]);
        setTimeout(function() {
          self.setTo(x, y);
        });
        setTimeout(self.stop, time - 1);
      };
      self.setTo = function(x, y) {
        self.changing = true;

        raw.style[transformProp] = 'translate3d(' + x + 'px,' + y + 'px,0)';
        self.x = x;
        self.y = y;
      };

      return self;
    }

    return translator;
  
  };
})

.provider('$scroller', function() {

  var disableVertical = false;
  var disableHorizontal = true;
  var decelerationRate = 0.0006;

  this.disableVertical = function(newDisableVertical) {
    arguments.length && (disableVertical = newDisableVertical);
    return disableVertical;
  };
  this.disableHorizontal = function(newDisableHorizontal) {
    arguments.length && (disableHorizontal = newDisableHorizontal);
    return disableHorizontal;
  };
  this.decelerationRate = function(newDecelerationRate) {
    arguments.length && (decelerationRate = newDecelerationRate);
    return decelerationRate;
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

  this.$get = function($dragger, $translator) {
  angular.element(document.body).bind('touchmove', function(e) {
    e.preventDefault();
  });
    function scroller(elm) {
      var self = {};
      var raw = elm[0];
      
      var translator = new $translator(elm);
      var dragger = new $dragger(elm);

      var containerBounds, scrollBounds, maxScrollX, maxScrollY;
      function calculateBounds() {
        containerBounds = getDimensions(raw);
        scrollBounds = {
          width: raw.clientWidth,
          height: raw.clientHeight
        };
        maxScrollX = containerBounds.width - scrollBounds.width;
        maxScrollY = containerBounds.height - scrollBounds.height;
      }

      function dragListener(eventType, data) {
        if (eventType == 'start') {
          if (translator.changing) {
            translator.stop();
          }
          calculateBounds();

        } else if (eventType == 'move') {
          var x = disableHorizontal ? 0 : data.deltaX;
          var y = disableVertical ? 0 : data.deltaY;
          translator.setTo(translator.x + x, translator.y + y);

        } else if (eventType == 'end') {
          dragEnd(data);
        }
      }
      function dragEnd(data) {
        //TODO if we didn't actually move, see if we need to fake a click
        //like iscroll does. http://git.io/ezT2ig
        //Really dunno why iscroll does that, but there must be a reason

        calculateBounds();
        function momentum() {
          var speed = Math.abs(data.distY) / data.duration;
          var extraDistance = (speed * speed) / (2 * decelerationRate);

          return {
            time: speed / decelerationRate,
            distance: (data.distY < 0 ? 1 : -1) * extraDistance 
          };
        }

        //If we stop on a spot, hold for a sec, then let go, then
        //it's a "motionless stop", and no momentum
        if (!data.motionlessStop) {

          var momentumX = { distance: 0, time: 0 };
          var momentumY = { distance: 0, time: 0 };
          if (!disableHorizontal && false) {
            momentumX = momentum(
              data.distX,
              data.duration,
              -translator.x,
              scrollBounds.width - containerBounds.width + translator.x,
              containerBounds.width
            );
          }
          if (!disableVertical) {
            momentumY = momentum(
              data.distY,
              data.duration,
              -translator.y,
              scrollBounds.height - containerBounds.height + translator.y,
              containerBounds.height
            );
          }

          if (momentumX.distance || momentumY.distance) {
            var newX = translator.x + momentumX.distance;
            var newY = translator.y + momentumY.distance;
            var time = Math.max(momentumX.time, momentumY.time);
            translator.easeTo(Math.round(newX), Math.round(newY), time);
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
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var scroller = new $scroller(elm);
    }
  };
});
