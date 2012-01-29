window.addEventListener("load", function () {

var layout = cvm.layout;
var mathMLParser = cvm.mathml.parser;

var domParser = new DOMParser();

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var text = "<apply><root/><apply><divide/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply></apply>";

var mathML2Expr = function (text) {
    var mathml = domParser.parseFromString(text, "text/xml").firstChild;
    return mathMLParser.parse(mathml);
};

var getBox = function (e) {
    return layout.ofExpr(e).box();
};

var expression = mathML2Expr(text);
var box = getBox(expression);
box.drawOnCanvas(ctx, 10, 100);

});
