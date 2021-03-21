class Tokenizer {

    Shared = [
        [/^\/\*[\s\S]*?\*\//, null], // multi line comments
        [/^\/\/.*/, null], // single line comments
        [/^\s+/, null], // whitespace
    ];
    
    Spec1 = [
        ...this.Shared,
        [/^\blet\b/, "let"],
        [/^\bif\b/, "if"],
        [/^\belse\b/, "else"],
        [/^\true\b/, "true"],
        [/^\false\b/, "false"],
        [/^\null\b/, "null"],
        [/^\d+/, "NUMBER"],
        [/^\$[\w\-]+/, 'IDENTIFIER'], // IDENTIFIER
        [/^"[^*]*"/, "STRING"],
        [/^'[^*]*'/, "STRING"],
        [/^[^{]+/, 'SELECTOR'], 
        [/^;/, ';'], // ;
        [/^\{/, '{'], // {
        [/^\}/, '}'], // }
        [/^\(/, '('], // (
        [/^\)/, ')'], // )
        [/^,/, ','], // ,
        [/^\w+/, 'IDENTIFIER'], // IDENTIFIER
        [/^[=!]=/, 'EQUALITY_OPERATOR'],
        [/^=/, 'SIMPLE_ASSIGN'], // SIMPLE_ASSIGN
        [/^[\*\/\+\-]=/, 'COMPLEX_ASSIGN'], // COMPLEX_ASSIGN
    ];
    
    Spec2 = [
        ...this.Shared,
        [/^\}/, '}'], // }
        [/^\@extend/, 'EXTEND'], 
        [/^[^:]+/, 'PROPERTY'], 
        [/^\:/, ':'], // }
    ];
    
    OnlyValueExpression = [
        ...this.Shared,
        // [/^\$[^;]+/, 'VARIABLE_LITTERAL'], 
        [/^\$[\w-]+/, 'VARIABLE_LITTERAL'], 
    
        [/^[^;$]+/, 'LITTERAL'], 
        [/^\}/, '}'], // }
        [/^\:/, ':'], // }
        [/^;/, ';'], // ;
    ];
    
    Spec4 = [
        ...this.Shared,
        [/^\.[\w\-]+/, 'SELECTOR'], // SELECTOR
        [/^\}/, '}'] // }
    ];
    
    OnlyColon = [
        ...this.Shared,
        [/^\:/, ':'],
    ];

    constructor() {
    }

    init(string) {
        this._string = string;
        this._cursor =  0;
        this._mode = 1;
    }

    getSpec() {
        switch (this._mode) {
            case 1: return this.Spec1;
            case 2: return this.Spec2;
            case "OnlyValueExpression": return this.OnlyValueExpression;
            case 4: return this.Spec4;
            case "OnlyColon": return this.OnlyColon;
        }
        throw SyntaxError("Bad mode " + this._mode);
    }

    setMode(mode) {
        this._mode = mode;
    }

    hasMoreTokens() {
        return this._cursor < this._string.length;
    }

    isNumber(s) {
        return !Number.isNaN(Number(s));
    }

    isEOF() {
        return this._cursor === this._string.length;
    }

    getNextToken() {
        if (!this.hasMoreTokens()) {
            return null;
        }
        const string = this._string.slice(this._cursor);

        for (const [regexp, type] of this.getSpec()) {
            const value = this._match(regexp, string);
            if (value==null) {
                continue;
            }
            if (type==null) {
                return this.getNextToken();
            }
            return { type, value };
        }
        
        throw SyntaxError(`Unexpected token ${string[0]}`);
    }

    _match (regexp, string) {
        let matched = regexp.exec(string);
        if (matched == null) {
            return null;
        } 
        this._cursor += matched[0].length;
        let r = matched[0];
        return r;
    } 

}

class SassParser {

    _cleanUpSelector(str) {
        return str.split('\r').join('').split('\n').join(' ').split('  ').join(' ').trim();
    }

    constructor() {
        this._string = '';
        this._tokinizer = new Tokenizer();
    }

    parse(string) {
        this._string = string;
        this._tokinizer.init(string);
        
        // llo1
        this._lookahead = this._tokinizer.getNextToken();

        return this.Program();
    }

    init() {
        console.log("hejsan");
    }

    Program() {
        return {
            type: "Program",
            body: this.StatementList()
        }
    }

    StatementList(stopLookahead = null) {
        const statementList = [this.Statement()];
        while (this._lookahead != null && this._lookahead.type !== stopLookahead) {
            statementList.push(this.Statement());
        }
        return statementList;
    }

    Statement() {

        console.log(this._lookahead.type);
        let a = 1;
        switch (this._lookahead.type) {
            // case ';': return this.EmptyStatement();
            case 'IDENTIFIER': return this.VariableDeclaration();
            case 'SELECTOR': return this.RuleSet();
            // case ';': return this.EmptyStatement();
            // case 'if': return this.IfStatement();
            // case '{': return this.BlockStatement();
            // default : return this.ExpressionStatement();
        }
        return null;
    }
    
