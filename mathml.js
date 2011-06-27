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
    functions: {},
    registerFunction: function (name, arity, applyMethod) {
	this.functions[name] = {
	    name: name,
	    arity: arity,
	    apply: applyMethod
	};
	this[name] = function (node) {
	    if (node.firstElementChild) {
		throw "<" + name + "> should be an empty tag";
	    }
	    return expr.Parameter(name);
	};
    },
    parse: function (el) {
	if (this[el.tagName]) {
	    var e = this[el.tagName](el);
	    return e;
	} else {
	    return expr.editExpr();
	}
    },
    parseFunc: function (funcName, args) {
	var func = this.functions[funcName];
	if (!func) {
	    throw "unknown function: " + funcName;
	}
	if (func.arity) {
	    if (args.length !== func.arity) {
		throw ("Function " + funcName + "expects " +
		       func.arity + " arguments, got " + args.length);
	    }
	    return func.apply.apply(func, args);
	} else {
	    return func.apply.call(func, args);
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

var mathMLElements = {
    unaryStandardFunctions: [
	'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
	'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
	'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot',
	'arcsinh', 'arccosh', 'arctanh', 'arcsech', 'arccsch', 'arccoth',
	'exp', 'ln', 'log'
    ]
};

mathMLElements.unaryStandardFunctions.forEach(function (fn) {
    mathMLParser.registerFunction(fn, 1, function (arg) {
	return expr.trigFunction(fn, arg);
    });
});

mathMLParser.registerFunction("plus", null, function (args) {
    return expr.sum(args);
});
mathMLParser.registerFunction("times", null, function (args) {
    return expr.product(args);
});
mathMLParser.registerFunction("power", 2, function (base, pow) {
    return expr.power(base, pow);
});
mathMLParser.registerFunction("minus", null, function (args) {
    if (args.length === 1) {
	return expr.negation(args[0]);
    } else if (args.length === 2) {
	return expr.sum(args[0], expr.negation(args[1]));
    } else {
	throw "minus expects 1 or 2 arguments, got " + args.length;
    }
});
mathMLParser.registerFunction("divide", 2, function (num, den) {
    return expr.fraction(num, den);
});
