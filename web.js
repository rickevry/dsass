let parser = new BridgeStyling.SassParser();

let loadStyle = async (styleName) => {
    const response = await fetch(styleName);
    const text = await response.text();
    return text;
        // }).catch(() => alert("Load style error"));
}

async function exec() {
    const scss = await loadStyle('./test.scss');
    let className = useStyle(scss);

    console.log("got className", className);

    // const ast = parser.parse(scss);
    // console.log(JSON.stringify(ast, null, 2));
}

exec();
