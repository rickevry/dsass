
let BridgeStyling = require('./BridgeStyling');

var fs = require('fs');
var scss = fs.readFileSync('test2.scss', 'utf8');

// let parser = new BridgeStyling.SassParser();
// let compiler = new BridgeStyling.SassCompiler();

function exec() {
    const ast = parser.parse(scss);
    console.log(JSON.stringify(ast, null, 2));

//    const result = compiler.compile(ast);
}

async function exec2() {
    let className = BridgeStyling.useStyle(scss);
    console.log("got className", className);

    // const ast = parser.parse(scss);
    // console.log(JSON.stringify(ast, null, 2));
}

exec2();

