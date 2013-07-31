describe('desktop', function() {
  beforeEach(module('ajoslin.scrolly.scroller', function($desktopScrollerProvider) {
    $desktopScrollerProvider.key(1, -20);
  }));

  var desktop, scroller, elm, $document, transformer, $doc;
  beforeEach(inject(function($desktopScroller, $transformer, $document) {
    elm = angular.element("<div>");
    scroller = {
      calculateHeight: jasmine.createSpy('calculateHeight'),
      scrollHeight: 100
    };
    transformer = scroller.transformer = $transformer(elm);
    desktop = $desktopScroller(elm, scroller);

    spyOn(transformer, 'easeTo');
    spyOn(transformer, 'setTo');

    $doc = $document;
    $desktopScroller.mouseWheelDistanceMulti = 1; //for easy tests
    $desktopScroller.easeTimeMulti = 1; //for easy tests
  }));

  function trigger(type, data) {
    var e = $.Event(type);
    $.extend(e, data);
    $doc.trigger(e);
  }

  describe('mousewheel', function() {
    it('should use multiplier', inject(function($desktopScroller) {
      $desktopScroller.mouseWheelDistanceMulti = 0.24;
      trigger('mousewheel', { wheelDeltaY: -100 });
      expect(transformer.setTo).toHaveBeenCalledWith(-24);
    }));
    it('should scroll on mousewheel if in bounds', function() {
      transformer.pos = -13;
      trigger('mousewheel', { wheelDeltaY: -50 });
      expect(transformer.setTo).toHaveBeenCalledWith(-63);
    });
    it('should stay in bounds', function() {
      transformer.pos = -20;
      trigger('mousewheel', { wheelDeltaY: 100 });
      expect(transformer.setTo).toHaveBeenCalledWith(0);
      
      transformer.pos = -60;
      trigger('mousewheel', { wheelDeltaY: -50 });
      expect(transformer.setTo).toHaveBeenCalledWith(-100);
    });
  });

  describe('keys', function() {
    it('should use multipler', inject(function($desktopScroller) {
      $desktopScroller.easeTimeMulti = 0.18;
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith(-20, 20 * 0.18);
    }));
    it('should ease when pressing given key', function() {
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith(-20, 20);
    });
    it('should stay within bounds and change time to delta', function() {
      transformer.pos = -90;
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith(-100, 10);
    });
    it('should ignore key events if focusing an input', function() {
      var input = $("<input>").appendTo("body").focus();
      trigger("keydown", { keyCode: 1 });
      expect(transformer.easeTo).not.toHaveBeenCalled();
    });
  });
});
