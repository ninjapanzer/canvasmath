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
    Number: function (n) {
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
    Number: function (n, stack) {
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
    Number: function (n) {
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

var MathMLSerializer = {
    serialize: function (e, indent, indentStep) {
	var bits = [];
	this.objectToBits(this.exprToObject(e), bits);
	return this.bitsToMathML(bits, indent || 0, indentStep || 2);
    },
    exprToObject: function (e) {
	return this[e.__name__](e);
    },
    objectToBits: function (obj, bits) {
	var self = this;
	switch (typeof obj) {
	case "object":
	    if (!obj.children || obj.children.length === 0) {
		bits.push({
		    type: "emptyTag",
		    text: "<" + obj.tag + "/>"
		});
		return;
	    }
	    bits.push({
		type: "openTag",
		text: "<" + obj.tag + ">"
	    });
	    obj.children.forEach(function (child) {
		self.objectToBits(child, bits);
	    });
	    bits.push({
		type: "closeTag",
		text: "</" + obj.tag + ">"
	    });
	    return;
	case "number":
	    bits.push({
		type: "text",
		text: obj.toString()
	    });
	    return;
	case "string":
	    bits.push({
		type: "text",
		text: obj
	    });
	    return;
	}
    },
    bitsToMathML: function (bits, indent, indentStep) {
	var spaces = "                                                                                   ";
	var lines = [];
	var indentSpaces = spaces.substr(indent);
	var inlineTag = false;
	bits.forEach(function (bit, i) {
	    switch (bit.type) {
	    case "emptyTag":
		lines.push(spaces.substr(0, indent) + bit.text);
		break;
	    case "openTag":
		lines.push(spaces.substr(0, indent) + bit.text);
		indent += indentStep;
		break;
	    case "text":
		inlineTag = bits[i + 1].type === "closeTag";
		if (inlineTag) {
		    lines[lines.length - 1] += bit.text;
		}
		break;
	    case "closeTag":
		indent -= indentStep;
		if (inlineTag) {
		    lines[lines.length - 1] += bit.text;
		    inlineTag = false;
		} else {
		    lines.push(spaces.substr(0, indent) + bit.text);
		}
		break;
	    }
	});
	return lines.join("\n");
    },
    apply: function (fn, args) {
	var self = this;
	var applyArgs = [{tag: fn}];
	args.forEach(function (arg) {
	    applyArgs.push(self.exprToObject(arg));
	});
	return {
	    tag: "apply",
	    children: applyArgs
	};
    },
    RootExpression: function (e) {
	return this.exprToObject(e.expr);
    },
    Number: function (n) {
	return {
	    tag: "cn",
	    children: [n.value.toString()]
	};
    },
    Parameter: function (p) {
	return {
	    tag: "ci",
	    children: [p.name]
	};
    },
    Negation: function (e) {
	return this.apply("minus", [e.value]);
    },
    Bracket: function (e) {
	return this.exprToObject(e.expr);
    },
    Sum: function (e) {
	if (e.operands.length === 2 && e.operands[1].isNegation) {
	    return this.apply("minus", [e.operands[0], e.operands[1].value]);
	}
	return this.apply("plus", e.operands);
    },
    Product: function (e) {
	return this.apply("times", e.operands);
    },
    Equation: function (e) {
	return this.apply("eq", e.operands);
    },
    Power: function (e) {
	return this.apply("power", [e.base, e.power]);
    },
    Fraction: function (e) {
	return this.apply("divide", [e.num, e.den]);
    },
    Sqrt: function (e) {
	return this.apply("sqrt", [e.expr]);
    },
    TrigFunction: function (e) {
	return this.apply(e.name, [e.arg]);
    }
    /* XXX Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    }*/
};
MathMLSerializer = Prototype.specialise(MathMLSerializer);
