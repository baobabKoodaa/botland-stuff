var fs = require('fs');
var path = require('path');

function minify(jsFileContent) {
    out = []
    // Remove comments
    var content = jsFileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1'); // https://stackoverflow.com/a/15123777/4490400
    var lines = content.split('\n');
    for(var i=0; i<lines.length; i++){
        var line = lines[i];
        // Remove whitespace
        line = line.trim();
        // Remove semicolons
        if (line.slice(-1) == ';') line = line.substring(0, line.length-1)
        out.push(line)
    }
    return out
}

function minifyBotFile(bot) {
    const filepath = path.resolve("bots", bot+".js");
    var content = fs.readFileSync(filepath, 'utf8');
    return minify(content)
}

function minifyCommonFiles() {
    const files = [];
    const dir = "common"

    fs.readdirSync("common").forEach(filename => {
        const filepath = path.resolve(dir, filename);
        const stat = fs.statSync(filepath);
        const isFile = stat.isFile();

        if (isFile) files.push({ filepath });
    });

    out = []
    files.forEach(function(file) {
        var content = fs.readFileSync(file.filepath, 'utf8');
        out = out.concat(minify(content))
    })
    return out
}

function countCharacters(arr) {
    var count = 0
    for (var j=0; j<arr.length; j++) {
        line = arr[j]
        count += line.length
    }
    return count;
}

function assertNoDuplicateFunctionDefinitions(arr) {
    functionNames = new Set()
    for (var j=0; j<arr.length; j++) {
        line = arr[j]
        if (line.includes(" = function")) {
            var name = line.split(" ")[0]
            if (functionNames.has(name)) {
                console.log("Warning! Potentially duplicate function definition discovered for", name);
            }
            functionNames.add(name)
        }
    }
}

function printLines(arr) {
    for (var j=0; j<arr.length; j++) {
        line = arr[j]
        console.log(line)
    }
}

if (process.argv.length < 3) {
    console.log('Error! You need to specify bot as a command line parameter ("application parameter" in IntelliJ).')
    console.log('For example, if you want to compile bots/crusher.js, then use "crusher" as the command line parameter.')
    return
}

// Command line argument defines which bot to compile.
bot = process.argv[2]

// Minify and merge files.
minifiedBotFile = minifyBotFile(bot)
minifiedCommonFiles = minifyCommonFiles()
minifiedFiles = minifiedBotFile.concat(minifiedCommonFiles)

// Additional checks.
chars = countCharacters(minifiedFiles)
assertNoDuplicateFunctionDefinitions(minifiedFiles)

console.log('/*******************', bot, chars, 'characters ******************/\n\n')
printLines(minifiedFiles)