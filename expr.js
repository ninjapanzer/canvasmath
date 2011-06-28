var expr = {
    number: function (n) {
	return Number_.instanciate(n);
    },
    parameter: function (name, value) {
	return Parameter.instanciate(name, value);
    },
    neg: function (x) {
	return Negation.instanciate(x);
    },
    plusMinus: function (x) {
	return PlusMinus.instanciate(x);
    },
    minusPlus: function (x) {
	return MinusPlus.instanciate(x);
    },
    brackets: function (x) {
	return Bracket.instanciate(x);
    },
    sum: function (terms) {
	return Sum.instanciate(terms);
    },
    product: function (factors) {
	return Product.instanciate(factors);
    },
    power: function (x, y) {
	return Power.instanciate(x, y);
    },
    fraction: function (x, y) {
	return Fraction.instanciate(x, y);
    },
    editExpr: function (content, operand) {
	return EditExpr.instanciate(content, operand);
    },
    root: function (e) {
	return RootExpression.instanciate(e);
    },
    sqrt: function (e, nth) {
	return Sqrt.instanciate(e, nth);
    },
    abs: function (e) {
	return Abs.instanciate(e);
    },
    ceiling: function (e) {
	return Ceiling.instanciate(e);
    },
    conjugate: function (e) {
	return Conjugate.instanciate(e);
    },
    factorial: function (e) {
	return Factorial.instanciate(e);
    },
    floor: function (e) {
	return Floor.instanciate(e);
    },
    trigFunction: function (name, e, pow) {
	return TrigFunction.instanciate(name, e, pow);
    },
    matrix: function (array) {
	return Matrix.instanciate(array);
    },
    dummy: function () {
	return expr.integer(0);
    }
};

var Expression = {
    __name__: "Expression",
    subLayout: function (layout, subexpr) {
	var l = layout.ofExpr(subexpr);
	if (!subexpr.isContainer && this.priority >= subexpr.priority) {
	    l = layout.bracket(l);
	}
	return l;
    },
    isNumber: function () {
	return false;
    },
    removeChild: function (e) {
	return false;
    },
    setPreviousSibling: function (prev, reciprocate) {
	this.previousSibling = prev;
	if (!prev) {
	    this.parent.firstChild = this;
	} else if (reciprocate) {
	    prev.setNextSibling(this);
	}
    },
    setNextSibling: function (next, reciprocate) {
	this.nextSibling = next;
	if (!next) {
	    this.parent.lastChild = this;
	} else if (reciprocate) {
	    next.setPreviousSibling(this);
	}
    },
    setRelations: function (parent, prev, next, reciprocate) {
	this.parent = parent;
	this.setNextSibling(next, reciprocate);
	this.setPreviousSibling(prev, reciprocate);
    },
    getSelection: function (expr) {
	var a, b, i;
	var child, start, stop;
	var myAncestors = [];
	if (!expr) {
	    return {expr: this};
	}
	for (a = this; !a.isRoot; a = a.parent) {
	    if (expr === a) {
		return {expr: a};
	    }
	    myAncestors.push(a);
	}
	for (a = expr; !a.isRoot; a = a.parent) {
	    if (a === this) {
		return {expr: a};
	    }
	    i = myAncestors.indexOf(a.parent);
	    if (i === 0) {
		return {expr: this};
	    } else if (i !== -1) {
		b = myAncestors[i - 1];
		for (child = a.parent.firstChild;; child = child.nextSibling) {
		    if (child === a) {
			start = a;
			stop = b;
			break;
		    } else if (child === b) {
			start = b;
			stop = a;
			break;
		    }
		}
		if (start === a.parent.firstChild 
		    && stop === a.parent.lastChild) {
		    return {expr: a.parent};
		}
		return {expr: a.parent, start: start, stop: stop.nextSibling};
	    }
	}
	return null;
    },
    getPredecessor: function () {
	var e;
	if (this.previousSibling) {
	    e = this.previousSibling;
	    while (e.lastChild) {
		e = e.lastChild;
	    }
	    return e;
	}
	return this.parent;
    },
    getPreviousLeaf: function () {
	// Unused
	var e;
	for (e = this; !e.previousSibling; e = e.parent) {
	    if (e.isRoot) {
		return null;
	    }
	}
	e = e.previousSibling;
	while (e.lastChild) {
	    e = e.lastChild;
	}
	return e;
    },
    getNextLeaf: function () {
	// Unused
	var e = this;
	for (e = this; !e.nextSibling; e = e.parent) {
	    if (e.isRoot) {
		return null;
	    }
	}
	e = e.nextSibling;
	while (e.firstChild) {
	    e = e.firstChild;
	}
	return e;
    },
    setSelected: function (sel) {
	var p;
	this.selected = sel;
	// Following unused
	for (p = this; !p.isRoot; p = p.parent) {
	    p.containsSelection = true;
	}
    },
    clearSelected: function () {
	var p;
	this.selected = false;
	// Following unused
	for (p = this; !p.isRoot; p = p.parent) {
	    p.containsSelection = false;
	}
    },
    needsFactorSeparator: false,
    sumSeparator: operators.infix.plus,
    getSumExpression: function () {
	return this;
    }
};
Expression = Prototype.specialise(Expression);

