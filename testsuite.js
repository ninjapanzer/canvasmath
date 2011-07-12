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
    "6!",
    "sum xy",
    "sum from (i=1) to n (1/i)",
    "product from (k=1) to n (1 - 1/k)",
    "integral from 0 to 1 (y differential x)",
    "integral from 0 to (pi/2) ((sinx) differential x)",
    "integral fg"
];

window.addEventListener("load", function () {
    var tbody = $("tests");
    tests.forEach(function (test) {
	var e = editor.parse(test);
	var mathmlText = MathMLSerializer.serialize(e);
	// The following doesn't recognise entities such as &alpha;
	// (and also I don't know if IE9 supports it)
	/*
	var parser = new DOMParser();
	var mathml = parser.parseFromString(mathmlText, "text/xml").firstChild;
	*/
	// So fallback onto innerHTML, which does, but has trouble parsing
	// empty elements e.g. <plus/>, which is why empty elements are 
	// serialized as e.g. <plus></plus> :(
	var parent = $.make("math");
	parent.innerHTML = mathmlText;
	var mathml = parent.firstElementChild;
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
