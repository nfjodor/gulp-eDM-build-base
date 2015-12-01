var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    fileInclude = require('gulp-file-include'),
    inlineCss   = require('gulp-inline-css'),
    prettify    = require('gulp-prettify'),
    fs          = require('fs'),
    path        = require("path"),
    nodemailer  = require('nodemailer'),
    prompt      = require('gulp-prompt'),
    zip         = require("node-native-zip"),
    https       = require("https"),
    mkdirp      = require('mkdirp'),
    clean       = require('gulp-clean'),
    entities    = require("gulp-html-entities"),
    toMails     = '';
    require('console.table');

var config = {
    "paths": {
        "compiled": "compiled/",
        "allCompiled" : "compiled/**/*",
        "scss": "scss/**/*.scss",
        "css": "css/**/*.css",
        "templates": "templates/**/*",
        "images": "img/**/*",
        "partials": "partials/**/*"
    },
    "gmail_user": "Gmail felhasználói név (pl.: norbi.boci@gmail.com)",
    "gmail_pass": "Gmail accounthoz a jelszavad",
    "innerTestMails": "example@freemail.hu, example@citromail.hu, example@indamail.hu, example@gmail.com, example@yahoo.com, example@hotmail.com",
    "toEmails": "Azok a mailcímek, ahova küldeni szeretnéd a levelet (Vesszővel ellátva kell felsorolni ezeket)",
    "subject": "teszt email",
    "zipName": "Az ügyfélnek küldendő csomag neve (pl.:otp_eDM)",
    "tinypngApiKey": "A TinyPng-s api kulcsod",
}
var messages = {
    'configLong': {
        'gmail_user': 'Adj meg egy Gmail e-mail címet!',
        'gmail_pass': 'Add meg a hozzá tartozó jelszót!',
        'toEmails': 'Add meg vesszővel elválasztva azokat az e-mail címeket, ahova a teszt e-mailt ki lehet küldeni!',
        'subjelct': 'Add meg a teszt e-mail tárgyát!',
        'zipname': 'Add meg az ügyfél számára küldeni kívánt zip nevét kiterjesztés nélkül!',
        'tinyPngApi': 'Add meg a TinyPNG-s API kulcsod (ha van)!'
    },
    'config': {
        'gmail_user': 'E-mail felhasználói név: ',
        'gmail_pass': 'E-mail jelszó: ',
        'toEmails': 'Teszt e-mail címek: ',
        'subjelct': 'Teszt e-mail tárgya: ',
        'zipname': 'Ügyfélnek szánt csomag neve: ',
        'tinyPngApi': 'TinyPNG API kulcs: '
    }

}
// If config file exist load that
if (fs.existsSync('./config.json')) {
    config = require('./config.json');
    var paths = config.paths;
}

// Functions

// Save config
function saveConfig(toConfig, toMenu) {
    fs.writeFile("./config.json", JSON.stringify(toConfig), function(err) {
        if(err) {
            console.log("A config fájl mentése sikertelen volt!");
        } else {
            console.log("A config fájl mentése sikeres volt!");
            config = require('./config.json');
            fs.chmod('./config.json', '0600');
            paths = config.paths;
            gulp.start(toMenu);
        }
    });
}

//Send mails
function nodemail(toEmails, emailVersions) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.gmail_user,
            pass: config.gmail_pass
        },
        debug: true
    });

    var images = fs.readdirSync("./img/", function (err, files) {return files});
    var toEmails = toEmails.replace(new RegExp(' ', 'g'), '').split(',').join(', ');

    var emailCount = 0;
    console.log('\n');
    emailVersions.forEach(function (file, index) {
        var mailImages = [];
        var htmlVersion = file.substring(1, 2);

        images.forEach(function (file, index) {
            var fileVersion = file.substring(1, 2);
            if (isNaN(fileVersion) || fileVersion == htmlVersion) {
                mailImages.push({
                    filename: file,
                    path: './img/' + file,
                    cid: file
                });
            }
        });
        fileName = 'compiled/' + file;
        fs.readFile(fileName, 'utf8', function (err,data) {
            var mailOptions = {
                from: config.gmail_user,
                to: toEmails,
                subject: config.subject + ' (' + file + ')',
                html: data.replace(new RegExp("../img/", 'g'), 'cid:'),
                attachments: mailImages
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log('Hiba: ' + error);
                } else {
                    console.log('Üzenet elküldve: ' + file + ' - ' + toEmails);
                    emailCount++;
                    if (emailCount >= emailVersions.length) {
                        console.log('Minden üzenet kiküldve');
                        console.log('\n');
                        gulp.start('prompt');
                    }
                }
            });
        });
    });
}

