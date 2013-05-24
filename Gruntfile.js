
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-ngmin');

  grunt.initConfig({
    dist: 'dist',
    pkg: grunt.file.readJSON('bower.json'),
    meta: {
      banner: 
        '/*\n'+ 
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * Created by <%= pkg.author %>; Licensed under <%= pkg.license %>\n' +
        ' */\n'
    },
    karma: {
      watch: {
        configFile: 'test/karma.conf.js',
        background: true
      },
      continuous: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },
    
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        eqeqeq: true,
        expr: true,
        globals: {
          angular: true
        }
      }
    },

    ngmin: {
      files: {
        '<%= dist %>/<%= pkg.name %>.js': '<%= dist %>/<%= pkg.name %>.js'
      }
    },

    //Concat really only adds the banner ... ngmin concats for us
    concat: {
      dist: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          '<%= dist %>/<%= pkg.name %>.js': ['src/**/*.js']
        }
      }
    },

    uglify: {
      dist: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          '<%= dist %>/<%= pkg.name %>.min.js': '<%= dist %>/<%= pkg.name %>.js'
        }
      }
    },

    ngdocs: {
      options: {
        scripts: [
          'js/angular.min.js',
          '../dist/angular-scrolly.js'
        ]
      },
      api: {
        src: ['src/**/*.js'],
        title: 'API Documentation'
      }
    }
  });

  //TODO fix ngmin and uglify
  grunt.registerTask('default', ['jshint', 'karma:continuous', 'concat', 'ngdocs']);
};
