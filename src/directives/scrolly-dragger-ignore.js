/**
 * @ngdoc directive
 * @name ajoslin.scrolly.directive:scrollyDraggerIgnore
 * @restrict A
 *
 * @description
 * Makes it so this element and all of its children ignore any $dragger behavior. In other words, this element and children will behave like normal when dragged.
 */
angular.module('ajoslin.scrolly.directives')
.directive('scrollyDraggerIgnore', [function() {
  return {
    restrict: 'A',
    controller: noop // just so we can see if it exists, add a controller
  };
}]);
