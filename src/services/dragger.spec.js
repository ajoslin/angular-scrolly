
describe('scrolly.dragger', function() {

  beforeEach(module('ajoslin.scrolly.dragger', 'ajoslin.scrolly.directives'));

  var $dragger;
  beforeEach(inject(function(_$dragger_) {
    $dragger = _$dragger_;
  }));

  describe('options', function() {
    var elm, dragSpy, d;
    function setup(opts) {
      elm = angular.element("<div>");
      d = new $dragger(elm, opts);
      dragSpy = jasmine.createSpy();
      d.addListener($dragger.DIRECTION_ANY, dragSpy);
    }
    function trigger(elm, type, options) {
      var e = $.Event(type);
      e.pageX = e.pageY = 0;
      angular.extend(e, options || {});
      $(elm[0]).trigger(e);
    }
    it('should not stop propagation by default', function() {
      setup({});
      var stopSpy = jasmine.createSpy('stop');
      trigger(elm, 'touchstart', {stopPropagation: stopSpy});
      expect(stopSpy).not.toHaveBeenCalled();
      trigger(elm, 'touchmove', {stopPropagation: stopSpy});
      expect(stopSpy).not.toHaveBeenCalled();
      trigger(elm, 'touchend', {stopPropagation: stopSpy});
      expect(stopSpy).not.toHaveBeenCalled();
    });
    it('should stop propagation with option', function() {
      setup({
        stopPropagation: true
      });
      var stopSpy = jasmine.createSpy('stop');

      trigger(elm, 'touchstart', {stopPropagation: stopSpy});
      expect(stopSpy).toHaveBeenCalled();
      stopSpy.reset();

      trigger(elm, 'touchmove', {stopPropagation: stopSpy});
      expect(stopSpy).toHaveBeenCalled();
      stopSpy.reset();

      trigger(elm, 'touchend', {stopPropagation: stopSpy});
      expect(stopSpy).toHaveBeenCalled();
    });
    it('should mouse and touch by default', function() {
      setup({});
      
      trigger(elm, 'mousedown');
      expect(dragSpy).toHaveBeenCalled();
      dragSpy.reset();

      trigger(elm, 'touchstart');
      expect(dragSpy).toHaveBeenCalled();
    });
    it('should not listen to mouse events with option', function() {
      setup({
        mouse: false
      });

      trigger(elm, 'mousedown');
      expect(dragSpy).not.toHaveBeenCalled();
      
      trigger(elm, 'touchstart');
      expect(dragSpy).toHaveBeenCalled();
    });
    it('should not listen to touch events with option', function() {
      setup({
        touch: false
      });

      trigger(elm, 'mousedown');
      expect(dragSpy).toHaveBeenCalled();
      dragSpy.reset();

      trigger(elm, 'touchstart');
      expect(dragSpy).not.toHaveBeenCalled();
    });
  });

  makeTests('DIRECTION_HORIZONTAL');
  makeTests('DIRECTION_VERTICAL');
  makeTests('DIRECTION_ANY');

  function makeTests(direction) {
    var horizontal = direction==='DIRECTION_HORIZONTAL';
    var vertical = direction==='DIRECTION_VERTICAL';
    var any = direction==='DIRECTION_ANY';

    describe(direction, function() {

      var dragSpy, eventData, eventType, nowTime;
      var elm, dragger, $dragger, dragDirection;

      beforeEach(inject(function(_$dragger_) {
        $dragger = _$dragger_;
        dragDirection = $dragger[direction];
        elm = $("<div>");
        dragger = new $dragger(elm);
      }));

      beforeEach(function() {
        dragSpy = jasmine.createSpy("drag spy").andCallFake(function(type, data) {
          eventType = type;
          eventData = data;
        });
        nowTime = 0;
        spyOn(Date, 'now').andCallFake(function() {
          return nowTime;
        });
        dragger.addListener(dragDirection, dragSpy);
      });

      function triggerDrag(type, pageX, pageY) {
        var e = $.Event(type);
        $.extend(e, { 
          target: elm,
          timeStamp: Date.now(),
        });
        e.pageX = pageX;
        e.pageY = pageY;
        elm.trigger(e);
      }

      describe('scrolly-dragger-ignore', function() {
        it('should ignore start if scrolly-dragger-ignore is on element', function() {
          triggerDrag('touchstart', 0, 0);
          expect(dragSpy).toHaveBeenCalled();

          dragSpy.reset();
          inject(function($compile, $rootScope) {
            elm.attr('scrolly-dragger-ignore', '');
            $compile(elm)($rootScope);
            $rootScope.$apply();
          });
          triggerDrag('touchstart', 0, 0);
          expect(dragSpy).not.toHaveBeenCalled();
        });

        it('should ignore start if scrolly-dragger-ignore is on parent element', inject(function($compile, $rootScope) {
          var parent = $compile('<span scrolly-dragger-ignore></span>')($rootScope);
          parent.append(elm);
          $rootScope.$apply();
          triggerDrag('touchstart', 0, 0);
          expect(dragSpy).not.toHaveBeenCalled();
        }));
      });

      it('should remove the listener', function() {
        triggerDrag('touchstart', 0, 0);
        expect(dragSpy.callCount).toBe(1);
        dragger.removeListener(dragDirection, dragSpy);
        triggerDrag('touchstart', 0, 0);
        expect(dragSpy.callCount).toBe(1);
      });

      it('should give start event with proper data', function() {
        triggerDrag('touchstart', 0, 0);
        expect(dragSpy).toHaveBeenCalled();
        expect(eventType).toBe('start');
        expect(eventData).toHaveValues({
          origin: {x: 0, y: 0},
          pos: {x: 0, y: 0},
          distance: {x: 0, y: 0, magnitude: 0},
          delta: {x: 0, y: 0, magnitude: 0},

          startedAt: nowTime,
          updatedAt: nowTime,

          stopped: false,
          active: true
        });
      });

      it('should change updatedAt on move and end', function() {
        triggerDrag('touchstart', 0, 0);
        if (any) { //45 degree drag, any only
          nowTime = 100;
          triggerDrag('touchmove', 1, 1);
          expect(eventData.updatedAt).toBe(100);
        }
        nowTime = 200;
        triggerDrag('touchend');
        expect(eventData.updatedAt).toBe(200);
      });

      it('should ignore move event if not dragging', function() {
        triggerDrag('touchmove');
        expect(dragSpy).not.toHaveBeenCalled();
      });

      it('should dispatch horizontal move event if direction is any or horizontal', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 10, 0);
        if (horizontal || any) {
          expect(eventType).toBe('move');
          expect(eventData).toHaveValues({
            origin: {x: 0, y: 0},
            pos: {x: 10, y: 0},
            delta: {x: 10, y: 0, magnitude: 10},
            direction: $dragger.DIRECTION_HORIZONTAL
          });
          expect(dragSpy.callCount).toBe(2);
        } else { 
          expect(dragSpy.callCount).toBe(1); 
        }
      });
      it('should dispatch vertical move event if direction is vertical or horizontal', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 0, 10);
        if (vertical || any) {
          expect(eventType).toBe('move');
          expect(eventData).toHaveValues({
            origin: {x: 0, y: 0},
            pos: {x: 0, y: 10},
            delta: {x: 0, y: 10, magnitude: 10},
            direction: $dragger.DIRECTION_VERTICAL
          });
          expect(dragSpy.callCount).toBe(2);
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
      });
      it('should dispatch non-vertical and non-horizontal move event if direction is any', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 5, 5); //45 degree move - not horiz or vertical
        if (any) {
          expect(eventType).toBe('move');
          expect(eventData).toHaveValues({
            origin: {x:0, y:0},
            pos: {x:5, y:5},
            delta: {x: 5, y: 5, magnitude: Math.sqrt(50)},
            direction: $dragger.DIRECTION_ANY
          });
          expect(dragSpy.callCount).toBe(2);
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
      });

      it('should change delta when moving', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 0, 10);
        if (vertical || any) {
          expect(dragSpy.callCount).toBe(2);
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
        triggerDrag('touchmove', 0, 15);
        if (vertical || any) {
          expect(eventData).toHaveValues({ 
            delta: {x:0, y: 5, magnitude: 5},
            distance: { x: 0, y: 15, magnitude: 15}
          });
          expect(dragSpy.callCount).toBe(3);
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
        triggerDrag('touchmove', 0, 9);
        if (vertical || any) {
          expect(eventData).toHaveValues({ 
            delta: {x:0, y: -6, magnitude: 6},
            distance: { x: 0, y: 9, magnitude: 9}
          });
          expect(dragSpy.callCount).toBe(4);
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
      });

      it('should give end event', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 5, 5);
        triggerDrag('touchend');
        if (any) {
          expect(eventData).toHaveValues({
            origin: {x: 0, y: 0},
            pos: {x: 5, y: 5},
            delta: {x: 5, y: 5, magnitude: Math.sqrt(25+25)},
            distance: {x: 5, y: 5, magnitude: Math.sqrt(25+25)},
            direction: $dragger.DIRECTION_ANY,
            stopped: false
          });
        }

      });

      it('should "reset" drag if you start, move at a later time, wait, then move again', function() {
        nowTime = 1000;
        triggerDrag('touchstart', 1, 1);
        triggerDrag('touchmove', 10, 0);
        if (horizontal || any) {
          expect(eventData).toHaveValues({
            origin: {x: 1, y: 1},
            pos: {x: 10, y: 0}
          });
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
        nowTime = 2000;
        triggerDrag('touchmove', 11, 0);
        if (horizontal || any) {
          expect(eventData).toHaveValues({
            origin: {x: 11, y: 0},
            pos: {x: 11, y: 0} 
          });
        } else {
          expect(dragSpy.callCount).toBe(1);
        }
      });

      it('should trigger end event', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchend');
        expect(eventType).toBe('end');
      });

      it('should trigger end event with properties', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', -100, 0);
        nowTime = 99;
        triggerDrag('touchend');
        expect(eventType).toBe('end');
        expect(eventData).toHaveValues({
          distance: {x: -100, y: 0, magnitude: 100},
          startedAt: 0,
          updatedAt: 99,
          stopped: false
        });
      });

      it('should count the drag as "stopped" if we end and haven\'t moved in awhile', function() {
        triggerDrag('touchstart', 0, 0);
        triggerDrag('touchmove', 0, 50);
        nowTime = 5000;
        triggerDrag('touchend');
        expect(eventData).toHaveValues({
          stopped: true,
          startedAt: 0,
          updatedAt: 5000
        });
      });
    });
  }
});
