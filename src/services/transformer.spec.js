
describe('scrolly.transformer', function() {

  beforeEach(module('ajoslin.scrolly.transformer'));
  beforeEach(module(function($provide) {
    $provide.factory('$nextFrame', function($window) {
      return angular.mock.createMockWindow().setTimeout;
    });
  }));

  var $transformer, transformer, elm, $window, $nextFrame;
  beforeEach(inject(function(_$transformer_, _$window_, _$nextFrame_) {
    elm = $("<div>");
    $transformer = _$transformer_;
    transformer = new $transformer(elm);

    spyOn(transformer, 'updatePosition').andCallFake(function() {
      return transformer.pos;
    });

    $window = _$window_;
    $nextFrame = _$nextFrame_;
  }));

  function fireTransitionEnd() {
    elm.triggerHandler($transformer.transitionEndProp);
  }

  it('should be a function', function() {
    expect(typeof $transformer).toBe('function');
  });

  it('should create an object', function() {
    expect(typeof transformer).toBe('object');
  });

  it('should put the transformer on elm.data', function() {
    expect(elm.data('$scrolly.transformer')).toBe(transformer);
  });

  it('should return the same transformer multiple times for an element', inject(function($transformer) {
    expect($transformer(elm)).toBe(transformer);
  }));

  it('should have pos at 0,0 by default', function() {
    expect(transformer.pos).toEqual({x: 0, y: 0});
  });

  it('should not be changing by default', function() {
    expect(transformer.changing).toBeFalsy();
  });

  it('should clear transformProp with clear()', function() {
    transformer.setTo({x: 2, y: 99});
    expect(elm.css($transformer.transformProp)).toMatch('2*.*99');
    transformer.clear();
    //Firefox does 'none', other browsers do ''
    expect(['none', '']).toContain(elm.css($transformer.transformProp));
  });

  it('should clear transitionProp with clear()', function() {
    transformer.easeTo({x: 15, y: 82}, 100);
    expect(elm.css($transformer.transitionProp)).toMatch('100');
    transformer.clear();
    //Firefox does 'none', other browsers do ''
    expect(['none', '']).toContain(elm.css($transformer.transitionProp));
  });

  it('should set pos and transform with setTo', function() {
    transformer.setTo({x: 33, y: 66});
    expect(elm.css($transformer.transformProp)).toMatch('33*.*66');
    expect(transformer.pos).toEqual({x: 33, y: 66});
  });

  it('should set only x if only x given', function() {
    transformer.setTo({x: 22});
    expect(elm.css($transformer.transformProp)).toMatch('22*.*0');
    transformer.setTo({x: 23, y: 24});
    expect(elm.css($transformer.transformProp)).toMatch('23*.*24');
    transformer.setTo({x: 1});
    expect(elm.css($transformer.transformProp)).toMatch('1*.*24');
  });

  it('should set only y if only y given', function() {
    transformer.setTo({y: 22});
    expect(elm.css($transformer.transformProp)).toMatch('0*.*22');
    transformer.setTo({x: 23, y: 24});
    expect(elm.css($transformer.transformProp)).toMatch('23*.*24');
    transformer.setTo({y: 1});
    expect(elm.css($transformer.transformProp)).toMatch('23*.*1');
  }); 

  it('should error if not giving a positive number for easeTo', function() {
    expect(function() { $transformer.easeTo({x: 4, y: 4}, -1); }).toThrow();
    expect(function() { $transformer.easeTo({x: 3, y: 6}, 'pizza'); }).toThrow();
  });

  it('should set transition, then on next frame set position, then call callback after time', function() {
    var done = jasmine.createSpy('done');

    transformer.easeTo({x: 55, y: 66}, 500, done);
    expect(elm.css($transformer.transitionProp)).toMatch('500ms');
    expect(transformer.pos).toEqual({x: 0, y: 0});
    expect(transformer.changing).toBe(true);

    $nextFrame.expect().process();
    expect(elm.css($transformer.transformProp)).toMatch('55*.*66');
    expect(elm.css($transformer.transitionProp)).toMatch('500');

    fireTransitionEnd();
    $nextFrame.expect().process();
    expect(done).toHaveBeenCalled();
    expect(elm.css($transformer.transitionProp)).toMatch('');
    expect(transformer.pos).toEqual({x: 55, y: 66});
  });

  it('should stop before easing if already easing', function() {
    spyOn(transformer, 'stop').andCallThrough();
    spyOn(transformer, 'easeTo').andCallThrough();

    transformer.easeTo({x:-10, y:-20}, 1000);
    expect(transformer.changing).toBe(true);
    //It should request the next frame and set transition prop, then set transform
    $nextFrame.expect().process();
    expect(elm.css($transformer.transformProp)).toMatch('-10*.*-20');

    //it should stop, then after the next frame change the easing.
    transformer.easeTo({x: -20, y: -40}, 250);
    expect(transformer.stop).toHaveBeenCalled();
    expect(transformer.changing).toBe(false);
    $nextFrame.expect().process();
    expect(transformer.changing).toBe(true);
    //After requesting the frame from stop, it will do the ease and add the transitionEnd timeout
    $nextFrame.expect().process();
    expect(elm.css($transformer.transformProp)).toMatch('-20*.*-40');
  });
});
