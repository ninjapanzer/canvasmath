var transformInline = function (tagname) {
    var element, i, text;
    var edit, root, canvas, box, ctx;
    var elements = document.getElementsByTagName(tagname || "cvm");
    initBox();
    for (i = elements.length - 1; i >= 0; i--) {
	element = elements[i];
	text = element.innerHTML;
	edit = expr.editExpr();
	root = expr.root(edit);
	editor.interpret(edit, text);
	box = layout.ofExpr(root).box();
	canvas = $.make("canvas", {
	    width: box.width,
	    height: box.height,
	    style: "vertical-align: " + box.descent + ";"
	});
	ctx = canvas.getContext("2d");
	box.drawOnCanvas(ctx, 0, box.ascent);
	element.parentNode.replaceChild(canvas, element);
    }
};

if (!this.preventAutomaticTransform) {
    window.onload = function () {
	transformInline();
    };
}

