
/*
 * @ngdoc module
 * @name ajoslin.scrolly
 * @description
 * 
 * 'ajoslin.scrolly' Is the one module that includes all of the others.
 */
angular.module('ajoslin.scrolly', [
  'ajoslin.scrolly.scroller',
  'ajoslin.scrolly.directives'
]);

var jqLite = angular.element,
  isDefined = angular.isDefined,
  copy = angular.copy,
  forEach = angular.forEach,
  isString = angular.isString,
  extend = angular.extend;