    RuleSet() {
        let selector = this.Selector();
        this._eat('{', 2);
        let declarations = this.Declarations2();
        return {
            type: "RuleSet",
            selector,
            declarations
        }
    }

    Selector() {
        const selector = this._eat('SELECTOR').value;
        return {
            type: "Selector",
            selector: this._cleanUpSelector(selector)
        }
    }



    Extend() {
        if (this._lookahead.type == "EXTEND") {
            this._eat('EXTEND',4);
            let extend = this._eat('SELECTOR',"OnlyValueExpression");
            this._eat(';',2);
            return {
                type: "ExtendStatement",
                extend
            }
        }
        else {
            return this.Declaration();
        }
    }

    Declaration() {
        let property = this.Property();
        this._eat(':', "OnlyValueExpression");
        let values = this.ValueExpression();
        this._eat(';', 2);
        return {
            type: "DeclarationStatement",
            property,
            values,
        }
    }

    Property() {
        const name = this._eat('PROPERTY').value;
        return {
            type: "Property",
            name
        }
    }

    ValueExpression() {
        const expression = [];

        do {
            if (this._lookahead.type == "VARIABLE_LITTERAL") {
                expression.push(this.VariableLitteral());
            } else {
                expression.push(this.Litteral());
            }
            let a = 1;
        } while (this._lookahead.type != ";");
        return {
            type: "CONCAT_EXPRESSION",
            expression
        }    
    }

    VariableLitteral() {
        const value = this._eat('VARIABLE_LITTERAL').value;
        return {
            type: "VariableLitteral",
            value
        }    
    }

    Litteral() {
        const value = this._eat('LITTERAL').value;
        return {
            type: "Litteral",
            value
        }    
    }

    VariableDeclaration() {
        let declarations = [this.Declarations1()];
//        let value = this._eat('STRING_LITTERAL').value;
        return {
            type: "VariableDeclaration",
            declarations,
        }
    }

    Declarations1() {
        let id = this.Identifier("OnlyColon");
        this._eat(':',"OnlyValueExpression")
        let init = this.ValueExpression();
        this._eat(';',1);
        return {
            type: "VariableDeclarator",
            id,
            init
        }
    }

    Declarations2() {
        const declarations = [];
        while (this._lookahead.type !== '}') {
            declarations.push(this.Extend());
        } 
        this._eat('}', 1);
        return declarations;
    }

    Identifier(nextState) {
        let name = this._eat('IDENTIFIER',nextState).value;
        return {
            type: "Identifier",
            name,
        }
    }

    EmptyStatement() {
        this._eat(';');
        return {
            type: 'EmptyStatement'
        }
    }

    BlockStatement() {
        this._eat('{');
        const body = this._lookahead.type !== '}' ? this.StatementList('}') : [];
        this._eat('}');
        return {
            type: 'BlockStatement',
            body
        }
    }

    // Identifier() {
    //     const name = this._eat('IDENTIFIER').value;
    //     return {
    //         type: "Identifier",
    //         name
    //     }
    // }

    checkValidAssigmentTarget(node) {
        if (node.type == "Identifier") {
            return node;
        }
        throw new SyntaxError("Invalid left-hand side in assigment expression");
    }

    _isAssigmentOperator(tokenType) {
        return this._lookahead.type == "SIMPLE_ASSIGN" || this._lookahead.type == "COMPLEX_ASSIGN";
    }

    AssigmentOperator() {
        if (this._lookahead.type == "SIMPLE_ASSIGN") {
            return this._eat("SIMPLE_ASSIGN");
        }
        return this._eat("COMPLEX_ASSIGN");
    }

    AdditiveExpression() {
        return this._BinaryExpression("MultiplicativeExpression", "ADDITIVE_OPERATOR");
    }

    MultiplicativeExpression() {
        return this._BinaryExpression("UnaryExpression", "MULTIPLICATIVE_OPERATOR");
    }

    _LogicalExpression(builderName, operatorToken) {
        let left = this[builderName]();
        while (this._lookahead.type == operatorToken) {
            const operator = this._eat(operatorToken).value;
            const right = this[builderName]();
            left = {
                type: "LogicalExpression",
                operator,
                left,
                right
            }
        }
        return left;
    }

    _BinaryExpression(builderName, operatorToken) {
        let left = this[builderName]();
        while (this._lookahead.type == operatorToken) {
            const operator = this._eat(operatorToken).value;
            const right = this[builderName]();
            left = {
                type: "BinaryExpression",
                operator,
                left,
                right
            }
        }
        return left;
    }

    PrimaryExpression() {
        if (this._isLitteral(this._lookahead.type)) {
            return this.Literal();
        }
        switch (this._lookahead.type) {
            case '(': return this.ParenthesizedExpression();
            case 'IDENTIFIER': return this.Identifier();
            default: return this.LeftHandSideExpression(); 
        }
    }

    _isLitteral(tokenType) {
        return tokenType === 'NUMBER' || 
        tokenType === 'STRING' || 
        tokenType === 'true' || 
        tokenType === 'false' || 
        tokenType === 'null'
    }

