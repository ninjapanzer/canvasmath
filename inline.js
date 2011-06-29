var transformInline = function (tagname) {
    var element, i, text;
    var root, canvas;
    var elements = document.getElementsByTagName(tagname || "cvm");
    initBox();
    for (i = elements.length - 1; i >= 0; i--) {
	element = elements[i];
	text = element.innerHTML;
	root = editor.parse(text);
	canvas = expr.drawOnNewCanvas(root);
	element.parentNode.replaceChild(canvas, element);
    }
};

if (!this.preventAutomaticTransform) {
    window.addEventListener("load", function () {
	transformInline();
    }, false);
}
