var mathMLTransformInline = function (tagname) {
    var element, i, text;
    var edit, root, canvas, box, ctx;
    var elements = document.getElementsByTagName(tagname || "math");
    initBox();
    for (i = elements.length - 1; i >= 0; i--) {
	element = elements[i];
	root = mathMLParser.parse(element.firstElementChild);
	box = layout.ofExpr(root).box();
	canvas = $.make("canvas", {
	    width: box.width + 2, // +2 is for IE9...
	    height: box.height,
	    style: "vertical-align: " + box.descent + "px;"
	});
	ctx = canvas.getContext("2d");
	box.drawOnCanvas(ctx, 0, box.ascent);
	element.parentNode.replaceChild(canvas, element);
    }
};

if (!this.preventAutomaticTransform) {
    window.addEventListener('load', function () {
	mathMLTransformInline();
    });
}

var mathMLParser = {
    parse: function (el) {
	if (this[el.tagName]) {
	    var e = this[el.tagName](el);
	    return e;
	} else {
	    return expr.editExpr();
	}
    },
    parseFunc: function (funcName, args) {
	if (this[funcName]) {
	    return this[funcName](args);
	} else {
	    return expr.editExpr("?" + funcName + "?");
	}
    },
    apply: function (node) {
	var el = node.firstElementChild;
	var funcName = el.tagName;
	var args = [];
	el = el.nextElementSibling;
	while (el) {
	    args.push(this.parse(el));
	    el = el.nextElementSibling;
	}
	return this.parseFunc(funcName, args);
    },
    plus: function (args) {
	return expr.sum(args);
    },
    times: function (args) {
	return expr.product(args);
    },
    power: function (args) {
	return expr.power(args[0], args[1]);
    },
    sin: function (args) {
	return expr.trigFunction("sin", args[0]);
    },
    ci: function (el) {
	return expr.parameter(el.textContent);
    },
    cn: function (el) {
	return expr.number(el.textContent);
    }    
};

