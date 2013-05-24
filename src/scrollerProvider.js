
/**
 * @ngdoc object
 * @name scrolly.$scrollerProvider
 * 
 * @description
 * Used for configuring scroll options.
 */

angular.module('scrolly').provider('$scroller', function() {

  /**
   * @ngdoc method
   * @name scrolly.$scrollerProvider#decelerationRate
   * @methodOf scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets the decelerationRate used in the 'momentum' effect after the user lets go from scrolling.  A higher deceleration rate means faster deceleration.  Defaults to 0.001.
   *
   * @param {number=} newRate The new decelerationRate to set.
   * @returns {number} decelerationRate The current deceleration rate.
   */

  var _decelerationRate = 0.001;
  this.decelerationRate = function(newDecelerationRate) {
    arguments.length && (_decelerationRate = newDecelerationRate);
    return _decelerationRate;
  };

  /**
   * @ngdoc method
   * @name scrolly.$scrollerProvider#bounceBuffer
   * @methodOf scrolly.$scrollerProvider
   *
   * @description
   * Sets/gets the buffer allowed for the scroll to 'bounce' past the actual content area.  Set this to 0 to effectively disable bouncing.
   *
   * @param {number=} newBounceBuffer The new bounce buffer to set.
   * @returns {number} bounceBuffer The current bounce buffer.
   */

  //Number of pixels to allow past the top or bottom of scroll: the buffer we
  //allow to 'bounce' past top/bototm
  var _bounceBuffer = 40;
  this.bounceBuffer = function(newBounceBuffer) {
    arguments.length && (_bounceBuffer = newBounceBuffer);
    return _bounceBuffer;
  };

  /**
   * @ngdoc method
   * @name scrolly.$scrollerProvider#bounceBackMinTime
   * @methodOf scrolly.$scrollerProvider
   *
   * @description
   * When the user scrolls past the content area into the bounce buffer, we need to bounce back.  To decide how long the bounce back animation will take, there are two factors: a minimum time, in milliseconds, and a distance multiplier.  
   *
   * The equation for deciding how much time the animation to bounce back to the main content area should take, we do the following:
   * <pre>
   * function getBounceTime(distancePastContent) {
   *   return bounceBackMinTime + distancePastContent * bounceBackDistanceMulti;
   * }
   * </pre>
   *
   * This makes it so the farther away the user has scrolled from the content area, the longer the animation to bring the content back into view will take. The minimum time exists so short distances still take a little bit of time.
   *
   * @param {number=} newTime The new bounce back minimum time to set.
   * @returns {number} bounceBackMinTime The current bounce back minimum time.
   */

  /**
   * @ngdoc method
   * @name scorlly.$scrollerProvider#bounceBackDistanceMulti
   * @methodOf scrolly.$scrollerProvider
   *
   * @description
   * See {@link scrolly.$scrollerProvider#bounceBackMinTime $scrollerProvider.bounceBackMinTime} for a description of what this does.
   *
   * @param {number=} newDistanceMulti The new bounce back distance multiplier.
   * @returns {number} bounceBackDistanceMulti The current bounce back distancem multiplier.
   */

  var _bounceBackMinTime = 200;
  var _bounceBackDistanceMulti = 1.5;

  this.bounceBackMinTime = function(newBounceBackMinTime) {
    arguments.length && (_bounceBackMinTime = newBounceBackMinTime);
    return _bounceBackMinTime;
  };
  this.bounceBackDistanceMulti = function(newBounceBackDistanceMult) {
    arguments.length && (_bounceBackDistanceMulti = newBounceBackDistanceMult);
    return _bounceBackDistanceMulti;
  };

  //http://stackoverflow.com/questions/10787782/full-height-of-a-html-element-div-including-border-padding-and-margin
  //Gets the height & width of the container of our element
  function getHeight(elm) {
    var style = window.getComputedStyle(elm);
    return parseInt(style.height, 10) + 
      parseInt(style['margin-bottom'], 10) +
      parseInt(style['margin-top'], 10) + 
      parseInt(style['padding-top'], 10) +
      parseInt(style['padding-bottom'], 10);
  }

  //Quicker than Math.floor
  //http://jsperf.com/math-floor-vs-math-round-vs-parseint/69
  function floor(n) { return n | 0; }

  function bounceTime(howMuchOut) {
    return Math.abs(howMuchOut) * _bounceBackDistanceMulti + 
      _bounceBackMinTime;
  }

  this.$get = function($dragger, $transformer) {

    /**
     * @ngdoc object
     * @name scrolly.$scroller
     *
     * @description
     * A factory for creating a scroll-manipulator on an element. Once called on an element, it will listen to drag events and use those to change the element's transform appropriately to simulate scrolling.  Intended to look as close as possible to native iOS scrolling.
     *
     * @param {element} element Element to attach scroller to.
     * @returns {object} Newly created scroller object.
     *
     */

    function scroller(elm) {
      var self = {};
      var raw = elm[0];

      var transformer = new $transformer(elm);
      var dragger = new $dragger(elm);

      function calculateHeight() {
        contentHeight = 0;
        for (var i=0; i < raw.children.length; i++) {
          contentHeight += getHeight(raw.children[i]);
        }
        if (contentHeight < raw.offsetHeight) {
          self.scrollHeight = 0;
        } else {
          self.scrollHeight = raw.offsetHeight - window.innerHeight;
        }
      }
      calculateHeight();

      function outOfBounds(pos) {
        if (pos > 0) return pos;
        if (pos < -self.scrollHeight) return pos + self.scrollHeight;
        return false;
      }

      function dragListener(eventType, data) {
        if (eventType === 'start') {
          if (transformer.changing) {
            transformer.stop();
          }
          calculateHeight();

        } else if (eventType === 'move') {
          var newPos = transformer.pos + data.delta;
          //If going past boundaries, scroll at half speed.
          if ( outOfBounds(newPos) ) {
            newPos = transformer.pos + floor(data.delta * 0.5);
          }
          transformer.setTo(newPos);

        } else if (eventType === 'end') {
          dragEnd(data);
        }
      }
      function onScrollDone() {
        calculateHeight();

        var howMuchOut = outOfBounds(transformer.pos);
        if (howMuchOut) {
          var newPosition = howMuchOut > 0 ? 0 : -self.scrollHeight;
          transformer.easeTo(newPosition, bounceTime(howMuchOut));
        } 
      }
      function dragEnd(data) {
        //If we're out of bounds, or held on to our spot for too long,
        //or didn't move.. no momentum.  
        if (outOfBounds(transformer.pos) || data.inactiveDrag || !data.moved) {
          onScrollDone();
        } else {
          calculateHeight();
          var momentum = calcMomentum();
          if (momentum.position !== transformer.pos) {
            transformer.easeTo(
              momentum.position,
              momentum.time,
              onScrollDone
            );
          }
        }

        function calcMomentum() {
          var time = Math.abs(data.totalDelta) / data.duration;
          var momentum = (time * time) / (2 * _decelerationRate);
          var newPosition = transformer.pos + 
            (data.totalDelta < 0 ? -1 : 1) * momentum;

          var howMuchOver = outOfBounds(newPosition);
          if (howMuchOver) {
            //If we're past our boundaries, speed up our time by how much 
            //percent of our momentum distance is over the boundary
            time *= Math.abs(howMuchOver / momentum);
            if (howMuchOver > 0) {
              newPosition = Math.min(newPosition, _bounceBuffer);
            } else if (howMuchOver < 0) {
              newPosition = Math.max(newPosition, 
                -(self.scrollHeight + _bounceBuffer));
            }
          }
          return {
            position: newPosition,
            time: floor(time / _decelerationRate)
          };
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

});
