var fs = require('fs');
var jsBeautify = require('js-beautify').js_beautify;

module.exports = function(grunt) {

  var footer = ['/*',
                ' * v<%= pkg.version %>',
                ' * Created by the Google Analytics consultants at http://www.lunametrics.com/',
                ' * Written by @notdanwilkerson',
                ' * Documentation: https://github.com/lunametrics/gascroll/',
                ' * Licensed under the MIT License',
                ' */'
  ].join('\r\n');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      // files: ['./src/*.js'],
      ignore_warning: {
        options: {
          '-W030': true,
          '-W058': true
        },
        src: ['./src/*.js']
      }
    },
    uglify: {
      options: {
        footer: footer 
      },
      build: {
        src: './src/lunametrics-scroll-tracking.gtm.js',
        dest: './lunametrics-scroll-tracking.gtm.min.js'
      }
    },
    fixConfig: {
      options: {
        build: {
          src: './lunametrics-scroll-tracking.gtm.min.js',
          dest: './lunametrics-scroll-tracking.gtm.min.js'
        }
      }
    },
    prependFooter: {
      options: {
        build: {
          src: './src/lunametrics-scroll-tracking.gtm.js',
          dest: './lunametrics-scroll-tracking.gtm.js'
        },
        footer: footer
      }
    },
    updateContainer: {
      options: {
        build: {
          src: './lunametrics-scroll-tracking.gtm.js',
          dest: './luna-scroll-tracking.json'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('fixConfig', ['Reformat config argument for readability'], function() {

    var options = this.options();
    var data = fs.readFileSync(options.build.src, 'utf-8');
    var minifiedConfig = data.split('/*')[0].match(/\(.*?\)/g).pop();
    var config = minifiedConfig.replace(/!0/g, 'true').replace(/!1/g, 'false');
    var beautifiedConfig = jsBeautify(config);
    var data = data.replace(minifiedConfig, '\n' + beautifiedConfig);
    fs.writeFileSync(options.build.dest, data);  
    console.log('Appended properly formatted config to end of minified script');

  });

  grunt.registerTask('prependFooter', ['Prepend credits to footer'], function() {

    var options = this.options();
    var data = fs.readFileSync(options.build.src, 'utf-8');  
    fs.writeFileSync(options.build.dest, data + options.footer);
    console.log('Prepended footer to unminifed script');

  });

  grunt.registerTask('updateContainer', ['Updating container import file'], function() {

    var options = this.options();
    var oldContainer = require(options.build.dest);    
    var newScript = fs.readFileSync(options.build.src, 'utf-8');
    var oldTag,
        oldParameter,
        i;

    for (i = 0; i < oldContainer.containerVersion.tag.length; i++) {

      if (oldContainer.containerVersion.tag[i].name === 'CU - Scroll Tracking - LunaMetrics Plugin') {

        oldTag = i;
        break;

      }

    }
    for (i = 0; i < oldContainer.containerVersion.tag[oldTag].parameter.length; i++) {

      if (oldContainer.containerVersion.tag[oldTag].parameter[i].key === 'html') {

        oldParameter = i;
        break;

      }

    }
   
    oldContainer.containerVersion.tag[oldTag].parameter[oldParameter].value = '<script type="text/javascript" id="gtm-scroll-tracking">\n' +
      newScript +
      '\n</script>';
   
    fs.writeFileSync(options.build.dest, jsBeautify(JSON.stringify(oldContainer)));

  });

  grunt.registerTask('default', ['jshint', 'prependFooter', 'uglify', 'fixConfig', 'updateContainer']);

};