// Gulp set the config
gulp.task('first-config', function () {
    gulp.src('')
        .pipe(prompt.prompt([{
            type: 'input',
            name: 'gmail_user',
            message: messages.configLong.gmail_user
        },
        {
            type: 'password',
            name: 'gmail_pass',
            message: messages.configLong.gmail_pass
        },
        {
            type: 'input',
            name: 'toEmails',
            message: messages.configLong.toEmails
        },
        {
            type: 'input',
            name: 'subject',
            message: messages.configLong.subjelct
        },
        {
            type: 'input',
            name: 'zipName',
            message: messages.configLong.zipname
        },
        {
            type: 'input',
            name: 'tinyPngApi',
            message: messages.configLong.tinyPngApi
        }], function(res) {
            config.gmail_user = res.gmail_user;
            config.gmail_pass = res.gmail_pass;
            config.toEmails = res.toEmails;
            config.subject = res.subject;
            config.zipName = res.zipName;
            config.tinypngApiKey = res.tinyPngApi;
            saveConfig(config, 'prompt');
        }));
});

// Compile Sass files
gulp.task('sass', function() {
    return gulp.src(paths.scss)
        .pipe(sass())
        .pipe(gulp.dest('css/'));
});

//clean compiled folder
gulp.task('clean', function() {
    return gulp.src(paths.compiled, {read: false})
        .pipe(clean());
});

// Compile templates
gulp.task('compile', ['sass', 'clean'], function() {
    return gulp.src(paths.templates)
        .pipe(fileInclude({
            basepath: './partials',
            prefix: '@'
        }))
        .pipe(prettify({indentSize: 2}))
        .pipe(inlineCss({
            applyStyleTags: false,
            removeStyleTags: false
        }))
        .pipe(entities('decode'))
        .pipe(gulp.dest('./compiled/'));
});

//Compress PNG pictures
gulp.task('png-compress', function () {
    var tinypng = function(pngFiles) {
        if (pngFiles.length == 0) {
            gulp.start('prompt');
            return false;
        }
        var currentPNG = pngFiles[0];
        pngFiles.splice(0,1);

        var input = fs.createReadStream("./img/"+currentPNG);
        var options = require("url").parse("https://api.tinypng.com/shrink");
        options.auth = "api:" + config.tinypngApiKey;
        options.method = "POST";
        console.log(currentPNG + ' tömörítése');
        var request = https.request(options, function(response) {
            if (response.statusCode === 201) {
                https.get(response.headers.location, function(response) {
                    var output = fs.createWriteStream("./img/"+currentPNG);
                    response.pipe(output);
                    output.on('finish', function() {
                        output.close(function() {
                            console.log(currentPNG + ' tömörítve');
                            tinypng(pngFiles);
                        });
                    });
                });
            } else {
                console.log("Hiba: " + response.statusCode);
                return false;
            }
        });
        input.pipe(request);
    }
    fs.readdir("./img/", function (err, files) {
        var pngFiles = [];
        files.forEach(function (file, index) {
            if(path.extname(file) == ".png") {
                pngFiles.push(file);
            }
        });
        if (pngFiles.length <= 0) {
            console.log("Az img mappában nem található png kép!")
        } else {
            tinypng(pngFiles);
        }
    });
});

