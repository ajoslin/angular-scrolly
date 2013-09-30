describe('scroller', function() {

  beforeEach(module('ajoslin.scrolly.scroller', function($provide) {
    $provide.factory('$window', function() {
      return angular.mock.createMockWindow();
    });
  }));

  var scroller, elm, $scroller, dimensions, $window;
  beforeEach(inject(function(_$scroller_, $compile, _$window_) {
    elm = $("<div>");
    $scroller = _$scroller_;
    scroller = new $scroller(elm);
    $window = _$window_;

    dimensions = {
      top: 40,
      bottom: 40,
      height: 500
    };
    spyOn($scroller, 'getContentRect').andCallFake(function() {
      return dimensions;
    });
  }));

  it('should put the scroller on elm.data', function() {
    expect(elm.data('$scrolly.scroller')).toBe(scroller);
  });

  it('should return the same scroller multiple times for an element', inject(function($scroller) {
    expect($scroller(elm)).toBe(scroller);
  }));

  describe('calculateHeight', function() {
    it('should set scrollHeight to window\'s height relative to dimensions', function() {
      $window.innerHeight = 300;
      scroller.calculateHeight();
      expect(scroller.scrollHeight).toEqual(dimensions.height - 300 + 40 + 40);
    });
    it('should set scrollHeight to 0 if content height is less than window height', function() {
      $window.innerHeight = 100;
      dimensions.height = 50;
      scroller.calculateHeight();
      expect(scroller.scrollHeight).toBe(0);
    });
  });

  describe('outOfBounds', function() {
    it('should return falsy -scrollHeight < pos < 0', function() {
      scroller.scrollHeight = 10;
      expect(scroller.outOfBounds(-5)).toBeFalsy();
    });
    it('should return how much out of bounds if pos < -scrollHeight', function() {
      scroller.scrollHeight = 10;
      expect(scroller.outOfBounds(-13)).toBe(-3);
    });
    it('should return how much out of bounds if pos > 0', function() {
      expect(scroller.outOfBounds(7)).toBe(7);
    });
  });

  describe('checkBoundaries', function() {
    beforeEach(function() {
      spyOn(scroller.transformer, 'easeTo').andCallThrough();
      spyOn(scroller, 'calculateHeight').andCallFake(function() {
        return self.scrollHeight;
      });
    });

    it('should do nothing if in boundaries', function() {
      scroller.scrollHeight = 100;
      scroller.transformer.pos.y = -50;
      scroller.checkBoundaries();
      expect(scroller.transformer.easeTo).not.toHaveBeenCalled();
    });

    it('should ease back to boundaries if outside', function() {
      scroller.scrollHeight = 100;
      scroller.transformer.pos.y = 30;
      scroller.checkBoundaries();
      expect(scroller.transformer.easeTo).toHaveBeenCalled();
      expect(scroller.transformer.easeTo.mostRecentCall.args[0]).toBe(0);
      
      scroller.transformer.easeTo.reset();
      scroller.transformer.pos.y = -144;
      scroller.checkBoundaries();
      expect(scroller.transformer.easeTo).toHaveBeenCalled();
      expect(scroller.transformer.easeTo.mostRecentCall.args[0]).toBe(-100);
    });

  });

  describe('momentum', function() {
    //TODO momentum tests
  });

  describe('drag', function() {
    //TODO drag -> scroll tests
  });
});
