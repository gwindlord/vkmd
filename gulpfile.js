var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var imagemin = require('gulp-imagemin');

gulp.task('html', function() {
  gulp.src(['*.html'])
  .pipe(minifyHtml())
  .pipe(gulp.dest('build'));
});

gulp.task('css', function() {
  gulp.src(['css/*.css'])
  .pipe(minifyCss())
  .pipe(gulp.dest('build/css'));
});

gulp.task('js', function() {
  gulp.src(['js/*.js'])
  .pipe(uglify())
  .pipe(gulp.dest('build/js'));
});

gulp.task('images', function() {
  gulp.src(['images/*'])
  .pipe(imagemin())
  .pipe(gulp.dest('build/images'));
});

gulp.task('misc', function() {
  gulp.src(['manifest.json', 'storage.json', 'LICENSE'])
  .pipe(gulp.dest('build'));
});

gulp.task('default', ['html', 'css', 'js', 'images', 'misc']);
