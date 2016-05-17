'use strict';

var gulp = require('gulp'),
	webserver = require('gulp-webserver'),
    jshint = require('gulp-jshint'),
    cache = require('gulp-cached'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    rename = require('gulp-rename'),
    order = require('gulp-order'),
    del = require('del'),
    htmlreplace = require('gulp-html-replace'),
    minhtml = require('gulp-minify-html'),
    streamqueue = require('streamqueue'),
    handlebars = require('gulp-compile-handlebars'),
    rename = require('gulp-rename'),
    debug = require('gulp-debug'),
    fs = require('fs'),
    config;


config = {
	js: 'src/event/js/main.js',
  events: 'src/events.json',
  hbs:'src/templates/*.hbs',
  css: [
    'src/event/css/**/*.css',
    '!src/event/css/style.css'
  ],
  cssStyle: 'src/event/css/style.css',
  allJs: 'src/event/js/**/*.js',
  images: ['src/event/images/**/*'],
  dist: {
    build: 'build/',
    images: 'build/images/',
    js: 'build/js',
    css: 'build/css'
  }
};

gulp.task('handlebars', function() { 
    var options = {
      helpers : {
    		helperMissing : function(){
    			var options = arguments[arguments.length - 1];
          console.warn('handelbars missing: ' + options.name);
    		}
    	}
    }
    
    var events = JSON.parse(fs.readFileSync(config.events));
    for(var i=0; i<events.length; i++) {
        var evt = events[i],
            dirName = evt.date;
        gulp.src('src/templates/event.template.hbs')
            .pipe(handlebars(evt,options))
            .pipe(rename("index.html"))
            .pipe(gulp.dest('./src/event/warsztaty/'+dirName))
            .pipe(debug({title: 'created:'}));
    }
});

gulp.task('jshint', function () {
	gulp.src(config.js)
    .pipe(cache('linting'))
    .pipe(jshint({
        // load .jshintrc file
        lookup: true
    }))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('dist-clean', function (cb) {
  del(config.dist.build, cb);
});

gulp.task('dist-images', function () {
  return gulp.src(config.images)
    .pipe(imagemin({ 
      optimizationLevel: 3, 
      progressive: true, 
      interlaced: true 
    }))
    .pipe(gulp.dest(config.dist.images));
    //.pipe(notify({ message: 'Images task complete' }));
});

gulp.task('dist-js', ['jshint'], function () {

  return streamqueue({ objectMode: true },
        gulp.src('src/event/js/jquery-2.1.0.min.js'),
        gulp.src('src/event/js/jquery.accordion.js'),
        gulp.src('src/event/js/jquery.scrollTo.js'),
        gulp.src('src/event/js/jquery.fitvids.js'),
        gulp.src('src/event/js/jquery.nav.js'),
        gulp.src('src/event/js/jquery.flexslider.js'),
        gulp.src('src/event/js/jquery.placeholder.js'),
        gulp.src('src/event/js/owl.carousel.min.js'),
        gulp.src('src/event/js/bootstrap.min.js'),
        gulp.src('src/event/js/fancySelect.js'),
        gulp.src('src/event/js/gmap3.js'),
        gulp.src('src/event/js/main.js')
      )
      .pipe(concat('main.js'))
      .pipe(gulp.dest(config.dist.js))
      .pipe(rename({ suffix: '.min' }))
      .pipe(uglify())
      .pipe(gulp.dest(config.dist.js));
      //.pipe(notify({ message: 'Scripts task complete' }));

});
gulp.task('dist-css', function () {

  return streamqueue({ objectMode: true },
      gulp.src('src/event/css/bootstrap.css') ,
      gulp.src('src/event/css/fancySelect.css'),
      gulp.src('src/event/css/flexslider.css'),
      gulp.src('src/event/css/font-awesome.css'),
      gulp.src('src/event/css/owl.carousel.css'),
      gulp.src('src/event/css/responsive.css'), 
      gulp.src('src/event/css/animate.min.css'),
      gulp.src('src/event/css/style.css')
    )
    .pipe(concat('style.css'))
    .pipe(gulp.dest(config.dist.css))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest(config.dist.css));
    //.pipe(notify({ message: 'Styles task complete' }));

});

gulp.task('dist-font', function () {

  return gulp.src('src/event/css/fonts/**')
    .pipe(gulp.dest('build/css/fonts/'));

});

gulp.task('dist-html', function () {
  var timestamp = new Date().getTime() / 1000 | 0;
  return gulp.src('src/event/**/*.html')
    .pipe(htmlreplace({
        'css': '/css/style.min.css?' + timestamp,
        'js': '/js/main.min.js?' + timestamp
    }))
    .pipe(minhtml())
    .pipe(gulp.dest('build/'));
});

gulp.task('dev-connect', function() {
  gulp.src('src/event')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
      port: 8000
    }));
});

gulp.task('dist-connect', function() {
  gulp.src('build/')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
      port: 8000
    }));
});

gulp.task('dev', ['dev-connect', 'handlebars', 'jshint'], function () {

  gulp.watch(config.js, ['jshint']);
  gulp.watch(config.hbs, ['handlebars']);
  gulp.watch(config.events, ['handlebars']);

});

gulp.task('default', ['dev']);	

gulp.task('dist', ['dist-clean' ], function () {
  gulp.start('dist-images', 'dist-js', 'dist-css', 'dist-html', 'dist-font');

});  