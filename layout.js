var layout = {
    ofExpr: function (expr) {
	var l;
	if (expr.selected) {
	    expr = expr.selected;
	}
	return expr.layout(this);
    },
    select: function (l) {
	return this.frame({background: "#AAFFAA"}, l);
    },
    train: function () {
	var elems = arguments;
        if (elems.length === 1) {
	    elems = elems[0];
	} else {
	    var filter = Array.prototype.filter;
	    elems = filter.call(elems, function () { return true; });
	}
	return LTrain.instanciate(elems);
    },
    text: function (text, style) {
	return LText.instanciate(text, style);
    },
    scale: function (elem, scale) {
	return LScale.instanciate(elem, scale);
    },
    bracket: function (elem, color) {
	return LLREnclosure.instanciate(elem, "(", ")", color);
    },
    lrEnclosure: function (elem, left, right, color) {
	return LLREnclosure.instanciate(elem, left, right, color);
    },
    superscript: function (elem, superscript) {
	return LSuperscript.instanciate(elem, superscript);
    },
    hspace: function (width) {
	return LHSpace.instanciate(width);
    },
    vspace: function (height) {
	return LVSpace.instanciate(height);
    },
    stack: function (elems, baseline) {
	return LStack.instanciate(elems, baseline);
    },
    hline: function (width, height) {
	return LHLine.instanciate(width, height);
    },
    color: function (color, elem) {
	return LColor.instanciate(color, elem);
    },
    frame: function (style, elem) {
	return LFrame.instanciate(style, elem);
    },
    raise: function (height, elem) {
	return LRaise.instanciate(height, elem);
    },
    sqrt: function (elem) {
	return LSqrt.instanciate(elem);
    },
    table: function (array, hspace, vspace) {
	return LTable.instanciate(array, hspace, vspace);
    }
};

var Layout = {
    bindExpr: function (expr, key) {
	if (!this.boundExprs) {
	    this.boundExprs = [];
	}
	this.boundExprs.push({expr: expr, key: key});
    }
};
Layout = Prototype.specialise(Layout);

var LTrain = {
    __name__: "LTrain",
    __init__: function (elems) {
	this.elems = elems;
    },
    box: function () {
	var boxes = this.elems.map(function (elem) {
	    return elem.box();
	});
	var train = Train.instanciate(boxes);
	train.bindLayout(this);
	return train;
    }
};
LTrain = Layout.specialise(LTrain);

var LText = {
    __name__: "LText",
    __init__: function (text, style) {
	this.text = text;
	this.style = style || {};
    },
    box: function () {
	var font = [];
	var style = this.style;
	var box;
	style.style && font.push(style.style);
	style.variant && font.push(style.variant);
	style.weight && font.push(style.weight);
	font.push(style.size || "20px");
	font.push(style.family || "serif");
	this.font = font.join(" ");
	box = TextBox.instanciate(this.text, this.font);
	box.bindLayout(this);
	return box;
    }
};
LText = Layout.specialise(LText);

var LScale = {
    __name__: "LScale",
    __init__: function (elem, scale) {
	this.elem = elem;
	this.scale = scale;
    },
    box: function () {
	var box = Scale.instanciate(this.elem.box(), this.scale);
	box.bindLayout(this);
	return box;
    }
};
LScale = Layout.specialise(LScale);

var LBracket = {
    __name__: "LBracket",
    __init__: function (elem, color) {
	this.elem = elem;
	this.color = color;
    },
    box: function () {
	var box = this.elem.box();
	var left = Paren.instanciate(box);
	var right = Paren.instanciate(box, true);
	if (this.color) {
	    left = ColorBox.instanciate(this.color, left);
	    right = ColorBox.instanciate(this.color, right);
	}
	var train = Train.instanciate(left, box, right);
	left.bindLayout(this, "left");
	right.bindLayout(this, "right");
	train.bindLayout(this);
	return train;
    }
};
LBracket = Layout.specialise(LBracket);

