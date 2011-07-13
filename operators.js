var operators = {
    prefix: {},
    infix: {},
    postfix: {},
    addPrefix: function (name, value) {
	this.prefix[name] = value;
    },
    addInfix: function (name, value) {
	this.infix[name] = value;
    },
    addPostfix: function (name, value) {
	this.postfix[name] = value;
    },
    getPrefix: function (name) {
	return this.prefix[name];
    },
    getInfix: function (name) {
	return this.infix[name];
    },
    getPostfix: function (name) {
	return this.posfix[name];
    },
    simpleOperator: function (symbol, lspace, rspace) {
	if (lspace !== undefined) {
	    return {
		layout: function (layout) {
		    return layout.train(
			layout.hspace(lspace),
			layout.text(symbol),
			layout.hspace(rspace == undefined ? lspace : rspace)
		    );
		}
	    };
	} else {
	    return {
		layout: function (layout) {
		    return layout.text(symbol);
		}
	    };
	}
    },
    addSumOperator: function (name, prefixSymbol, infixSymbol) {
	if (prefixSymbol) {
	    this.addPrefix(name, this.simpleOperator(prefixSymbol));
	}
	if (infixSymbol) {
	    this.addInfix(name, this.simpleOperator(infixSymbol, 3));
	}
    }
};

operators.addSumOperator("plus", "+", "+");
operators.addSumOperator("minus", "-", "\u2212");
operators.addSumOperator("plusMinus", "\u00b1", "\u00b1");
operators.addSumOperator("minusPlus", "\u2213", "\u2213");

operators.addInfix("times", operators.simpleOperator("\u00D7", 1));

operators.addInfix("eq", operators.simpleOperator("=", 5));

operators.addInfix("comma", operators.simpleOperator(",", 0, 3));

operators.addPrefix("sum", {
    layout: function (layout) {
	return layout.scale(layout.text("\u2211"), 1.5);
    }
});

operators.addPrefix("product", {
    layout: function (layout) {
	return layout.scale(layout.text("\u220F"), 1.5);
    }
});

operators.addPrefix("integral", {
    layout: function (layout) {
	return layout.train([
	    layout.scale(layout.text("\u222B"), 1.5),
		layout.hspace(5)
	]);
    }
});