var OneChildExpression = {
    __name__: "OneChildExpression",
    __init__: function (child) {
	this.child = child;
	child.setRelations(this);
    },
    copy: function () {
	return this.__proto__.instanciate(this.child.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (this.child === oldChild) {
	    this.child = newChild;
	    newChild.setRelations(this);
	    return true;
	}
	return false;
    }
};
OneChildExpression = Expression.specialise(OneChildExpression);

var RootExpression = {
    __name__: "RootExpression",
    isRoot: true,
    __init__: function (expr) {
	this.parent = this;
	this.expr = expr;
	expr.setRelations(this, null, null);
    },
    layout: function (layout) {
	var l = layout.ofExpr(this.expr);
	l.bindExpr(this);
	return l;
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.expr) {
	    this.expr = newChild;
	    newChild.setRelations(this, null, null);
	    return newChild;
	}
	return null;
    }
};
RootExpression = Expression.specialise(RootExpression);

var Number_ = {
    __name__: "Number",
    __init__: function (value) {
	this.value = value;
    },
    layout: function (layout) {
	var ltext = layout.text(this.value.toString());
	ltext.bindExpr(this);
	return ltext;
    },
    isNumber: function () {
	return true;
    },
    copy: function () {
	return expr.number(this.value);
    },
    needsFactorSeparator: true
};
Number_ = Expression.specialise(Number_);

var Parameter = {
    __name__: "Parameter",
    __init__: function (name, value) {
	this.name = name;
	this.value = value || name;
    },
    layout: function (layout) {
	var options = null;
	if (this.value.length === 1) {
	    options = {style: "italic"};
	}
	var ltext = layout.text(this.value, options);
	ltext.bindExpr(this);
	return ltext;
    },
    copy: function () {
	return expr.parameter(this.name, this.value);
    }
};
Parameter = Expression.specialise(Parameter);

var PrefixOperation = {
    __name__: "PrefixOperation",
    isPrefixOperation: true,
    __init__: function (val) {
	this.value = val;
	val.setRelations(this, null, null);
    },
    layout: function (layout) {
	var lneg = layout.text(this.prefixText);
	var lval = this.subLayout(layout, this.value);
	var ltrain = layout.train(lneg, lval);
	lneg.bindExpr(this, "prefix");
	ltrain.bindExpr(this);
	return ltrain;
    },
    copy: function () {
	return this.__proto__.instanciate(this.value.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.value) {
	    this.value = newChild;
	    newChild.setRelations(this, null, null);
	    return newChild;
	}
	return null;
    },
    removeChild: function (child) {
	if (child === this.value) {
	    return this.parent.removeChild(this);
	} else {
	    return null;
	}
    },
    getSumExpression: function () {
	return this.value;
    }
};
PrefixOperation = Expression.specialise(PrefixOperation);

var Negation = {
    __name__: "Negation",
    isNegation: true,
    prefixText: "-",
    sumSeparator: operators.infix.minus
};
Negation = PrefixOperation.specialise(Negation);


