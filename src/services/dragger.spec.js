
describe('scrolly.dragger', function() {

  beforeEach(module('ajoslin.scrolly.dragger', function($draggerProvider) {
    $draggerProvider.minDistanceForDrag(6);
  }));

  makeTests({}, 'pageY', 'pageX');
  makeTests({horizontal: true}, 'pageX', 'pageY');

  function makeTests(options, primaryProp, secondaryProp) {
    describe(options.horizontal ? 'horizontal' : 'vertical', function() {

      var elm, dragger, $dragger;
      beforeEach(inject(function(_$dragger_) {
        elm = $("<div>");
        $dragger = _$dragger_;
        dragger = new $dragger(elm, options);
      }));

      it('should error if passing a non-function to addListener', function() {
        expect(function() {
          dragger.addListener('not a function');
        }).toThrow();
      });

      it('should throw an error if passing a non-function to removeListener', function() {
        expect(function() {
          dragger.removeListener('not a function');
        }).toThrow();
      });

      it('should succeed if passing a function to addListener', function() {
        dragger.addListener(function(){});
      });

      it('should succeed if passing a function to removeListener', function() {
        dragger.removeListener(function(){});
      });

      describe('with listener', function() {
        var dragSpy;
        var dragData;
        var nowTime;
        beforeEach(function() {
          dragSpy = jasmine.createSpy("drag spy").andCallFake(function(data) {
            dragData = data;
          });
          nowTime = 0;
          spyOn(Date, 'now').andCallFake(function() {
            return nowTime;
          });
          dragger.addListener(dragSpy);
        });

        function triggerDrag(type, primaryDistance, secondaryDistance) {
          var e = $.Event(type);
          $.extend(e, { 
            target: elm,
            timeStamp: Date.now(),
          });
          e[primaryProp] = primaryDistance || 0,
          e[secondaryProp] = secondaryDistance || 0,
          elm.trigger(e);
        }

        it('should remove the listener', function() {
          triggerDrag('touchstart', 0);
          expect(dragSpy.callCount).toBe(1);
          dragger.removeListener(dragSpy);
          triggerDrag('touchstart', 0);
          expect(dragSpy.callCount).toBe(1);
        });

        it('should give start event with proper data', function() {
          triggerDrag('touchstart', 0);
          expect(dragSpy).toHaveBeenCalled();
          expect(dragData).toHaveValues({
            type: 'start',
            startPos: 0,
            startTime: nowTime
          });
        });

        it('should ignore move event if not dragging', function() {
          triggerDrag('touchmove');
          expect(dragSpy).not.toHaveBeenCalled();
        });

        it('should ignore move event if distance is too small', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', 1);
          expect(dragSpy.callCount).toBe(1);
        });

        it('should cancel move event if other direction reaches distance threshold before primary direction', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', 0, 10);
          expect(dragSpy.callCount).toBe(2);
          expect(dragData).toHaveValues({ 
            type: 'end'
          });
        });

        it('should give move event for big enough distance', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', 10);
          expect(dragData).toHaveValues({
            type: 'move',
            pos: 10,
            delta: 10
          });
        });

        it('should change delta when moving', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', 10);
          triggerDrag('touchmove', 15);
          expect(dragData).toHaveValues({ delta: 5 , distance: 15 });
          triggerDrag('touchmove', 9);
          expect(dragData).toHaveValues({ delta: -6 , distance: 9 });
        });

        it('should ignore end event if not dragging', function() {
          triggerDrag('touchend');
          expect(dragSpy).not.toHaveBeenCalled();
          triggerDrag('touchmove');
          triggerDrag('touchend');
        });

        it('should "reset" drag if you start, move at a later time, wait, then move again', function() {
          nowTime = 1000;
          triggerDrag('touchstart', 0);
          nowTime = 2000;
          triggerDrag('touchmove', 10);
          expect(dragData).toHaveValues({
            startPos: 0,
            pos: 10
          });
          triggerDrag('touchmove', 10);
          expect(dragData).toHaveValues({
            startPos: 10,
            pos: 10
          });
        });

        it('should trigger end event', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchend', 0);
          expect(dragData).toHaveValues({
            type: 'end'
          });
        });

        it('should trigger end event with properties', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', -100);
          nowTime = 99;
          triggerDrag('touchend');
          expect(dragData).toHaveValues({
            type: 'end',
            distance: -100,
            duration: 99
          });
        });

        it('should count the drag as "inactive" if we end and haven\'t moved in awhile', function() {
          triggerDrag('touchstart', 0);
          triggerDrag('touchmove', 50);
          nowTime = 5000;
          triggerDrag('touchend');
          expect(dragData).toHaveValues({
            inactiveDrag: true,
            duration: 5000
          });
        });
      });
    });
  }
});
