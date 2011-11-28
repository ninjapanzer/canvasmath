var transformInline = function (tagname) {
    var element, i, text;
    var root, canvas;
    var elements = document.getElementsByTagName(tagname || "cvm");
    cvm.box.init();
    $(tagname || "cvm").each(function () {
	var el = $(this);
	text = el.text();
	root = cvm.edit.parser.parse(text);
	root.selectable = el.attr("selectable");
	root.editable = el.attr("editable");
	canvas = cvm.expr.drawOnNewCanvas(root);
	el.replaceWith(canvas);
    });
};

if (!this.preventAutomaticTransform) {
    window.addEventListener("load", function () {
	transformInline();
    }, false);
}