var PlusMinus = {
    __name__: "PlusMinus",
    isPlusMinus: true,
    prefixText: "\u00b1",
    sumSeparator: operators.infix.plusMinus
};
PlusMinus = PrefixOperation.specialise(PlusMinus);

var MinusPlus = {
    __name__: "MinusPlus", 
    isMinusPlus: true,
    prefixText: "\u2213",
    sumSeparator: operators.infix.minusPlus
};
MinusPlus = PrefixOperation.specialise(MinusPlus);

var Bracket = {
    __name__: "Bracket",
    isBracket: true,
    isContainer: true,
    __init__: function (expr) {
	this.expr = expr;
	expr.setRelations(this, null, null);
    },
    layout: function (layout) {
	var lbracket;
	var lexpr = layout.ofExpr(this.expr);
	lbracket = layout.bracket(lexpr, "red");
	lbracket.bindExpr(this);
	return lbracket;
    },
    copy: function () {
	return expr.brackets(this.expr.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.expr) {
	    this.expr = newChild;
	    newChild.setRelations(this, null, null);
	    return newChild;
	}
	return null;
    },
    removeChild: function (child) {
	if (child === this.expr) {
	    return this.parent.removeChild(this);
	} else {
	    return null;
	}
    }
};
Bracket = Expression.specialise(Bracket);

var VarLenOperation = {
    __name__: "VarLenOperation",
    __init__: function (operands) {
	var self = this;
	this.operands = operands;
	operands.forEach(function (t, i) {
	    t.setRelations(self, operands[i - 1], operands[i + 1]);
	});
    },
    fromSlice: function (slice) {
	var op;
	var operands = [];
	for (op = slice.start; op !== slice.stop; op = op.nextSibling) {
	    operands.push(op.copy());
	}
	return this.__proto__.instanciate(operands);
    },
    pushOp: null,
    layout: function (layout) {
	var self = this;
	var train = [];
	var ltrain;
	this.operands.forEach(function (op, i) {
	    self.pushOp(layout, train, i);
	});
	ltrain = layout.train(train);
	ltrain.bindExpr(this);
	return ltrain;
    },
    slicedLayout: function (layout, slice) {
	var self = this;
	var left = [];
	var right = [];
	var middle = [];
	var train = left;
	var ltrain;
	this.operands.forEach(function (op, i) {
	    switch (op) {
		case slice.start:
		    train = middle;
		    break;
		case slice.stop:
		    train = right;
		    break;
	    }
	    self.pushOp(layout, train, i);
	});
	left = layout.train(left);
	middle = layout.train(middle);
	right = layout.train(right);
	ltrain = layout.train([left, middle, right]);
	ltrain.bindExpr(this);
	return ltrain;
    },
    copy: function () {
	return this.__proto__.instanciate(this.operands.map(function (t) {
	    return t.copy();
	}));
    },
    replaceChild: function (oldChild, newChild, noAggregate) {
	var self = this;
	return this.operands.some(function (t, i, operands) {
	    var res;
	    if (t === oldChild) {
		res = self.insertAfter(t, newChild, noAggregate);
		self.removeChild(t);
		return res;
	    }
	    return null;
	});
    },
    removeChild: function (child) {
	var i = this.operands.indexOf(child);
	if (i === -1) {
	    return null;
	} else if (this.operands.length === 2) {
	    this.parent.replaceChild(this, this.operands[1 - i]);
	    return true;
	} else {
	    this.operands.splice(i, 1);
	    if (i) {
		this.operands[i - 1].setNextSibling(this.operands[i]);
	    }
	    if (i < this.operands.length) {
		this.operands[i].setPreviousSibling(this.operands[i - 1]);
	    }
	    return true;
	}
    },
    removeSlice: function (slice) {
	var operands = this.operands;
	var len = operands.length;
	var i = slice.start ? operands.indexOf(slice.start) : 0;
	var j = slice.stop ? operands.indexOf(slice.stop) : len;
	var sliceLen = j - i;
	switch (len - sliceLen) {
	    case 0:
		this.parent.removeChild(this);
		return true;
	    case 1:
		this.parent.replaceChild(this, operands[i && j - 1]);
		return true;
	    default:
		if (i) {
		    operands[i - 1].setNextSibling(operands[j]);
		}
		if (j < len) {
		    operands[j].setPreviousSibling(operands[i - 1]);
		}
		operands.splice(i, sliceLen);
		return true;
	}
    },
    replaceSlice: function (slice, newOperand) {
	this.insertBefore(slice.start, newOperand);
	this.removeSlice(slice);
	return true;
    },
    insertAt: function (i, newOperand) {
	var prev, next;
	var self = this;
	if (i < 0 || i > this.operands.length) {
	    return false;
	}
	if (!newOperand.isGroup && newOperand.__proto__ === this.__proto__) {
	    // Same type so aggregate both operations
	    newOperand.operands.forEach(function (op, j) {
		self.insertAt(i + j, op);
	    });
	} else {
	    prev = this.operands[i - 1];
	    next = this.operands[i];
	    this.operands.splice(i, 0, newOperand);
	    newOperand.setRelations(this, prev, next, true);
	}
	return true;
    },
    insertAfter: function (operand, newOperand) {
	var i = this.operands.indexOf(operand);
	if (i === -1) {
	    return false;
	}
	return this.insertAt(i + 1, newOperand);
    },
    insertBefore: function (operand, newOperand) {
	var i = this.operands.indexOf(operand);
	if (i === -1) {
	    return false;
	}
	return this.insertAt(i, newOperand);
    }
};
VarLenOperation = Expression.specialise(VarLenOperation);