var LLREnclosure = {
    __name__: "LLREnclosure",
    __init__: function (elem, left, right, color) {
	this.elem = elem;
	this.left = left;
	this.right = right;
	this.color = color;
    },
    box: function () {
	var box = Stack.instanciate([
	    VSpace.instanciate(2),
	    this.elem.box(),
	    VSpace.instanciate(2)
	], 1);
	var left = this.left && getElasticBox(this.left, box);
	var right = this.right && getElasticBox(this.right, box);
	if (this.color) {
	    left = left && ColorBox.instanciate(this.color, left);
	    right = right && ColorBox.instanciate(this.color, right);
	}
	var boxes = left ? [HSpace.instanciate(2), left, HSpace.instanciate(2)] : right;
	boxes.push(box);
	if (right) {
	    boxes.push(HSpace.instanciate(2));
	    boxes.push(right);
	    boxes.push(HSpace.instanciate(2));
	}
	var train = Train.instanciate(boxes);
	left && left.bindLayout(this, "left");
	right && right.bindLayout(this, "right");
	train.bindLayout(this);
	return train;
    }
};
LLREnclosure = Layout.specialise(LLREnclosure);

var LSuperscript = {
    __name__: "LSuperscript",
    __init__: function (elem, superscript) {
	this.elem = elem;
	this.superscript = superscript;
    },
    box: function () {
	var box = this.elem.box();
	var supbox = this.superscript.box();
	var superscript = Decoration.instanciate(supbox, box.width, box.ascent - 10 - supbox.descent);
	var decbox = DecoratedBox.instanciate(box, [superscript]);
	decbox.bindLayout(this);
	return decbox;
    }
};
LSuperscript = Layout.specialise(LSuperscript);

var LHSpace = {
    __name__: "LHSpace",
    __init__: function (width) {
	this.width = width;
    },
    box: function () {
	return HSpace.instanciate(this.width);
    }
};
LHSpace = Layout.specialise(LHSpace);

var LVSpace = {
    __name__: "LVSpace",
    __init__: function (height) {
	this.height = height;
    },
    box: function () {
	return VSpace.instanciate(this.height);
    }
};
LVSpace = Layout.specialise(LVSpace);

var LStack = {
    __name__: "LStack",
    __init__: function (elems, baseline) {
	this.elems = elems;
	this.baseline = baseline;
    },
    box: function () {
	var boxes = this.elems.map(function (el) { return el.box(); });
	var stack = Stack.instanciate(boxes, this.baseline);
	stack.bindLayout(this);
	return stack;
    }
};
LStack = Layout.specialise(LStack);

var LHLine = {
    __name__: "LHLine",
    __init__: function (width, height) {
	this.width = width;
	this.height = height;
    },
    box: function () {
	var line = HLine.instanciate(this.width, this.height);
	line.bindLayout(this);
	return line;
    }
};
LHLine = Layout.specialise(LHLine);

var LColor = {
    __name__: "LColor",
    __init__: function (color, elem) {
	this.color = color;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var cbox = ColorBox.instanciate(this.color, box);
	cbox.bindLayout(this);
	return cbox;
    }
};
LColor = Layout.specialise(LColor);

var LFrame = {
    __name__: "LFrame",
    __init__: function (style, elem) {
	this.style = style;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var fbox = Frame.instanciate(this.style, box);
	fbox.bindLayout(this);
	return fbox;
    }
};
LFrame = Layout.specialise(LFrame);

var LSqrt = {
    __name__: "LSqrt",
    __init__: function (elem) {
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var rbox = RootSign.instanciate(box);
	rbox.bindLayout(this);
	return rbox;
    }
};
LSqrt = Layout.specialise(LSqrt);

var LRaise = {
    __name__: "LRaise",
    __init__: function (height, elem) {
	this.height = height;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var rbox = RaiseBox.instanciate(this.height, box);
	rbox.bindLayout(this);
	return rbox;
    }
};
LRaise = Layout.specialise(LRaise);

var LTable = {
    __name__: "LTable",
    __init__: function (array, hspace, vspace) {
	this.rows = array;
	this.hspace = hspace;
	this.vspace = vspace;
    },
    box: function () {
	var brows = this.rows.map(function (row) {
	    return row.map(function (elem) {
		return elem.box();
	    });
	});
	var tbox = Table.instanciate(brows, this.hspace, this.vspace);
	return tbox;
    }
};
LTable = Layout.specialise(LTable);
