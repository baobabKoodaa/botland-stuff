var fs = require('fs');
var path = require('path');

function parseImports(bot) {
    var imports = []
    const filepath = path.resolve("bots", bot+".js")
    var content = fs.readFileSync(filepath, 'utf8')
    var lines = content.split('\n')
    for(var i=0; i<lines.length; i++) {
        var line = lines[i].trim()
        if (line.startsWith("//!import")) {
            imports.push(line.split(" ")[1])
        }
    }
    return imports
}

function countBrackets(line) {
    countOpen = (line.match(/{/g) || []).length
    countClose = (line.match(/}/g) || []).length
    return countOpen - countClose
}

function separateFunctions(arr) {
    var functions = {}
    var balance = 0
    var name = ""
    for (var j=0; j<arr.length; j++) {
        line = arr[j]
        if (line.includes("=function")) {
            name = line.split("=function")[0]
            if (functions[name]) error("Error! Potentially duplicate function definition discovered for", name)
            if (balance != 0) error("Error in separateFunctions (possibly unexpected syntax discovered).")
            functions[name] = []
        }
        balance += countBrackets(line)
        functions[name].push(line)
    }
    return functions
}

function error(s) {
    throw new Error(s)
}

function removeUnusedFunctions(functions, APIendpoints) {
    var linesFromUsedFunctions = []
    var functionsToProcess = ['init', 'update'] // we append this as we discover more called functions
    for (var i=0; i<functionsToProcess.length; i++) {
        var currName = functionsToProcess[i]
        var currFunc = functions[currName]
        for (var j=0; j<currFunc.length; j++) {
            var line = currFunc[j]
            linesFromUsedFunctions.push(line)

            // Try to recognize other functions which we call from this function
            var splitted = line.split('(')
            for (var k=0; k<splitted.length-1; k++) {
                var splitted2 = splitted[k].split(/[\s,\+\-\*\\\=!]+/)
                var otherName = splitted2[splitted2.length-1]
                if (['function', 'if', ''].includes(otherName)) continue
                if (APIendpoints[otherName]) continue
                if (!functions[otherName]) error("Error! Unrecognized function " + otherName)
                if (functionsToProcess.includes(otherName)) continue
                functionsToProcess.push(otherName)
                //console.log("Recognized function", otherName)
            }
        }
    }
    return linesFromUsedFunctions
}

function minify(jsFileContent) {
    out = []
    // Remove comments
    var content = jsFileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // https://stackoverflow.com/a/15123777/4490400
    var lines = content.split('\n')
    for (var i=0; i<lines.length; i++) {
        var line = lines[i]
        // Remove whitespace, end-of-line-semicolons, unnecessary spaces
        line = line.trim()
        if (line.slice(-1) == ';') line = line.substring(0, line.length-1)
        line = line.replace(' = ', '=')
        line = line.replace(' == ', '==')
        line = line.replace('; ', ';')
        line = line.replace('if (', 'if(')
        line = line.replace(' else', 'else')
        line = line.replace('else {', 'else{')
        line = line.replace(') {', '){')
        // Remove empty lines
        if (line.length > 0) out.push(line)
    }
    return out
}

function minifyBotFile(bot) {
    const filepath = path.resolve("bots", bot+".js")
    var content = fs.readFileSync(filepath, 'utf8')
    return minify(content)
}

function minifyAPIendpoints() {
    const filepath = path.resolve("dummyAPIendpoints.js")
    var content = fs.readFileSync(filepath, 'utf8')
    return minify(content)
}

function minifyCommonFiles(imports) {
    const files = [];
    const dir = "common"

    fs.readdirSync("common").forEach(filename => {
        const filepath = path.resolve(dir, filename);
        const stat = fs.statSync(filepath);
        const isFile = stat.isFile();
        if (isFile) {
            const fileNameWithoutExtension = filename.split(".")[0]
            if (imports.includes(fileNameWithoutExtension)) {
                files.push({ filepath });
            }
        }
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
        count += 1 // Line break
    }
    return count;
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
imports = parseImports(bot)
minifiedBotFile = minifyBotFile(bot)
minifiedCommonFiles = minifyCommonFiles(imports)
minifiedFiles = minifiedBotFile.concat(minifiedCommonFiles)

// Remove unused functions.
functions = separateFunctions(minifiedFiles)
APIendpoints = separateFunctions(minifyAPIendpoints())
prunedFunctions = removeUnusedFunctions(functions, APIendpoints)
// TODO minify in order of high length to low length (because some attribute names may be also part of a longer attribute name)
// TODO replace literals with their actual values (careful to make sure the variable is defined only once!)

// Additional checks.
chars = countCharacters(prunedFunctions)

console.log('/*******************', bot, chars, 'characters ******************/\n\n')
printLines(prunedFunctions)