    ParenthesizedExpression() {
        this._eat('(');
        const expression = this.Expression();
        this._eat(')');
        return expression;
    }

    _eat(tokenType, nextMode) {
        const token = this._lookahead;
        if (token == null) {
            throw new SyntaxError('Unexpected end of input ' +  tokenType);
        }
        if (token.type !== tokenType) {
            throw new SyntaxError('Unexpected token, wanted ' + tokenType + " found " + token.type);
        }
        if (nextMode) {
            this._tokinizer.setMode(nextMode);
        }
        this._lookahead = this._tokinizer.getNextToken();
        return token;
    }
}

class SassCompiler {
    constructor() {
    }

    compile(ast) {
        let rules = [];

        const compileValue = (acc, current) => {
            return current.value;
        }

        const compileDeclaration = (acc, current) => {
            switch (current.type) {
                case "ExtendStatement": break;
                case "DeclarationStatement": 
                    let name = current.property.name;
                    let value = Array.isArray(current.values) ? current.values.reduce(compileValue, "") : "";
                    acc += `${name}:${value}\n`
                break;

                default: 
                let a = 1;
                break;
            }
            return acc;
        }

        if (ast && ast.type == "Program") {
            for (let f of ast.body) {
                if (f.type == "RuleSet") {
                    let selector = f.selector.selector;
                    let ruleSet = f.declarations.reduce(compileDeclaration, "");
                    rules.push(`${selector} { ${ruleSet} }`);
                }
            }
        }
        return rules;
    }
}

class SassStyler {
    style = undefined;
    styleCounter = 100;
    cache = {};
    myContextValue = {};
    myContext = null;
    cachedFuncs = {};
    classNameDict = {};
    compiler = new SassCompiler();
    parser = new SassParser();
    
    init() {
        // this.myContext = React.createContext(myContextValue)
        if (typeof document === 'undefined') {
            // create fake style object
            this.style = {
                sheet: {
                    insertRule: () => {}
                }
            }
        } else {
            this.style = document.createElement('style');
            this.style.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(this.style);
        }
    }
    
    insertCss(css) {
        if (!this.style) {
            this.init();
        }
        console.log("insert rule", css);
        this.style.sheet.insertRule(css, 0);
    }

    replaceBridgeExpressions = (css, props) => {
        let result = css;
        let r = null;
        let re = /≤(.*?)≥/;
        while ((r = re.exec(result)) !== null) {
            const str = r[0];
            const key = r[1];
            const value = props[key];
            result = result.replace(str, value);
            // console.log("r",r);
            // debugger;
        }
        // console.log("result", result);
        return result;
    }

    compileStyle(className, sass, props) {

        let ast = this.parser.parse(sass);
        let cssRules = this.compiler.compile(ast);

        let css = cssRules.join("\n");
        if (css) {
            props = props || {};
    
            let css1 = "";
            if (css.startsWith("*")) {
                css1 = css.substring(1);
                console.error("not supported");
            } else {
                css1 = css.split(".component").join("." + className);
            }
        
            let css2 = this.replaceBridgeExpressions(css1, props);
            return css2;
        } 
        return "";
    }
    
    useStyle(name, css , func = null, dependencies = null) {
        dependencies = dependencies || [];
        dependencies = [css, ...dependencies];
    
        func = func || (() => ({}));
        css = css || "";
    
        // let upp något 
        let dict = this.classNameDict;
        let prevDict = undefined;
        let lastDependency = undefined;
        for (let currentDependency of dependencies) {
            let nextDict = dict[currentDependency];
            if (!nextDict) {
                nextDict = {};
                if (!dict) {
                    debugger;
                }
                dict[currentDependency] = nextDict;
            }
            prevDict = dict;
            dict = nextDict;
            lastDependency = currentDependency;
        }
    
        if (typeof dict == "string") {
            // found classname
            return dict;
        } else {
            this.styleCounter++;
            let className = name || "BS_" + this.styleCounter;
            const props = func ? func() : {};
            let newCss = this.compileStyle(className, css, props);
            this.insertCss(newCss);
            prevDict[lastDependency] = className;
            return className;
        }
    }
    
}
/*

*/ 

// behöver exmpel på hur dependencies används

let styler_EA16CBE = null;
let useStyle = (css, func = null, dependencies = null) => {
    if (!styler_EA16CBE) {
        styler_EA16CBE = new SassStyler();
    }
    console.log("use style", css);
    return styler_EA16CBE.useStyle(undefined, css, func, dependencies);
}

let BridgeStyling = {
    SassParser,
    SassCompiler,
    SassStyler,
    useStyle
}

if (typeof window === "undefined") {
    module.exports = BridgeStyling;
}

// fixa compilering av AST
// 30 minuter

// få igång enkel sass på en sida
// 30 minuter

// testa func och gör exempel
// 30 minuter

// testa dependencies och gör exempel
// 30 minuter

// få igång tailwind
