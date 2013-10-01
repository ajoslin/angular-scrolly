describe('desktop', function() {
  beforeEach(module('ajoslin.scrolly.scroller', function($desktopScrollerProvider) {
    $desktopScrollerProvider.key(1, -20);
  }));

  var desktop, scroller, elm, $document, transformer, $doc;
  beforeEach(inject(function($desktopScroller, $transformer, $document) {
    elm = angular.element("<div id='banana'></div>");
    document.body.appendChild(elm[0]);
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
    it('should not scroll if delta is 0', function() {
      trigger('mousewheel', { wheelDeltaY: 1 });
      expect(transformer.setTo).not.toHaveBeenCalled();

      transformer.setTo.reset();
      trigger('mousewheel', { wheelDeltaY: 0 });
      expect(transformer.setTo).not.toHaveBeenCalled();
    });
    it('should not scroll if target is not element or a child of element', function() {
      trigger('mousewheel', { target: document });
      expect(transformer.setTo).not.toHaveBeenCalled();
    });
    it('should scroll if target is child of element', function() {
      var child = angular.element('<span>');
      elm.append(child);
      trigger('mousewheel', { wheelDeltaY: 1, target: child[0] });
      expect(transformer.setTo).toHaveBeenCalled();
    });
    it('should scroll if target is element itself', function() {
      trigger('mousewheel', { wheelDeltaY: 1, target: elm[0] });
      expect(transformer.setTo).toHaveBeenCalled();
    });
    it('should use multiplier', inject(function($desktopScroller) {
      $desktopScroller.mouseWheelDistanceMulti = 0.24;
      trigger('mousewheel', { wheelDeltaY: -100, target: elm[0] });
      expect(transformer.setTo).toHaveBeenCalledWith({x:0, y: -24});
    }));
    it('should scroll on mousewheel if in bounds', function() {
      transformer.pos.y = -13;
      trigger('mousewheel', { wheelDeltaY: -50, target: elm[0] });
      expect(transformer.setTo).toHaveBeenCalledWith({x: 0, y: -63});
    });
    it('should stay in bounds', function() {
      transformer.pos.y = -20;
      trigger('mousewheel', { wheelDeltaY: 100, target: elm[0] });
      expect(transformer.setTo).toHaveBeenCalledWith({x: 0, y:0});
      
      transformer.pos.y = -60;
      trigger('mousewheel', { wheelDeltaY: -50, target: elm[0] });
      expect(transformer.setTo).toHaveBeenCalledWith({x: 0, y: -100});
    });
  });

  describe('keys', function() {
    it('should use multipler', inject(function($desktopScroller) {
      $desktopScroller.easeTimeMulti = 0.18;
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith({x: 0, y: -20}, 20 * 0.18);
    }));
    it('should ease when pressing given key', function() {
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith({x: 0, y: -20}, 20);
    });
    it('should stay within bounds and change time to delta', function() {
      transformer.pos.y = -90;
      trigger('keydown', { keyCode: 1 });
      expect(transformer.easeTo).toHaveBeenCalledWith({x: 0, y: -100}, 10);
    });
    it('should ignore key events if focusing an input', function() {
      var input = $("<input>").appendTo("body").focus();
      trigger("keydown", { keyCode: 1 });
      expect(transformer.easeTo).not.toHaveBeenCalled();
    });
  });
});
