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
    simpleOperator: function (symbol, space) {
	if (space) {
	    return {
		layout: function (layout) {
		    return layout.train(
			layout.hspace(space),
			layout.text(symbol),
			layout.hspace(space)
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