// Copy all content to dist folder
gulp.task('dist', ['compile'], function () {
    mkdirp('./dist', function() {
        var archive = new zip();

        var version = 1;
        var pngFiles = [];
        var otherFiles = [];
        var htmlFiles = [];
        var tempfile = './tempimage';
        var isTinyPNG = false;

        console.log('\nFájlok becsomagolása:\n');

        //Következő verziószám megállapítása
        fs.readdir('./dist/', function(err, files) {
            var versions = [];
            files.forEach(function (file, index) {
                var number = parseInt(file.split(new RegExp('_V', 'g')).slice(1, 2))
                versions.push(isNaN(number) ? 0 : number);
            });
            var maxVersion = Math.max.apply(Math, versions) + 1;
            version = maxVersion > 0 ? maxVersion : 1;
        });

        if (config.tinypngApiKey.length > 0) {
            isTinyPNG = true;
        }

        var tinypng = function(pngFiles) {
            if (pngFiles.length == 0) {
                if (fs.existsSync(tempfile)) {
                    fs.unlinkSync(tempfile);
                }
                allImages(otherFiles);
                return false;
            }
            var currentPNG = pngFiles[0];
            pngFiles.splice(0,1);
            var input = fs.createReadStream("./img/"+currentPNG);
            var output = fs.createWriteStream(tempfile);
            var options = require("url").parse("https://api.tinypng.com/shrink");
            options.auth = "api:" + config.tinypngApiKey;
            options.method = "POST";
            var request = https.request(options, function(response) {
                if (response.statusCode === 201) {
                    https.get(response.headers.location, function(response) {
                        response.pipe(output);
                        output.on('finish', function() {
                            output.close(function() {
                                archive.addFiles([ 
                                    { name: "img/"+currentPNG, path: tempfile }
                                ], function (err) {
                                    if (err) return console.log("err while adding files", err);

                                    var buff = archive.toBuffer();
                                    fs.writeFile('./dist/' + config.zipName + '_V' + version + '.zip', buff);
                                    console.log(currentPNG + ' becsomagolva');
                                    tinypng(pngFiles);
                                });
                            });
                        });
                    });
                } else {
                    console.log("Hiba: " + response.statusCode);
                    return false;
                }
            });
            input.pipe(request);
        }

        var allImages = function(otherFiles) {
            if (otherFiles.length == 0) {
                htmls(htmlFiles);
                return false;
            }
            var currentImage = otherFiles[0];
            otherFiles.splice(0,1);
            archive.addFiles([ 
                { name: "img/"+currentImage, path: "./img/"+currentImage }
            ], function (err) {
                if (err) return console.log("err while adding files", err);

                var buff = archive.toBuffer();
                fs.writeFile('./dist/' + config.zipName + '_V' + version + '.zip', buff);
                console.log(currentImage + ' becsomagolva');
                allImages(otherFiles);
            });
        }

        var htmls = function(htmlFiles) {
            if (htmlFiles.length == 0) {
                console.log('\nA csomag elkészült: ' + config.zipName + '_V' + version + '.zip\n');
                gulp.start('prompt');
                return false;
            }
            var currentHTML = htmlFiles[0];
            htmlFiles.splice(0,1);
            fs.readFile("./compiled/" + currentHTML, 'utf8', function (err,data) {
                archive.add(currentHTML, new Buffer(data.replace(new RegExp("../img/", 'g'), 'img/'), "utf8"));
                var buffer = archive.toBuffer();
                fs.writeFile('./dist/' + config.zipName + '_V' + version + '.zip', buffer);
                console.log(currentHTML + ' becsomagolva');
                htmls(htmlFiles);
            });
        }

        fs.readdir("./img/", function (err, files) {
            if (err) throw err;
            files.forEach(function (file, index) {
                if (isTinyPNG == true) {
                    if(path.extname(file) == ".png") {
                        pngFiles.push(file);
                    } else {
                        otherFiles.push(file);
                    }
                } else {
                    otherFiles.push(file);
                }
            });
            fs.readdir("./compiled/", function (err, files) {
                if (err) throw err;
                files.forEach(function (file, index) {
                    if(path.extname(file) == ".html") {
                        htmlFiles.push(file);
                    }
                    if (files.length-1 == index) {
                        if (isTinyPNG == true) {
                            tinypng(pngFiles);
                        } else {
                            allImages(otherFiles);
                        }
                    }
                });
            });
        });
    });
});

//Version of htmls
gulp.task('send-htmls', ['compile'], function () {
    var emailVersions = fs.readdirSync("./templates/", function (err, files) {return files});
    gulp.src('')
        .pipe(prompt.prompt([{
            type: 'checkbox',
            name: 'mail_versions',
            message: 'Melyik e-maileket szeretnéd kikülden? (Ha nem jelölsz ki egyet sem, az összes email ki lesz küldve)',
            choices: emailVersions
        }], function(res) {
            if (res.mail_versions.length > 0) {
                emailVersions = res.mail_versions;
            }
            nodemail(toMails, emailVersions);
        }));
});

