
describe('scrolly.dragger', function() {
  
  beforeEach(module('ajoslin.scrolly.dragger'));

  var elm, dragger, $dragger;
  beforeEach(inject(function(_$dragger_) {
    elm = $("<div>");
    $dragger = _$dragger_;
    dragger = new $dragger(elm);
  }));

  it('should expose $dragger service as a function', function() {
    expect(typeof $dragger).toBe('function');
  });

  it('should create a dragger object from the element', function() {
    expect(typeof dragger).toBe('object');
  });

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

  it('should expost events getter', function() {
    expect(typeof $dragger.events).toBe('function');
    expect(typeof $dragger.events()).toBe('object');
  });

  describe('added listener', function() {
    var dragSpy;
    var events;
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
      events = $dragger.events();
    });

    function triggerDrag(type, data) {
      var e = $.Event(events[type]);
      $.extend(e, { 
        target: elm,
        timeStamp: Date.now()
      }, data);
      elm.trigger(e);
    }

    it('should remove the listener', function() {
      triggerDrag('start', {pageY:0});
      expect(dragSpy.callCount).toBe(1);
      dragger.removeListener(dragSpy);
      triggerDrag('start', {pageY:0});
      expect(dragSpy.callCount).toBe(1);
    });

    it('should give start event with proper data', function() {
      triggerDrag('start', { pageY: 0 });
      expect(dragSpy).toHaveBeenCalled();
      expect(dragData).toHaveValues({
        type: 'start',
        startPos: 0,
        startTime: nowTime
      });
    });

    it('should ignore move event if not dragging', function() {
      triggerDrag('move');
      expect(dragSpy).not.toHaveBeenCalled();
    });

    it('should ignore move event if distance is too small', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('move', { pageY: 1 });
      expect(dragSpy.callCount).toBe(1);
    });

    it('should give move event for big enough distance', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('move', { pageY: 10 });
      expect(dragData).toHaveValues({
        type: 'move',
        pos: 10,
        delta: 10
      });
    });

    it('should change delta when moving', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('move', { pageY: 10 });
      triggerDrag('move', { pageY: 15 });
      expect(dragData).toHaveValues({ delta: 5 , distance: 15 });
      triggerDrag('move', { pageY: 9 });
      expect(dragData).toHaveValues({ delta: -6 , distance: 9 });
    });

    it('should ignore end event if not dragging', function() {
      triggerDrag('end');
      expect(dragSpy).not.toHaveBeenCalled();
      triggerDrag('move');
      triggerDrag('end');
    });

    it('should "reset" drag if you start, move at a later time, wait, then move again', function() {
      nowTime = 1000;
      triggerDrag('start', { pageY: 0 });
      nowTime = 2000;
      triggerDrag('move', { pageY: 10 });
      expect(dragData).toHaveValues({
        startPos: 0,
        pos: 10
      });
      triggerDrag('move', { pageY: 10 });
      expect(dragData).toHaveValues({
        startPos: 10,
        pos: 10
      });
    });

    it('should trigger end event', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('end', { pageY: 0 });
      expect(dragData).toHaveValues({
        type: 'end'
      });
    });

    it('should trigger end event with properties', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('move', { pageY: -100 });
      nowTime = 99;
      triggerDrag('end');
      expect(dragData).toHaveValues({
        type: 'end',
        distance: -100,
        duration: 99
      });
    });

    it('should count the drag as "inactive" if we end and haven\'t moved in awhile', function() {
      triggerDrag('start', { pageY: 0 });
      triggerDrag('move', { pageY: 50 });
      nowTime = 5000;
      triggerDrag('end');
      expect(dragData).toHaveValues({
        inactiveDrag: true,
        duration: 5000
      });
    });

  });
});
