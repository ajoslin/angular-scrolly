var sh = require('shelljs');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-conventional-changelog');

  grunt.initConfig({
    dist: 'dist',
    docs: 'dist/docs',
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
      options: {
        configFile: 'test/karma-shared.conf.js',
        browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome']
      },
      watch: {
        background: true
      },
      continuous: {
        singleRun: true
      },
      sauce: {
        configFile: 'test/karma-saucelabs.conf.js',
        browsers: ['sauce_ie', 'sauce_ios', 'sauce_android']
      },
      sauce2: {
        configFile: 'test/karma-saucelabs.conf.js',
      }
    },

    clean: ['<%= dist %>', '<%= docs %>'],
    
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
      dist: {
       files: {
        '<%= dist %>/<%= pkg.name %>.js': ['src/**/*.js', '!src/**/*.spec.js']
        }
      }
    },

    //Concat really only adds the banner ... ngmin concats for us
    concat: {
      dist: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          '<%= dist %>/<%= pkg.name %>.js': '<%= dist %>/<%= pkg.name %>.js'
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
        dest: '<%= docs %>',
        title: 'angular-scrolly',
        navTemplate: 'docs/html/nav.html',
        scripts: [
          'lib/angular.js',
          'dist/angular-scrolly.js'
        ],
        styles: [
          'docs/css/style.css'
        ],
        html5Mode: false
      },
      api: {
        src: ['src/**/*.js', 'docs/content/api/**/*.ngdoc'],
        title: 'API Documentation'
      },
      guide: {
        src: ['docs/content/guide/**/*.ngdoc'],
        title: 'Guide'
      }
    },

    copy: {
      demo: { 
        files: [{
          src: ['**/*'],
          cwd: 'demo/',
          dest: '<%= docs %>/demo/',
          expand: true
        }]
      }
    },

    shell: {
      docs: [ 
        'grunt build docs copy',
        'git stash',
        'git checkout gh-pages',
        'cp -Rf dist/docs/* .',
        'git add -A',
        'git commit -am "chore(): Update docs"',
        'git push origin gh-pages',
        'git checkout master',
        'git stash pop'
      ],
      release: [
        'grunt build',
        'mv dist/angular-scrolly.js dist/angular-scrolly.min.js .',
        'grunt changelog',
        'git add angular-scrolly.js angular-scrolly.min.js',
        'git commit -am "chore(release): v<%= pkg.version %>"',
        'git tag v<%= pkg.version %>'
      ]
    },

    delta: {
      files: ['src/**/*.js'],
      tasks: ['jshint', 'karma:watch:run']
    }
  });

  //TODO fix ngmin and uglify
  grunt.registerTask('default', ['clean', 'jshint', 'karma:continuous', 'build', 'docs']);

  grunt.registerTask('build', function() {
    if (!grunt.file.exists('.git/hooks/commit-msg')) {
      grunt.file.copy('scripts/validate-commit-msg.js', '.git/hooks/commit-msg');
      require('fs').chmodSync('.git/hooks/commit-msg', '0755');
    }
    grunt.task.run(['ngmin', 'concat', 'uglify']);
  });
  grunt.registerTask('docs', ['ngdocs', 'copy']);

  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['karma:watch', 'delta']);

  grunt.registerMultiTask('shell', 'run shell commands', function() {
    var cmd = this.data;
    for (var i=0; i<cmd.length; i++) {
      grunt.log.ok(cmd[i]);
      var result = sh.exec(cmd[i], {silent:true});
      if (result.code !== 0) {
        grunt.fatal(result.output);
        return;
      }
    }
  });
};
