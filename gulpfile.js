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
var bump = require('gulp-bump');
var git = require('gulp-git');
var fs = require('fs');

var settings = require('./config.json');

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
gulp.task('build', buildTask);
gulp.task('rsync', rsyncTask);
gulp.task('deploy', gulp.series('build', 'rsync'));

gulp.task('bump-version', function () {
  return gulp.src(['./package.json'])
    .pipe(bump({type: "patch"}))
    .pipe(gulp.dest('./'));
});

gulp.task('create-new-tag', function (cb) {
  var version = getPackageJsonVersion();
  git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', {args: '--tags'}, cb);
  });

  function getPackageJsonVersion () {
    // We parse the json file instead of using require because require caches
    // multiple calls so the version number won't be updated
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };
});

gulp.task('commit-changes', function () {
  return gulp.src('.')
    .pipe(git.add())
    .pipe(git.commit('[RELEASE] Bumped version number'));
});

gulp.task('push-changes', function (cb) {
  git.push('origin', 'master', cb);
});

gulp.task('release',
  gulp.series(
    'bump-version',
    'commit-changes',
    'push-changes',
    'create-new-tag'
));

function buildTask(done){
  return gulp.series('nunjucksTask', 'userefTask', 'imageTask')(done);
}

function rsyncTask(done) {
  console.log('Settings: ' + settings);
  return gulp.src('dist/**')
    .pipe(rsync({
      root:'dist',
      hostname: settings.rsync.hostname,
      destination: settings.rsync.destination,
      username: settings.rsync.username
    }));
}

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
  return gulp.series('watch')(done);
}
