
beforeEach(function() {
  this.addMatchers({
    toHaveValues: function(expected) {
      var actual = this.actual;
      var notText = this.isNot ? " not" : "";
      var failures = {};

      this.message = function() {
        var fails = [];
        for (var key in failures) {
          fails.push('- "' + key + '"' + ' expected value ' + angular.mock.dump(failures[key].expected) + 
                     ', got ' + angular.mock.dump(failures[key].actual));
        }
        var message =  "Expected object" + notText + " to have matching properties. Failures:\n";
        return message + fails.join('\n');
      };
      
      var success = true;
      for (var key in expected) {
        if (expected.hasOwnProperty(key)) {
          if (!angular.equals(expected[key], actual[key])) {
            failures[key] = { expected: expected[key], actual: actual[key] };
            success = false;
          }
        }
      }
      return success;
    }
  });
});
