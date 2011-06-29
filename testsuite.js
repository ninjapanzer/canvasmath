var tests = [
    "1+2*54",
    "-12-3*2",
    "1/2 + 2/3",
    "sqrt(12)",
    "3x^5-2x^4+3x-1",
    "(3root2)^2",
    "alpha + beta gamma",
    "sinxcosx + tanx",
    "arcsinx",
    "abs((1+x)/(1-x))",
    "floor(n) + ceil(n^2)",
    "6!"
];

window.addEventListener("load", function () {
    var tbody = $("tests");
    tests.forEach(function (test) {
	var e = editor.parse(test);
	var mathmlText = MathMLSerializer.serialize(e);
	var parser = new DOMParser();
	var mathml = parser.parseFromString(mathmlText, "text/xml").firstChild;
	var parsedMathML = mathMLParser.parse(mathml);
	var row = $.make("tr",
	    $.make("td", $.make("pre", test)),
	    $.make("td", expr.drawOnNewCanvas(e)),
	    $.make("td", $.make("pre", mathmlText)),
	    $.make("td", expr.drawOnNewCanvas(parsedMathML))
	);
	tbody.appendChild(row);
    });
}, false);