var Sum = {
    __name__: "Sum",
    pushOp: function (layout, train, i, forceOp) {
	var op;
	var term = this.operands[i];
	if (i) {
	    op = term.sumSeparator.layout(layout);
	    op.bindExpr(term);
	    term = term.getSumExpression();
	    train.push(op);
	}
	train.push(this.subLayout(layout, term));
    }
};
Sum = VarLenOperation.specialise(Sum);

var Equation = {
    __name__: "Equation",
    isProposition: true,
    pushOp: function (layout, train, i, forceOp) {
	var op;
	if (i) {
	    op = operators.infix.eq.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, this.operands[i]));
    }
};
Equation = VarLenOperation.specialise(Equation);

var Product = {
    __name__: "Product",
    isProduct: true,
    subLayout: function (layout, subexpr) {
	// This is to prevent standard functions which are factors from
        // being surrounded in brackets
	if (subexpr.isTrigFunction) {
	    var space = layout.hspace(2);
	    var ltrain = layout.train([space, layout.ofExpr(subexpr), space]);
	    return ltrain;
	}
	return Expression.subLayout.call(this, layout, subexpr);
    },
    pushOp: function (layout, train, i, forceOp) {
	var op;
	var factor = this.operands[i];
	if (i && (factor.needsFactorSeparator)) {
	    op = operators.infix.times.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, factor));
    }
};
Product = VarLenOperation.specialise(Product);

