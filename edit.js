var operations = {
    priorityMode: true,
    binop: function (Op, e, rhs) {
	if (!rhs) {
	    rhs = expr.editExpr();
	}
	if (this.priorityMode || Op.isProposition) {
	    while (!e.parent.isRoot && !e.parent.isBracket && 
		e.parent.priority > Op.priority) {
		e = e.parent;
	    }
	}
	// The next two lines are a hack to allow e.g. sin^2x to mean sin^2(x)
	if (Op === Product && e.parent.isTrigFunction && e.parent.power) {
	    e.parent.replaceChild(e.parent.arg, rhs);
	} else // end of hack XXX
	if (e.__proto__ === Op && !e.isGroup) {
	    e.insertAfter(e.lastChild, rhs);
	} else {
	    e.parent.replaceChild(e, Op.instanciate([e.copy(), rhs]));
	}
	return rhs;
    },
    add: function (e, rhs) {
	return operations.binop(Sum, e, rhs);
    },
    mult: function (e, rhs) {
	return operations.binop(Product, e, rhs);
    },
    equals: function (e, rhs) {
	return operations.binop(Equation, e, rhs);
    },
    multByBracket: function (e) {
	var rhs = expr.editExpr();
	operations.mult(e, expr.brackets(rhs));
	return rhs;
    },
    addprefixop: function (maker) {
	return function (e) {
	    var rhs = expr.editExpr();
	    operations.add(e, maker(rhs));
	    return rhs;
	}
    },
    pow: function (e) {
	var p = e.parent;
	var pow = expr.editExpr();
	p.replaceChild(e, expr.power(e.copy(), pow));
	return pow;
    },
    frac: function (e) {
	var rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot && !e.parent.isBracket && 
		e.parent.priority > Fraction.priority) {
		e = e.parent;
	    }
	}
	e.parent.replaceChild(e, expr.fraction(e.copy(), rhs));
	return rhs;
    },
    prefixop: function (maker) {
	return function (e) {
	    var p = e.parent;
	    var ce = e.copy();
	    var cex = maker(ce);
	    p.replaceChild(e, maker(ce));
	    return ce;
	};
    },
    closeBracket: function (e) {
	var p;
	for (p = e.parent; !p.isRoot; p = p.parent) {
	    if (p.isBracket) {
		// editor.interpret(e);
		e = p.expr;
		e.isGroup = true;
		p.parent.replaceChild(p, e);
		break;
	    }
	}
	return e;
    },
    factorial: function (e) {
	var p = e.parent;
	var fac_e = expr.factorial(e.copy());
	p.replaceChild(e, fac_e);
	return fac_e;
    },
    nthRoot: function (e) {
	var p = e.parent;
	var rhs = expr.editExpr();
	p.replaceChild(e, expr.sqrt(rhs, e.copy()));
	return rhs;
    },
    addColumn: function (e, rhs) {
	rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot && !e.parent.isMatrix && !e.parent.isBracket) {
		e = e.parent;
	    }
	}
	if (e.parent.isMatrix) {
	    e.parent.insertAfterInRow(e, rhs);
	} else {
	    e.parent.replaceChild(e, expr.matrix([[e.copy(), rhs]]));
	}
	return rhs;
    },
    addRow: function (e, rhs) {
	rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot && !e.parent.isMatrix && !e.parent.isBracket) {
		e = e.parent;
	    }
	}
	if (e.parent.isMatrix) {
	    e.parent.insertRowAfter(e, [rhs]);
	} else {
	    e.parent.replaceChild(e, expr.matrix([[e.copy()], [rhs]]));
	}
	return rhs;
    }
};

var infixBinaryOps = {
    "+": operations.add,
    "*": operations.mult,
    "-": operations.addprefixop(expr.neg),
    "±": operations.addprefixop(expr.plusMinus),
    "+-": operations.addprefixop(expr.plusMinus),
    "-+": operations.addprefixop(expr.minusPlus),
    "/": operations.frac,
    "^": operations.pow,
    "(": operations.multByBracket,
    "=": operations.equals,
    ",": operations.addColumn,
    ";": operations.addRow,
    "root": operations.nthRoot
};

var prefixUnaryOps = {
    "-": operations.prefixop(expr.neg),
    "±": operations.prefixop(expr.plusMinus),
    "+-": operations.prefixop(expr.plusMinus),
    "-+": operations.prefixop(expr.minusPlus),
    "(": operations.prefixop(expr.brackets)
};

var postfixUnaryOps = {
    ")": operations.closeBracket,
    "!": operations.factorial
};

