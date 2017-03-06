var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');

var postcss      = require('gulp-postcss');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer'); 
var pixrem = require('gulp-pixrem');

var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var cache = require('gulp-cache');

var cssnano = require('cssnano');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');

var spawn = require('child_process').spawn,
    node;

gulp.task('browser-sync', function() {
  browserSync({
    proxy: "localhost"
  });
});

gulp.task('bs-reload', function () {
  browserSync.reload();
});

var errorHandler = { 
  errorHandler: function(error) {
    console.log(error.message);
    this.emit('end');
  }
};

gulp.task('styles', function(){
  gulp.src('./src/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([ autoprefixer({ browsers: [">1%"] }) ]))
    .pipe(gulp.dest('./'))
    .pipe(rename({suffix: '.min'}))
    .pipe(postcss([ cssnano() ]))
    .pipe(pixrem({ rootValue: '10px', html: false })) //has to be after minify or the fallbacks get stripped
    .pipe(gulp.dest('./'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('scripts', function(){
  gulp.src(['src/js/**/*.js', '!src/js/vendor/*.js'])
    .pipe(plumber(errorHandler))
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('client.js'))
    .pipe(gulp.dest('./'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify({
      mangle: {
        except: []
      }
    }))
    .pipe(gulp.dest('./'))
    .pipe(browserSync.reload({stream:true}))

  return gulp.src(['src/js/vendor/*.js'])
    .pipe(plumber(errorHandler))
    .pipe(gulp.dest('./js/vendor/'))
}); 

gulp.task('default', ['browser-sync'], function(){
  gulp.watch("src/sass/**/*.scss", ['styles']);
  gulp.watch("src/js/**/*.js", ['scripts']);
  gulp.watch("**/*.html", ['bs-reload']);  
});