var Power = {
    __name__: "Power",
    isPower: true,
    __init__: function (base, power) {
	this.base = base;
	this.power = power;
	base.setRelations(this, null, power);
	power.setRelations(this, base, null);
    },
    subLayout: function (layout, subexpr) {
	// This is to make sure roots and fractions to a power are
	// surrounded in brackets.
	// The general rule fails to do this as roots are containers
	var l = Expression.subLayout.call(this, layout, subexpr);
	if (subexpr === this.base && (subexpr.isSqrt || subexpr.isFraction)) {
	    l = layout.bracket(l);
	}
	return l;
    },
    layout: function (layout) {
	var bLayout = this.subLayout(layout, this.base);
	var pLayout = layout.ofExpr(this.power);
	var ls = layout.superscript(bLayout, layout.scale(pLayout, 0.8));
	ls.bindExpr(this);
	return ls;
    },
    copy: function () {
	return expr.power(this.base.copy(), this.power.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (this.base === oldChild) {
	    this.base = newChild;
	    newChild.setRelations(this, null, this.power, true);
	} else if (this.power === oldChild) {
	    this.power = newChild;
	    newChild.setRelations(this, this.base, null, true);
	} else {
	    return false;
	}
	return true;
    },
    removeChild: function (child) {
	if (this.base === child) {
	    return this.parent.replaceChild(this, this.power);
	} else if (this.power === child) {
	    return this.parent.replaceChild(this, this.base);
	} else {
	    return false;
	}
    }/* Removed for compatibility with IE9
    get needsFactorSeparator() {
	return this.base.needsFactorSeparator;
    }*/
};
Power = Expression.specialise(Power);
Object.defineProperty(Power, "needsFactorSeparator", {
    get: function () {
	return this.base.needsFactorSeparator;
    }
});

var Fraction = {
    __name__: "Fraction",
    isFraction: true,
    isContainer: true,
    __init__: function (num, den, keepScale) {
	this.num = num;
	this.den = den;
	this.scaleDown = !keepScale;
	num.setRelations(this, null, den);
	den.setRelations(this, num, null);
    },
    layout: function (layout) {
	var line = layout.hline(null, 1);
	var vspace = layout.vspace(2);
	var hspace = layout.hspace(2);
	var den = layout.train([hspace, layout.ofExpr(this.den), hspace]);
	var num = layout.train([hspace, layout.ofExpr(this.num), hspace]);
	var stack = layout.stack([den, vspace, line, vspace, num], 1);
	stack.bindExpr(this);
	line.bindExpr(this, "line");
	if (this.scaleDown) {
	     stack = layout.scale(stack, 0.8);
	} else {
	    return stack;
	}
	return layout.raise(4, stack);
    },
    copy: function () {
	return expr.fraction(this.num.copy(), this.den.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (this.num === oldChild) {
	    this.num = newChild;
	    newChild.setRelations(this, null, this.den, true);
	} else if (this.den === oldChild) {
	    this.den = newChild;
	    newChild.setRelations(this, this.num, null, true);
	} else {
	    return false;
	}
	return true;
    },
    removeChild: function (child) {
	if (this.num === child) {
	    return this.parent.replaceChild(this, this.den);
	} else if (this.den === child) {
	    return this.parent.replaceChild(this, this.num);
	} else {
	    return false;
	}
    },
    needsFactorSeparator: true
};
Fraction = Expression.specialise(Fraction);

var Sqrt = {
    __name__: "Sqrt",
    isContainer: true,
    isSqrt: true,
    __init__: function (expr, nth) {
	this.expr = expr;
	this.nth = nth;
	expr.setRelations(this, null, nth);
	if (nth) {
	    nth.setRelations(this, expr);
	}
    },
    layout: function (layout) {
	var l = layout.ofExpr(this.expr);
	var lnth = this.nth && layout.scale(layout.ofExpr(this.nth), 0.8);
	var lroot = layout.sqrt(l, lnth);
	lroot.bindExpr(this);
	return lroot;
    },
    copy: function () {
	return expr.sqrt(this.expr.copy(), this.nth && this.nth.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.expr) {
	    this.expr = newChild;
	    newChild.setRelations(this, null, this.nth);
	    return true;
	} else if (oldChild === this.nth) {
	    this.nth = newChild;
	    newChild.setRelations(this, this.expr, null);
	    return true;
	}
	return false;
    }
};
Sqrt = Expression.specialise(Sqrt);

var TrigFunction = {
    __name__: "TrigFunction",
    isTrigFunction: true,
    __init__: function (name, arg, power) {
	this.name = name;
	this.arg = arg;
	this.power = power;
	this.arg.setRelations(this);
	if (power) {
	    this.power.setRelations(this, arg, null, true);
	}
    },
    subLayout: function (layout, subexpr) {
	// If subexpr is a product containing at least one standard
	// function then it must be surrounded in brackets
	var trigFactor;
	if (subexpr.isProduct) {
	     trigFactor = subexpr.operands.some(function (op) {
		return op.isTrigFunction;
	     });
	     if (trigFactor) {
		 return layout.bracket(layout.ofExpr(subexpr));
	     }
	}
	return Expression.subLayout.call(this, layout, subexpr);
    },
    layout: function (layout) {
	var lname = layout.text(this.name);
	var lspace = layout.hspace(3);
	var larg = this.subLayout(layout, this.arg);
	var lpower;
	if (this.power) {
	    lpower = layout.ofExpr(this.power);
	    lname = layout.superscript(lname, layout.scale(lpower, 0.8));
	}
	var l = layout.train([lname, lspace, larg]);
	l.bindExpr(this);
	return l;
    },
    copy: function () {
	return expr.trigFunction(
	    this.name, 
	    this.arg.copy(), 
	    this.power && this.power.copy()
	);
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.arg) {
	    this.arg = newChild;
	    newChild.setRelations(this, null, this.power, true);
	    return true;
	} else if (oldChild === this.power) {
	    this.power = newChild;
	    newChild.setRelations(this, this.arg, null, true);
	    return true;
	}
	return false;
    }
};
TrigFunction = Expression.specialise(TrigFunction);

var Matrix = {
    __name__: "Matrix",
    isMatrix: true,
    isContainer: true,
    __init__: function (array) {
	var self = this;
	var lastItem = null;
	this.rows = array;
	this.ncols = array.reduce(function (m, r) {
	    return Math.max(m, r.length);
	}, 0);
	this.nrows = array.length;
	this.rows.forEach(function (row, i) {
	    row.forEach(function (item, j) {
		var nextItem;
		if (j + 1 === self.ncols) {
		    nextItem = self.getItemAt(i + 1, 0);
		} else {
		    nextItem = self.getItemAt(i, j + 1);
		}
		item.setRelations(self, lastItem, nextItem);
		lastItem = item;
	    });
	});

    },
    getItemAt: function (i, j) {
	var row = this.rows[i];
	return row && row[j];
    },
    layout: function (layout) {
	var lrows = this.rows.map(function (row) {
	    return row.map(function (item) {
		return layout.ofExpr(item);
	    });
	});
	var ltable = layout.table(lrows, 7, 2);
	var lbracket = layout.lrEnclosure(ltable, "[", "]");
	ltable.bindExpr(this);
	lbracket.bindExpr(this, "bracket");
	return layout.raise(4, lbracket);
    },
    copy: function () {
	return expr.matrix(this.rows.map(function (row) {
	    return row.map(function (item) { return item.copy(); });
	}));
    },
    findChild: function (child, callback) {
	var self = this;
	return this.rows.some(function (row, i) {
	    return row.some(function (item, j) {
		if (item === child) {
		    callback(row, i, item, j);
		    return true;
		}
		return false;
	    });
	});
    },
    replaceChild: function (oldChild, newChild) {
	var self = this;
	return this.findChild(oldChild, function (row, i, item, j) {
	    newChild.setRelations(self, item.previousSibling, item.nextSibling, true);
	    row[j] = newChild;
	});
    },
    removeChild: function (child) {
	var self = this;
	return this.findChild(child, function (row, i, item, j) {
	    var prev = child.previousSibling;
	    var next = child.nextSibling;
	    var nItems = self.rows.reduce(function (x, y) {
		return x + y.length;
	    }, 0);
	    if (nItems === 2) {
		self.parent.replaceChild(self, prev || next);
		return;
	    } else if (row.length === 1) {
		self.rows.splice(i, 1);
	    } else {
		row.splice(j, 1);
	    }
	    if (prev) {
		prev.setNextSibling(next, true);
	    } else {
		next.setPreviousSibling(prev, true);
	    }
	});
    },
    insertAfterInRow: function (oldItem, newItem) {
	var self = this;
	return this.findChild(oldItem, function (row, i, item, j) {
	    newItem.setRelations(self, item, item.nextSibling, true);
	    row.splice(j + 1, 0, newItem);
	});
    },
    insertRowAfter: function (oldItem, newRow) {
	var self = this;
	return this.findChild(oldItem, function (row, i, item, j) {
	    newRow.forEach(function (newItem, k) {
		newItem.setRelations(self,
		    newRow[k - 1] || row[row.length - 1],
		    newRow[k + 1] || self.rows[i + 1] && self.rows[i + 1][0],
		    true);
	    });
	    self.rows.splice(i + 1, 0, newRow);
	});
    },
    needsFactorSeparator: true
};
Matrix = Expression.specialise(Matrix);
			  
var EditExpr = {
    __name__: "EditExpr",
    isEditExpr: true,
    __init__: function (content, operand) {
	this.content = content || "";
	this.operand = operand;
	this.resetCompletions();
    },
    layout: function (layout) {
	var lcontent = layout.text(this.content || "?");
	var lcolor = layout.color("red", lcontent);
	var comp, lcomp, lcompcolor, ltrain, ledit;
	lcontent.bindExpr(this);
	if (this.completionIndex === -1) {
	    ledit = lcolor;
	} else {
	    comp = this.completions[this.completionIndex];
	    lcomp = layout.text(comp);
	    lcompcolor = layout.color("gray", lcomp);
	    ltrain = layout.train([lcolor, lcompcolor]);
	    ltrain.bindExpr(this);
	    ledit = ltrain;
	}
	if (this.operand) {
	    return layout.train([layout.ofExpr(this.operand), ledit]);
	} else {
	    return ledit;
	}
    },
    copy: function () {
	return expr.editExpr(this.content);
    },
    isEmpty: function () {
	return !this.content;
    },
    isInteger: function () {
	return /^\d+$/.test(this.content);
    },
    isDecimal: function () {
	return /^\d+\.\d*$/.test(this.content);
    },
    resetCompletions: function () {
	this.completions = [];
	this.completionIndex = -1;
    },
    setCompletions: function (completions) {
	this.completions = completions;
	this.completionIndex = 0;
    },
    cycleCompletions: function () {
	if (this.completionIndex !== -1) {
	    this.completionIndex++;
	    this.completionIndex %= this.completions.length;
	}
    },
    getCurrentCompletion: function () {
	if (this.completionIndex !== -1) {
	    return this.completions[this.completionIndex];
	} else {
	    return "";
	}
    }
};
EditExpr = Expression.specialise(EditExpr);

var Fencing = {
    __name__: "Fencing",
    isContainer: true,
    layout: function (layout) {
	var lvalue = layout.ofExpr(this.child);
	var labs = layout.lrEnclosure(lvalue,
		this.leftFence, this.rightFence);
	labs.bindExpr(this);
	return labs;
    }
};
Fencing = OneChildExpression.specialise(Fencing);

var Abs = {
    __name__: "Abs",
    leftFence: "|",
    rightFence: "|"
};
Abs = Fencing.specialise(Abs);

var Ceiling = {
    __name__: "Ceiling",
    leftFence: "|+",
    rightFence: "+|"
};
Ceiling = Fencing.specialise(Ceiling);

var Floor = {
    __name__: "Floor",
    leftFence: "|_",
    rightFence: "_|"
};
Floor = Fencing.specialise(Floor);

var Conjugate = {
    __name__: "Conjugate",
    isContainer: true,
    layout: function(layout) {
	var lvalue = layout.ofExpr(this.child);
	var line = layout.hline(null, 1);
	var vspace = layout.vspace(2);
	var stack = layout.stack([lvalue, vspace, line], 0);
	stack.bindExpr(this);
	line.bindExpr(this, "line");
	return stack;
    }
};
Conjugate = OneChildExpression.specialise(Conjugate);

var Factorial = {
    __name__: "Factorial",
    layout: function (layout) {
	var lvalue = this.subLayout(layout, this.child);
	var excl = layout.text("!");
	var ltrain = layout.train([lvalue, excl]);
	ltrain.bindExpr(this);
	return ltrain;
    }
};
Factorial = OneChildExpression.specialise(Factorial);

//
// Set priorities
//

var priorities = [
    [Number_, 100],
    [Parameter, 100],
    [EditExpr, 100],
    [Bracket, 97],
    [Factorial, 96],
    [Sqrt, 95],
    [Abs, 95],
    [Ceiling, 95],
    [Floor, 95],
    [Conjugate, 95],
    [Power, 90],
    [Fraction, 80],
    [Product, 50],
    [TrigFunction, 40],
    [Negation, 20],
    [Sum, 10],
    [Matrix, 7],
    [Equation, 5]
];

priorities.forEach(function (pl) {
    pl[0].priority = pl[1];
});