var constants = {
    // Lowercase Greek letters
    
    alpha: "\u03b1",
    beta: "\u03b2",
    gamma: "\u03b3",
    delta: "\u03b4",
    epsilon: "\u03b5",
    zeta: "\u03b6",
    eta: "\u03b7",
    theta: "\u03b8",
    iota: "\u03b9",
    kappa: "\u03ba",
    lambda: "\u03bb",
    mu: "\u03bc",
    nu: "\u03bd",
    xi: "\u03be",
    omicron: "\u03bf",
    pi: "\u03c0",
    rho: "\u03c1",
    sigma: "\u03c3",
    tau: "\u03c4",
    upsilon: "\u03c5",
    phi: "\u03c6",
    chi: "\u03c7",
    psi: "\u03c8",
    omega: "\u03c9",
    
    //Uppercase Greek letters
    
    Alpha: "\u0391",
    Beta: "\u0392",
    Gamma: "\u0393",
    Delta: "\u0394",
    Epsilon: "\u0395",
    Zeta: "\u0396",
    Eta: "\u0397",
    Theta: "\u0398",
    Iota: "\u0399",
    Kappa: "\u039a",
    Lambda: "\u039b",
    Mu: "\u039c",
    Nu: "\u039d",
    Xi: "\u039e",
    Omicron: "\u039f",
    Pi: "\U03a0",
    Rho: "\U03a1",
    Sigma: "\u03a3",
    Tau: "\u03a4",
    Upsilon: "\u03a5",
    Phi: "\u03a6",
    Chi: "\u03a7",
    Psi: "\u03a8",
    Omega: "\u03a9",
    
    // Exponential

    exp: "\u212f"
};

var functions = {
};

[
   {name: "sqrt", expr: expr.sqrt},
   {name: "abs", expr: expr.abs},
   {name: "ceil", expr: expr.ceiling},
   {name: "conj", expr: expr.conjugate},
   {name: "floor", expr: expr.floor}
].forEach(function (fdata) {
    functions[fdata.name] = fdata.expr;
});
   
["sin", "cos", "tan", "cosec", "sec", "cot"].forEach(function (f) {
    functions[f] = function (arg) {
	return expr.trigFunction(f, arg);
    };
    functions[f + "^"] = function (arg) {
	return expr.trigFunction(f, expr.editExpr(), arg);
    };
});

var Keywords = Prototype.specialise({
    __init__: function () {
	this.list = [];
    },
    updateWithObject: function (obj, type) {
	var kw;
	for (kw in obj) {
	    if (obj.hasOwnProperty(kw)) {
		this.list.push({kw: kw, type: type, value: obj[kw]});
	    }
	}
	this.list.sort(function (x, y) {
	    return x.kw.localeCompare(y.kw);
	});
    },
    getCompletions: function (word) {
	var completions = [];
	var maxlen = 0;
	var wordlen = word.length;
	var longestPrefix = null;
	this.list.forEach(function (item) {
	    if (word.length < item.kw.length && !item.kw.lastIndexOf(word, 0)) {
		completions.push(item.kw.substr(wordlen));
	    }
	    if (!word.lastIndexOf(item.kw, 0) && item.kw.length > maxlen) {
		maxlen = item.kw.length;
		longestPrefix = item;
	    }
	});
	return {completions: completions, longestPrefix: longestPrefix};
    }
});

var prefixKeywords = Keywords.instanciate();
var postfixKeywords = Keywords.instanciate();

prefixKeywords.updateWithObject(constants, "Constant");
prefixKeywords.updateWithObject(functions, "Function");
prefixKeywords.updateWithObject(prefixUnaryOps, "PrefixOp");

postfixKeywords.updateWithObject(infixBinaryOps, "InfixOp");
postfixKeywords.updateWithObject(postfixUnaryOps, "PostfixOp");

