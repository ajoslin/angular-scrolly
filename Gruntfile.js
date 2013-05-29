
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
      watch: {
        background: true,
        configFile: 'test/karma.conf.js'
      },
      continuous: {
        singleRun: true,
        configFile: 'test/karma.conf.js'
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
        navTemplate: 'misc/docs/nav-template.html',
        scripts: [
          'misc/docs/angular-1.1.4.js',
          'dist/angular-scrolly.js'
        ],
        styles: [
          'misc/docs/style.css'
        ],
        html5Mode: false
      },
      api: {
        src: ['src/**/*.js', 'docs/api/**/*.ngdoc'],
        title: 'API Documentation'
      },
      guide: {
        src: ['docs/guide/**/*.ngdoc'],
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
        'grunt build docs',
        'git checkout gh-pages',
        'cp -Rf dist/docs/* .',
        'git add -A',
        'git commit -am "chore(): Update docs"',
        'git push origin gh-pages',
        'git checkout master'
      ],
      release: [
        'grunt build',
        'mv dist/angular-scrolly.js dist/angular-scrolly.min.js .',
        'grunt changelog',
        'git add angular-scrolly.js angular-scrolly.min.js',
        'git commit -am "chore(release): v<%= pkg.version %>"',
        'git tag v<%= pkg.version %>',
        'git push --tags origin master'
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
      sh.cp('misc/validate-commit-msg.js', '.git/hooks/commit-msg');
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
      var result = sh.exec(cmd[i], {silent:true});
      if (result.code !== 0) {
        grunt.fatal("Shell task failed on '" + cmd[i] + "' with error '" + result.output + "'.");
        return;
      }
    }
  });

  grunt.registerTask('release', 'Send out a release', function() {
    sh.exec('grunt bump:' + (this.args[0] || 'patch'));
    grunt.config('pkg', grunt.file.readJSON('bower.json')); //Refresh package
    grunt.task.run('shell:release');
    //grunt.task.run('shell:docs');
  });
};
