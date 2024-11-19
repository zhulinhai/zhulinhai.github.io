var gulp = require('gulp');  //首先需要在gukpfile.js中require这个插件，不要忘记了在项目中npm install
var connect = require('gulp-connect');  //首先需要在gukpfile.js中require这个插件，不要忘记了在项目中npm install

//配置文件路径
var paths={
    src_html:"./src/**/*.html",
    src_less:"./src/css/**/*.less",
    src_css:"./src/css/**/*.css",
    src_sass:"./src/css/**/*.scss",
    src_json:"./src/**/*.json",
    src_images:"src/images/**/*",
    src_pic:"src/pic/**/*",
    src_js:"./src/js/**/*.js",
    src_text:"./src/**/*.text",

    dist:"./dist",
    dist_css:"./dist/css",
    dist_mincss:"./dist/mincss",
    dist_images:"dist/images",
    dist_html:"./dist/**/*.html",
    dist_pic:"dist/pic",
    dist_js:"./dist/js",
    dist_minjs:"./dist/minjs"
};

//监听文档
gulp.task('watch',function(){
    //监听less,sass,css
    gulp.watch([paths.src_sass,paths.src_less,paths.src_css],['styles', 'html'])
    //监听js
    gulp.watch([paths.src_js],['scripts'])
    //监听图片
    gulp.watch([paths.src_images],['images'])
    gulp.watch([paths.src_pic],['pic'])
    //监听hhtml,json,text
    gulp.watch([paths.src_html,paths.src_json,paths.src_text], function(event) {
        gulp.run('html')
    });
})

//本地服务
gulp.task('connect', function () {
    connect.server({
        port:'3333',
        livereload: true
    });
});
gulp.task('default', ['connect', 'watch']);