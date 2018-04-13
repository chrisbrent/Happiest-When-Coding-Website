var gulp = require('gulp');
var nunjucks = require('nunjucks');
var nunjucksRender = require('gulp-nunjucks-render');
var browserSync = require('browser-sync').create();
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var useref = require('gulp-useref');
var imagemin = require('gulp-imagemin');
var rsync = require('gulp-rsync')
var settings = require("./settings.js")

gulp.task('browserSync', function() {
  console.log('Starting browserSync');
  browserSync.init({
          server: "./app"
      });

  gulp.watch(['app/css/*.css', 'app/**/*.nunjucks'], nunjucksTask);
  gulp.watch("app/*.html").on('change', browserSync.reload);
});


gulp.task('nunjucksTask', nunjucksTask);
gulp.task('default', defaultTask);
gulp.task('userefTask', userefTask);
gulp.task('imageTask', imageTask);
gulp.task('watch', gulp.series('browserSync'));
gulp.task('build', gulp.series('nunjucksTask', 'userefTask', 'imageTask'));
gulp.task('deploy', function() {
  return gulp.src('dist/**')
    .pipe(rsync({
      root:'dist',
      hostname: settings.rsync.hostname,
      destination: settings.rsync.destination,
      username: settings.rsync.username
    }));
});

function watchTask(done){
  gulp.watch(['app/css/*.css', 'app/**/*.nunjucks'], nunjucksTask);
  gulp.watch("app/*.html").on('change', browserSync.reload);
}

function userefTask(done){
  return gulp.src('./app/**/*.html')
    .pipe(useref({searchPath:['./','app']}))
    .pipe(gulpIf('*.js', uglify()))
    // Minifies only if it's a CSS file
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'))
}

function nunjucksTask(done){
  console.log('Starting nunjucksTask');
  return gulp.src('app/pages/**/*.+(html|nunjucks)')
   // Renders template with nunjucks
   .pipe(nunjucksRender({
       path: ['app/templates']
     }))
   // output files in app folder
   .pipe(gulp.dest('app'))
   .pipe(browserSync.reload({stream: true}))
}

function imageTask(done){
  return gulp.src('app/img/**/*.+(png|jpg|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('dist/img'))
}

function defaultTask(done){
  console.log('Starting defaultTask');
  return gulp.series('watch');
}