//Config menu
gulp.task('config-menu', function () {
    var tinypngApiKeyVal = config.tinypngApiKey.length == 0 ? 'Nincs megadva kulcs' : config.tinypngApiKey;
    gulp.src('')
        .pipe(prompt.prompt([{
            type: 'list',
            name: 'edit_config',
            message: 'Config beállítása',
            choices: [
                messages.config.gmail_user + config.gmail_user,
                messages.config.gmail_pass + Array(config.gmail_pass.length+1).join("*"),
                messages.config.toEmails + config.toEmails,
                messages.config.subjelct + config.subject,
                messages.config.zipname + config.zipName,
                messages.config.tinyPngApi + tinypngApiKeyVal,
                'Vissza']
        }], function(res) {
            var editConfig = function(msg, to, oldValue, promptType, choices) {
                var promptType = typeof promptType !== 'undefined' ? promptType : 'input';
                var choicesArray = typeof choices !== 'undefined' ? choices.split(',') : '';
                gulp.src('')
                    .pipe(prompt.prompt([{
                        type: promptType,
                        name: 'config',
                        message: msg,
                        choices: choicesArray,
                        default: oldValue
                    }], function(res) {
                        config[to] = res.config;
                        saveConfig(config, 'config-menu');
                    }));
            }
            if (res.edit_config == 'Vissza') {
                gulp.start('prompt');
            }
            if (res.edit_config == messages.config.gmail_user + config.gmail_user) {
                editConfig(messages.configLong.gmail_user, 'gmail_user', config.gmail_user);
            }
            if (res.edit_config == messages.config.gmail_pass + Array(config.gmail_pass.length+1).join("*")) {
                editConfig(messages.configLong.gmail_pass, 'gmail_pass', '', 'password');
            }
            if (res.edit_config == messages.config.toEmails + config.toEmails) {
                editConfig(messages.configLong.toEmails, 'toEmails', config.toEmails);
            }
            if (res.edit_config == messages.config.subjelct + config.subject) {
                editConfig(messages.configLong.subjelct, 'subject', config.subject);
            }
            if (res.edit_config == messages.config.zipname + config.zipName) {
                editConfig(messages.configLong.zipname, 'zipName', config.zipName);
            }
            if (res.edit_config == messages.config.tinyPngApi + tinypngApiKeyVal) {
                editConfig(messages.configLong.tinyPngApi, 'tinypngApiKey');
            }
        }));
});

// Gulp menu choice
gulp.task('prompt', function () {
    if (!fs.existsSync('./config.json')) {
        gulp.start('first-config');
        console.log('\n\nMég nincs érvényes konfigurációs fájl!!!\n\n');
    } else {
        gulp.src('')
            .pipe(prompt.prompt([{
                type: 'list',
                name: 'task',
                message: 'Válassz a lehetőségek közül:',
                choices: ['Watch elindítása', 'PNG képek tömörítése TinyPNG használatával', 'Teszt e-mail kiküldése (Teszt címekre)', 'Teszt e-mail kiküldése (Az általad megadott címekre)', 'Csomag összeállítása ügyfélnek', 'Config beállítása', 'Teszt címek (info)', 'Kilépés']
            }], function(res) {
                if (res.task == 'Watch elindítása') {
                    gulp.start('watch');
                }
                if (res.task == 'PNG képek tömörítése TinyPNG használatával') {
                    gulp.start('png-compress');
                }
                if (res.task == 'Teszt e-mail kiküldése (Teszt címekre)') {
                    toMails = config.innerTestMails;
                    gulp.start('send-htmls');
                }
                if (res.task == 'Teszt e-mail kiküldése (Az általad megadott címekre)') {
                    toMails = config.toEmails;
                    gulp.start('send-htmls');
                }
                if (res.task == 'Csomag összeállítása ügyfélnek') {
                    gulp.start('dist');
                }
                if (res.task == 'Config beállítása') {
                    gulp.start('config-menu');
                }
                if (res.task == 'Teszt címek (info)') {
                    console.log('\n=============== E-mail fiókok listája ==============\n');
                    console.table([
                        {
                            'Szolgáltató': 'freemail.hu',
                            'Felhasználónév': 'example@freemail.hu',
                            'Jelszó': 'example'
                        },{
                            'Szolgáltató': 'citromail.hu',
                            'Felhasználónév': 'example@citromail.hu',
                            'Jelszó': 'example'
                        },{
                            'Szolgáltató': 'indamail.hu',
                            'Felhasználónév': 'example@indamail.hu',
                            'Jelszó': 'example'
                        },{
                            'Szolgáltató': 'gmail.com',
                            'Felhasználónév': 'example@gmail.com',
                            'Jelszó': 'example'
                        },{
                            'Szolgáltató': 'mail.yahoo.com',
                            'Felhasználónév': 'example@yahoo.com',
                            'Jelszó': 'example'
                        },{
                            'Szolgáltató': 'hotmail.com',
                            'Felhasználónév': 'example@hotmail.com',
                            'Jelszó': 'example'
                        },
                    ]);
                    gulp.start('prompt');
                }
                if (res.task == 'Kilépés') {
                    process.exit();
                }
            }));
    }
});


gulp.task('watch', ['compile'], function () {
    gulp.watch([paths.scss, paths.templates, paths.partials], ['compile']);
});
gulp.task('default', ['prompt']);