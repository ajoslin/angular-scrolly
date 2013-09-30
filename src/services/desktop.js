
angular.module('ajoslin.scrolly.desktop', [])

.provider('$desktopScroller', function() {

  var KEYS = { 
    38: 150, //up arrow -> up
    40: -150, //down arrow -> down
    32: -600 //spacebar -> down
  };
  this.key = function(keyCode, delta) {
    if (arguments.length > 1) {
      KEYS[keyCode] = delta;
    }
    return KEYS[keyCode];
  };

  var _mouseWheelDistanceMulti = 0.5;
  this.mouseWheelDistanceMulti = function(newMulti) {
    arguments.length && (_mouseWheelDistanceMulti = newMulti);
    return _mouseWheelDistanceMulti;
  };

  this.$get = function($document) {

    $desktopScroller.mouseWheelDistanceMulti = _mouseWheelDistanceMulti;
    $desktopScroller.easeTimeMulti = 0.66;
    
    function $desktopScroller(elm, scroller) {
      var self = {};

      elm.bind('$destroy', function() {
        $document.unbind('mousewheel', onMousewheel);
        $document.unbind('keydown', onKey);
      });
      $document.bind('mousewheel', onMousewheel);
      $document.bind('keydown', onKey);

      function onMousewheel(e) {
        var delta = e.wheelDeltaY * $desktopScroller.mouseWheelDistanceMulti;
        scroller.calculateHeight();

        //Only go if the scroll is targeting this element
        //We are on desktop when this is called, so we are less worried about performance
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
        scroller.transformer.setTo({x: 0, y: clamp(-scroller.scrollHeight, newPos, 0)});
      }

      var INPUT_REGEX = /INPUT|TEXTAREA|SELECT/i;
      function onKey(e) {
        //Don't do key events if typing
        if (document.activeElement && document.activeElement.tagName &&
            document.activeElement.tagName.match(INPUT_REGEX)) {
          return;
        }

        var delta = KEYS[e.keyCode || e.which];
        if (delta) {
          e.preventDefault();
          if (scroller.transformer.changing) return;
          scroller.calculateHeight();

          var newPos = scroller.transformer.pos.y + delta;
          newPos = clamp(-scroller.scrollHeight, newPos, 0);

          if (newPos !== scroller.transformer.pos.y) {
            var newDelta = newPos - scroller.transformer.pos.y;
            var time = Math.abs(newDelta * $desktopScroller.easeTimeMulti);

            scroller.transformer.easeTo({x: 0, y: newPos}, time);
          }
        }
      }
      return self;
    }

    function clamp(a, b, c) {
      return Math.min( Math.max(a, b), c );
    }

    return $desktopScroller;
  };
});
