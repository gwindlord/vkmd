var gulp = require('gulp');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var cleanCss = require('gulp-clean-css');
var minifyHtml = require('gulp-minify-html');
var imagemin = require('gulp-imagemin');
var zip = require('gulp-zip');
var del = require('del');

gulp.task('clean', function() {
  del.sync(['build']);
});

gulp.task('html', function() {
  gulp.src(['*.html'])
  .pipe(minifyHtml())
  .pipe(gulp.dest('build'));
});

gulp.task('css', function() {
  gulp.src(['css/*.css'])
  .pipe(cleanCss())
  .pipe(gulp.dest('build/css'));
});

gulp.task('js', function() {
  gulp.src(['js/*.js'])
  // .pipe(uglify())
  .pipe(gulp.dest('build/js'));
});

gulp.task('images', function() {
  gulp.src(['images/*'])
  .pipe(imagemin())
  .pipe(gulp.dest('build/images'));
});

gulp.task('misc', function() {
  gulp.src(['_locales/**/*.json', 'manifest.json', 'storage.json', 'LICENSE'], {base: '.'})
  .pipe(gulp.dest('build'));
});

gulp.task('zip', function() {
  gulp.src('build/**/*')
  .pipe(zip('vkmd.zip'))
  .pipe(gulp.dest('dist'));
});

gulp.task('build', ['html', 'css', 'js', 'images', 'misc']);

gulp.task('default', function(callback) {
  runSequence('clean', 'build', 'zip', callback);
});

