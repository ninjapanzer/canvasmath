var SimpleSerializer = {
    serialize: function (e, forceBrackets) {
	var s = this[e.__name__](e);
	if (forceBrackets || e.priority && e.priority <= e.parent.priority) {
	    s = "(" + s + ")";
	}
	return s;
    },
    RootExpression: function (e) {
	return this.serialize(this.expr);
    },
    Integer: function (n) {
	return n.value.toString();
    },
    Parameter: function (p) {
	return p.name;
    },
    Negation: function (e) {
	return "-" + this.serialize(e.value);
    },
    Bracket: function (e) {
	return "(" + this.serialize(e.expr) + ")";
    },
    Sum: function (e) {
	var sum = "";
	var self = this;
	e.operands.forEach(function (op, i) {
	    if (op.isNegation) {
		sum += self.serialize(op);
	    } else {
		sum += (i ? "+" : "") + self.serialize(op);
	    }
	});
	return sum;
    },
    Product: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("*");
    },
    Equation: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("=");
    },
    Power: function (e) {
	return this.serialize(e.base) + "^" + this.serialize(e.power);
    },
    Fraction: function (e) {
	return this.serialize(e.num) + "/" + this.serialize(e.den);
    },
    Sqrt: function (e) {
	return "sqrt" + this.serialize(e.expr, true);
    },
    TrigFunction: function (e) {
	return e.name + this.serialize(e.arg, true);
    },
    Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    }
};
SimpleSerializer = Prototype.specialise(SimpleSerializer);

var RPNSerializer = {
    serialize: function (e) {
	return this.serializeToStack(e).join(" ");
    },
    serializeToStack: function (e, stack) {
	if (!stack) {
	    stack = [];
	}
	this[e.__name__](e, stack);
	return stack;
    },
    RootExpression: function (e, stack) {
	this.serializeToStack(this.expr, stack);
    },
    Integer: function (n, stack) {
	stack.push(n.value.toString());
    },
    Parameter: function (p, stack) {
	stack.push(p.name);
    },
    Negation: function (e, stack) {
	stack.push("neg");
	this.serializeToStack(e.value, stack);
    },
    Bracket: function (e, stack) {
    },
    Sum: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    var sign = null;
	    if (i) {
		if (op.isNegation) {
		    
		    sign = "-";
		    op = op.value;
		} else {
		    sign = "+";
		}
	    }
	    self.serializeToStack(op, stack);
	    if (sign) {
		stack.push(sign);
	    }
	});
    },
    Product: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    self.serializeToStack(op, stack);
	    if (i) {
		stack.push("*");
	    }
	});
    },
    Equation: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    self.serializeToStack(op, stack);
	    if (i) {
		stack.push("==");
	    }
	});
    },
    Power: function (e, stack) {
	this.serializeToStack(e.base, stack);
	stack.push("^");
	this.serializeToStack(e.power, stack);
    },
    Fraction: function (e, stack) {
	this.serializeToStack(e.num, stack);
	stack.push("/");
	this.serializeToStack(e.den, stack);
    },
    Sqrt: function (e, stack) {
	this.serializeToStack(e.expr, stack);
	stack.push("sqrt");
    },
    TrigFunction: function (e, stack) {
	this.serializeToStack(e.arg, stack);
	stack.push(e.name);
    },
    Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    }
};
RPNSerializer = Prototype.specialise(RPNSerializer);

var LaTeXSerializer = {
    serialize: function (e, noBrackets) {
	var s = this[e.__name__](e);
	if (!noBrackets && e.priority && e.priority <= e.parent.priority) {
	    s = "\\left(" + s + "\\right)";
	}
	return s;
    },
    RootExpression: function (e) {
	return this.serialize(this.expr);
    },
    Integer: function (n) {
	return n.value.toString();
    },
    Parameter: function (p) {
	return (p.name !== p.value ? "\\" : "") + p.name;
    },
    Negation: function (e) {
	return "-" + this.serialize(e.value);
    },
    Bracket: function (e) {
	return "\\left(" + this.serialize(e.expr) + "\\right)";
    },
    Sum: function (e) {
	var sum = "";
	var self = this;
	e.operands.forEach(function (op, i) {
	    if (op.isNegation) {
		sum += self.serialize(op);
	    } else {
		sum += (i ? "+" : "") + self.serialize(op);
	    }
	});
	return sum;
    },
    Product: function (e) {
	var self = this;
	var bits = [];
	e.operands.forEach(function (op, i) {
	    if (i && op.needsFactorSeparator) {
		bits.push("\\times");
	    }
	    bits.push(self.serialize(op));
	});
	return bits.join(" ");
    },
    Equation: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("=");
    },
    Power: function (e) {
	return this.serialize(e.base) + "^{" + this.serialize(e.power, true) + "}";
    },
    Fraction: function (e) {
	var num = this.serialize(e.num, true);
	var den = this.serialize(e.den, true);
	return "\\frac{" + num + "}{" + den + "}";
    },
    Sqrt: function (e) {
	return "\\sqrt{" + this.serialize(e.expr) + "}";
    },
    TrigFunction: function (e) {
	return "\\"+e.name + " " + this.serialize(e.arg);
    },
    Matrix: function (e) {
	var self = this;
	var i;
	var arrayParams = "";
	for (i = 0; i < e.ncols; i++) {
	    arrayParams += "c";
	}
	var arrayContent = e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(" & ");
	}).join("\\\\\n");
	return "\\left(\\begin{array}{" + arrayParams + "}\n" +
	    arrayContent + 
	    "\n\\end{array}";
    }
};
LaTeXSerializer = Prototype.specialise(LaTeXSerializer);

var GeoGebraSerializer = {
    Parameter: function (e) {
	return e.value;
    },
    Matrix: function (e) {
	var self = this;
	return "{" + e.rows.map(function (row) {
	    return "{" + row.map(function (item) { return self.serialize(item); }).
		join(", ") + "}";
	}) + "}";
    }
};
GeoGebraSerializer = SimpleSerializer.specialise(GeoGebraSerializer);

var MaximaSerializer = {
    Parameter: function (e) {
	return (e.name !== e.value ? "%" : "") + e.name;
    },
    Matrix: function (e) {
	return "matrix(" + e.rows.map(function (row) {
	    return "[" + 
		row.map(function (item) { return self.serialize(item); }).
		join(", ") + "]";
	}) + ")";
    }
};
MaximaSerializer = SimpleSerializer.specialise(MaximaSerializer);

