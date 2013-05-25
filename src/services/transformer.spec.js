
describe('scrolly.transformer', function() {

  beforeEach(module('scrolly.transformer'));
  beforeEach(module(function($provide) {
    $provide.value('$window', angular.mock.createMockWindow());
    $provide.factory('$requestAnimationFrame', function($window) {
      return angular.mock.createMockWindow().setTimeout;
    });
  }));

  var $transformer, transformer, elm, $window, timeoutQueue, flushTimeout, $requestFrame;
  beforeEach(inject(function(_$transformer_, _$window_, $requestAnimationFrame) {
    elm = $("<div>");
    $transformer = _$transformer_;
    transformer = new $transformer(elm);

    transformer.$$calcPosition = function() {
      return transformer.pos;
    };

    $window = _$window_;
    $requestFrame = $requestAnimationFrame;
  }));

  it('should be a function', function() {
    expect(typeof $transformer).toBe('function');
  });

  it('should create an object', function() {
    expect(typeof transformer).toBe('object');
  });

  it('should have pos at 0 by default', function() {
    expect(transformer.pos).toBe(0);
  });

  it('should not be changing by default', function() {
    expect(transformer.changing).toBeFalsy();
  });

  it('should set pos and transform with setTo', function() {
    transformer.setTo(100);
    expect(elm.css($transformer.transformProp)).toMatch('100px');
    expect(transformer.pos).toBe(100);
  });

  it('should error if not giving a positive number for easeTo', function() {
    expect(function() { $transformer.easeTo(1, -1); }).toThrow();
    expect(function() { $transformer.easeTo(1, 'pizza'); }).toThrow();
  });

  it('should set transition, then on next frame set position, then call callback after time', function() {
    var done = jasmine.createSpy('done');

    transformer.easeTo(100, 500, done);
    expect(elm.css($transformer.transitionProp)).toMatch($transformer.transformPropDash);
    expect(transformer.pos).toBe(0);
    expect(transformer.changing).toBe(true);

    $requestFrame.expect().process();
    expect(elm.css($transformer.transformProp)).toMatch('100px');

    $window.setTimeout.expect(500).process();
    expect(done).toHaveBeenCalled();
    expect(elm.css($transformer.transitionProp)).toBe('none');
    expect(transformer.pos).toBe(100);
  });

  it('should stop before easeing if already easing', function() {
    spyOn(transformer, 'stop').andCallThrough();
    spyOn(transformer, 'easeTo').andCallThrough();

    transformer.easeTo(-100, 1000);
    //It should request the next frame, then start a timeout for transitionEnd
    $requestFrame.expect().process();
    expect($window.setTimeout.queue.length).toBe(1);

    //it should stop, then after the next frame change the easing.
    transformer.easeTo(200, 250);
    expect(transformer.stop).toHaveBeenCalled();
    expect($window.setTimeout.queue.length).toBe(1);
    $requestFrame.expect().process();
    //After requesting the frame from stop, it will do the ease and add the transitionEnd timeout
    $requestFrame.expect().process();
    expect($window.setTimeout.queue.length).toBe(2);
  });
});
