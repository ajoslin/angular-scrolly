
angular.module('ajoslin.scrolly.desktop', [])

.factory('$desktopScroller', function($document) {

  return function $desktopScroller(elm, scroller) {

    elm.bind('$destroy', function() {
      $document.unbind('mousewheel', onMousewheel);
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

    //{keycode: amountToEase} map
    var KEYS = { 
      38: 150, //up
      40: -150, //down
      32: -600 //down
    };
    function onKey(e) {
      var delta = KEYS[e.keyCode || e.which];
      if (delta) {
        e.preventDefault();
        if (scroller.transformer.changing) return;
        scroller.calculateHeight();

        var newPos = scroller.transformer.pos + delta;
        newPos = clamp(-scroller.scrollHeight, newPos, 0);

        if (newPos !== scroller.transformer.pos) {
          var newDelta = newPos - scroller.transformer.pos;
          var time = Math.abs(delta / 1.5) * (newDelta / delta);

          scroller.transformer.easeTo(
            newPos, time
          );
        }
      }
    }
  };
  function clamp(a, b, c) {
    return Math.min( Math.max(a, b), c );
  }
});