var editor = {
    interpretNumber: function (input, target) {
	var numberExpr = expr.number(parseFloat(input));
	if (target.operand) {
	    target.parent.replaceChild(target, target.operand);
	    operations.mult(target.operand, numberExpr);
	} else {
	    target.parent.replaceChild(target, numberExpr);
	}
	return numberExpr;
    },
    interpretParameter: function (input, target) {
	var param = expr.parameter(input);
	if (target.operand) {
	    target.parent.replaceChild(target, target.operand);
	    operations.mult(target.operand, param);
	} else {
	    target.parent.replaceChild(target, param);
	}
	return param;
    },
    interpretFunction: function (func, target) {
	var arg = expr.editExpr();
	var parent = target.parent;
	func = func(arg);
	// The following is a hack for e.g. sin2xcosx to interpret as
	// (sin 2x)(cos x) rather than sin(2x cos x)
	// XXX
	if (operations.priorityMode) {
	    if (parent.isProduct && parent.parent.isTrigFunction) {
		parent.removeChild(target);
		operations.mult(parent.parent, func);
		return arg;
	    }
	}
	target.parent.replaceChild(target, func);
	return arg;
    },
    interpretConstant: function (cons, target, k) {
	cons = expr.parameter(k, cons);
	target.parent.replaceChild(target, cons);
	return cons;
    },
    interpretPrefixOp: function (op, target) {
	return op(target);
    },
    interpretInfixOp: function (op, target) {
	target.parent.replaceChild(target, target.operand);
	return op(target.operand);
    },
    interpretPostfixOp: function (op, target) {
	target.parent.replaceChild(target, target.operand);
	return op(target.operand);
    },    
    interpretKeyword: function (k, target) {
	return this['interpret' + k.type](k.value, target, k.kw);
    },
    interpret: function (target, input, ongoing) {
	var comp, newTarget, kw;
	if (input === undefined || input === null) {
	    input = target.content;
	}
	if (!input) {
	    if (target.isEditExpr) {
		if (target.operand) {
		    target.parent.replaceChild(target, target.operand);
		    target = target.operand;
		} else {
		    target.content = "";
		    target.resetCompletions();
		}
	    }
	    return target;
	}
	if (!target.isEditExpr) {
	    newTarget = expr.editExpr(input, target);
	    target.parent.replaceChild(target, newTarget);
	    target = newTarget;
	}
	// XXX Hack to prevent weird bug:
	target.content = null;
	if (input[0] === " ") {
	    // input starts with space: force interpretation of target
	    // then continue
	    target = this.interpret(target);
	    input = input.substr(1);
	    return this.interpret(target, input, ongoing);
	}
	var groups = /^\d+(?:\.\d*)?/.exec(input);
	if (groups) {
	    // Input starts with a number
	    var number = groups[0];
	    if (number.length === input.length) {
		// Input is just a number
		if (ongoing) {
		    // Input ongoing so keep it as it is
		    target.content = input;
		    return target;
		}
		// Input finished so replace with a number expression
		return this.interpretNumber(number, target);
	    }
	    // There is more after the number so interpret the rest
	    target = this.interpretNumber(number, target);
	    input = input.substr(number.length);
	    return this.interpret(target, input, ongoing);
	}
	// Input doesn't start with a number.  Look for keywords
	if (target.operand) {
	    comp = postfixKeywords.getCompletions(input);
	} else {
	    comp = prefixKeywords.getCompletions(input);
	}
	if (comp.completions.length && ongoing) {
	    // There are keyword completions and input is ongoing so
	    // wait for more input
	    target.content = input;
	    if (input.length > 1) {
		target.setCompletions(comp.completions);
	    } else {
		target.resetCompletions();
	    }
	    return target;
	}
	// We are left with two cases:
	// 1. There are no completions
	// 2. There may be completions but input must be interpreted
	if (comp.longestPrefix) {
	    // Input starts with a keyword
	    kw = comp.longestPrefix.kw;
	    target = this.interpretKeyword(comp.longestPrefix, target);
	    if (kw.length === input.length) {
		// Input is just a keyword
		return target;
	    }
	    // There is more after the keyword so that needs interpreting
	    input = input.substr(kw.length);
	    return this.interpret(target, input, ongoing);	
	}
	// We are in the situation where the input doesn't start with
	// a keyword and has no possible completions (or if it does
	// the whole input must be interpreted anyway).
	if (target.operand) {
	    // There is an operand so change to a product
	    target.parent.replaceChild(target, target.operand);
	    target = operations.mult(target.operand);
	    // XXX This is a hack to allow sin^2x to mean sin^2(x)
	    /*var gp = target.parent.parent;
	    if (gp.isTrigFunction && target.parent == gp.power) {
		target.parent.removeChild(target);
		target = gp.arg;
	    }*/
	    return this.interpret(target, input, ongoing);
	}
	// This means that the first letter must be a parameter
	if (!/^\w/.test(input)) {
	    // Input doesn't start with an alphanumeric character.
	    // For now, do not process it. XXX
	    target.content = input;
	    return target;
	}
	if (input.length === 1) {
	    // The input is just a parameter
	    if (ongoing) {
		// Input is ongoing, keep it as input
		target.content = input;
		target.resetCompletions();
		return target;
	    }
	    return this.interpretParameter(input, target);
	}
	// There is more input after the parameter so it's a product
	target = this.interpretParameter(input.charAt(0), target);
	input = input.substr(1);
	return this.interpret(target, input, ongoing);
    },
    addChar: function (e, c) {
	if (e.isEditExpr && c === "\r") { // XXX
	    if (e.getCurrentCompletion() !== null) {
		return this.interpret(e, e.content + e.getCurrentCompletion());
	    }
	    return e;
	}
	var input = e.isEditExpr ? e.content + c : c;
	return this.interpret(e, input, true);
    },
    parse: function (input) {
	var edit = expr.editExpr();
	var root = expr.root(edit);
	this.interpret(edit, input);
	return root;
    }
};
