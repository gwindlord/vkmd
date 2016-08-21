var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var minifyHtml = require('gulp-minify-html');
var imagemin = require('gulp-imagemin');
var zip = require('gulp-zip');
var del = require('del');

gulp.task('clean', function() {
  del(['build']);
});

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
  gulp.src(['_locales/**/*.json', 'manifest.json', 'storage.json', 'LICENSE'], {base: '.'})
  .pipe(gulp.dest('build'));
});

gulp.task('zip', function() {
  gulp.src('build/**/*')
  .pipe(zip('vkmd.zip'))
  .pipe(gulp.dest('dist'));
});

gulp.task('build', ['html', 'css', 'js', 'images', 'misc']);

gulp.task('default', ['clean', 'build', 'zip']);
