
var calibrationImg;
var calibrationTxt;

var initBox = function () {
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    calibrationImg = document.createElement("img");
    calibrationImg.src = "10x1.png";
    calibrationTxt = document.createElement("span");
    div.appendChild(calibrationImg);
    div.appendChild(calibrationTxt);
    document.body.appendChild(div);
};

var getTextMetrics = function (text, font) {
    calibrationTxt.innerHTML = "";
    calibrationTxt.style.font = font;
    calibrationTxt.appendChild(document.createTextNode(text));
    var baselineFromTop = calibrationImg.offsetTop - calibrationTxt.offsetTop;
    var height = calibrationTxt.offsetHeight;
    return {
	width: calibrationTxt.offsetWidth,
	height: height,
	ascent: baselineFromTop,
	descent: baselineFromTop - height
    };
};

var Box = {
    __name__: "Box",
    alignAdjustment: function (align) {
	switch(align || "left") {
	    case "left":
		return 0;
	    case "right":
		return this.width;
	    case "center":
		return 0.5*this.width;
	    default:
		throw "Illegal align adjustment:" + align;
	}
    },
    alignOnCanvas: function (ctx, x, y, align) {
	this.drawOnCanvas(ctx, x - this.alignAdjustment(align), y);
    },
    contains: function (x, y) {
	return (0 <= x && x < this.width 
		&& -this.descent >= y && y > -this.ascent);
    },
    getContainers: function (x, y) {
	var containers = [];
	this.pushContainers(containers, x, y);
	return containers;
    },
    pushContainers: function (containers, x, y, align) {
	x += this.alignAdjustment(align);
	if (this.contains(x, y)) {
	    this.pushSubContainers(containers, x, y);
	    containers.push({box: this, x: x, y: y});
	}
    },
    pushSubContainers: function () {
    },
    bindLayout: function (layout, key) {
	if (!this.boundLayouts) {
	    this.boundLayouts = [];
	}
	this.boundLayouts.push({layout: layout, key: key});
    }
};
Box = Prototype.specialise(Box);

var TextBox = {
    __name__: "TextBox",
    __init__: function (text, font) {
	this.text = text;
	this.font = font;
	this.calculate();
    },
    calculate: function () {
	var m = getTextMetrics(this.text, this.font);
	this.width = m.width;
	this.height = m.height;
	this.ascent = m.ascent;
	this.descent = m.descent;
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.save();
	ctx.font = this.font;
	// ctx.fillStyle = "black";
	ctx.fillText(this.text, x, y);
	ctx.restore();
    },
    getCharacterIndexAt: function (ctx, x) {
	var i, m;
	ctx.save();
	ctx.font = this.font;
	for (i = 0; i < this.text.length; i++) {
	    m = ctx.measureText(this.text.substr(0, i + 1));
	    if (x < m) {
		break;
	    }
	}
	return i;
    }
};
TextBox = Box.specialise(TextBox);

var Decoration = {
    __name__: "Decoration",
    __init__: function (box, hOffset, vOffset) {
	this.box = box;
        this.vOffset = vOffset;
        this.hOffset = hOffset;
	this.calculate();
    },
    calculate: function () {
        var box = this.box;
	this.top = this.vOffset + box.ascent;
        this.bottom = this.vOffset + box.descent;
        this.left = this.hOffset;
        this.right = this.hOffset + box.width;
    },
    drawOnCanvas: function (ctx, x, y) {
	this.box.drawOnCanvas(ctx, x + this.hOffset, y - this.vOffset);
    },
    pushContainers: function (containers, x, y) {
	this.box.pushContainers(containers,
	                        x - this.hOffset, y + this.vOffset);
    }
};
Decoration = Prototype.specialise(Decoration);

var DecoratedBox = {
    __name__: "DecoratedBox",
    __init__: function (box, decorations) {
        this.box = box;
	this.decorations = decorations || [];
        this.calculate();
    },
    calculate: function () {
        var box = this.box;
        var ascent = box.ascent;
        var descent = box.descent;
        var left = 0;
        var right = box.width;
        this.decorations.forEach(function (dec) {
	    if (dec.top > ascent) {
                ascent = dec.top;
            }
	    if (dec.bottom < descent) {
                descent = dec.bottom;
            }
            if (dec.left < left) {
                left = dec.left;
            }
            if (dec.right > right) {
                right = dec.right;
	    }
	});
	this.ascent = ascent;
	this.descent = descent;
        this.width = right - left;
	this.hOffset = left;
        this.height = this.ascent - this.descent;
    },
    drawOnCanvas: function (ctx, x, y) {
        x += this.hOffset;
	this.box.drawOnCanvas(ctx, x, y);
	this.decorations.forEach(function (dec) {
	    dec.drawOnCanvas(ctx, x, y);
	});
    },
    pushSubContainers: function (containers, x, y) {
	x -= this.hOffset;
	this.box.pushContainers(containers, x, y);
	this.decorations.forEach(function (dec) {
	    dec.pushContainers(containers, x, y);
	});
    }
};
DecoratedBox = Box.specialise(DecoratedBox);

var Scale = {
    __name__: "Scale",
    __init__: function (box, scale) {
	this.box = box;
	this.scale = scale;
	this.calculate();
    },
    calculate: function () {
	var self = this;
	var box = this.box;
	var scale = this.scale;
	["width", "height", "ascent", "descent"].forEach(function (prop) {
	    self[prop] = scale * box[prop];
	});
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(this.scale, this.scale);
	this.box.drawOnCanvas(ctx, 0, 0);
	ctx.restore();
    },
    pushSubContainers: function (containers, x, y) {
	this.box.pushContainers(containers, x/this.scale, y/this.scale);
    }
};
Scale = Box.specialise(Scale);

var Train = {
    __name__: "Train",
    __init__: function () {
	var boxes = arguments;
        if (boxes.length === 1) {
	    boxes = boxes[0];
	} else {
	    var filter = Array.prototype.filter;
	    boxes = filter.call(boxes, function () { return true; });
	}
	this.boxes = boxes;
	this.calculate();
    },
    calculate: function () {
	var ascent = -1000;
	var descent = 1000;
	var width = 0;
	this.boxes.forEach(function (box) {
	    width += box.width;
	    if (ascent < box.ascent) {
		ascent = box.ascent;
	    }
	    if (descent > box.descent) {
		descent = box.descent;
	    }
	});
	this.ascent = ascent;
	this.descent = descent;
	this.height = ascent - descent;
	this.width = width;
    },
    drawOnCanvas: function (ctx, x, y) {
	this.boxes.forEach(function (box) {
	    box.drawOnCanvas(ctx, x, y);
	    x += box.width;
	});
    },
    pushSubContainers: function (containers, x, y) {
	this.boxes.forEach(function (box) {
	    box.pushContainers(containers, x, y);
	    x -= box.width;
	});
    }
};
Train = Box.specialise(Train);

var Paren = {
    __name__: "Paren",
    __init__: function (box, reflect) {
	this.box = box;
	this.reflect = reflect;
	this.calculate();
    },
    calculate: function () {
	var box = this.box;
	this.height = box.height + 4;
	this.ascent = box.ascent + 2;
	this.descent = box.descent - 2;
	this.width = 4;
	this.left = this.reflect ? 3 : 1;
	this.right = this.reflect ? -2 : 6;
	this.r = 5;
    },
    drawOnCanvas: function (ctx, x, y) {
	var r = this.r;
	ctx.save();
	ctx.translate(x, y);
	ctx.beginPath();
	ctx.moveTo(this.right, -this.ascent);
	ctx.arcTo(this.left, -this.ascent, this.left, r - this.ascent, r);
	ctx.lineTo(this.left, -r - this.descent);
	ctx.arcTo(this.left, -this.descent, this.right, -this.descent, r);
	ctx.stroke();
	ctx.restore();
    }
};
Paren = Box.specialise(Paren);

var HSpace = {
    __name__: "HSpace",
    __init__: function (width) {
	this.width = width;
	this.calculate();
    },
    calculate: function () {
	this.height = 0;
	this.descent = 0;
	this.ascent = 0;
    },
    drawOnCanvas: function (ctx, x, y) {
    }
};
HSpace = Box.specialise(HSpace);

var VSpace = {
    __name__: "VSpace",
    __init__: function (height) {
	this.height = height;
	this.calculate();
    },
    calculate: function () {
	this.width = 0;
	this.ascent = this.height*0.5;
	this.descent = -this.ascent;
    },
    drawOnCanvas: function (ctx, x, y) {}
};
VSpace = Box.specialise(VSpace);

var Stack = {
    __name__: "Stack",
    __init__: function (boxes, baseline, align) {
	var self = this;
	this.boxes = boxes;
	boxes.forEach(function (box) {
	    box.stack = self;
	});
	this.baseline = baseline || 0;
	this.align = align || "center";
	this.calculate();
    },
    calculate: function () {
	var height = 0;
	var descent = 0;
	var ascent = 0;
	var boxes = this.boxes;
	var width = 0;
	var baseline = this.baseline;
	var box;
	var i;
	for (i = 0; i < boxes.length; i++) {
	    box = boxes[i];
	    if (i < baseline) {
		descent -= box.height;
	    } else if (i === baseline) {
		descent += box.descent;
		ascent += box.ascent;
	    } else {
		ascent += box.height;
	    }
	    if (width < box.width) {
		width = box.width;
	    }
	}
	this.width = width;
	this.ascent = ascent;
	this.descent = descent;
	this.height = ascent - descent;
    },
    drawOnCanvas: function (ctx, x, y) {
	var align = this.align;
	y -= this.descent;
	x += this.alignAdjustment(align);
	this.boxes.forEach(function (box) {
	    y += box.descent;
	    box.alignOnCanvas(ctx, x, y, align);
	    y -= box.ascent;
	});
    },
    pushSubContainers: function (containers, x, y) {
	var align = this.align;
	y += this.descent;
	x -= this.alignAdjustment(align);
	this.boxes.forEach(function(box) {
	    y -= box.descent;
	    box.pushContainers(containers, x, y, align);
	    y += box.ascent;
	});
    }
};
Stack = Box.specialise(Stack);

var HLine = {
    __name__: "HLine",
    __init__: function (width, height) {
	this._width = width;
	this.height = height || 1;
	this.calculate();
    },
    calculate: function () {
	this.ascent = this.height*0.5;
	this.descent = -this.ascent;
    },
    get width() {
	return this._width || (this.stack && this.stack.width) || 0;
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.save();
	ctx.fillStyle = "black";
	ctx.fillRect(x, y - this.ascent, this.width, this.height);
	ctx.restore();
    }
};
HLine = Box.specialise(HLine);

var ColorBox = {
    __name__: "ColorBox",
    __init__: function (color, box) {
	this.color = color;
	this.box = box;
	this.calculate();
    },
    calculate: function () {
	this.width = this.box.width;
	this.height = this.box.height;
	this.ascent = this.box.ascent;
	this.descent = this.box.descent;
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.save();
	ctx.fillStyle = this.color;
	ctx.strokeStyle = this.color;
	this.box.drawOnCanvas(ctx, x, y);
	ctx.restore();
    },
    pushSubContainers: function (containers, x, y) {
	this.box.pushContainers(containers, x, y);
    }
};
ColorBox = Box.specialise(ColorBox);

var Frame = {
    __name__: "Frame",
    __init__: function (style, box) {
	this.style = style || {};
	this.box = box;
	this.calculate();
    },
    calculate: function () {
	var style = this.style;
	this.width = this.box.width;
	this.height = this.box.height;
	this.ascent = this.box.ascent;
	this.descent = this.box.descent;
    },
    drawOnCanvas: function (ctx, x, y) {
	var extra = this.extra;
	ctx.save();
	if (this.style.background) {
	    ctx.fillStyle = this.style.background;
	    ctx.fillRect(x, y - this.ascent, this.width, this.height);
	}
	if (this.style.border && this.style.width) {
	    ctx.strokeStyle = this.style.border;
	    ctx.lineWidth = this.style.width;
	    ctx.strokeRect(x, y - this.ascent, this.width, this.height);
	}
	ctx.restore();
	this.box.drawOnCanvas(ctx, x, y);
    },
    pushSubContainers: function (containers, x, y) {
	this.box.pushContainers(containers, x, y);
    }
};
Frame = Box.specialise(Frame);

var RootSign = {
    __name__: "RootSign",
    __init__: function (box) {
	this.box = box;
	this.calculate();
    },
    calculate: function () {
	this.width = this.box.width + 12;
	this.height = this.box.height + 3;
	this.ascent = this.box.ascent + 3;
	this.descent = this.box.descent;
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.beginPath();
	ctx.moveTo(x, y - this.descent - 5);
	ctx.lineTo(x + 5, y - this.descent - 5);
	ctx.lineTo(x + 10, y - this.descent);
	ctx.lineTo(x + 10, y - this.ascent);
	ctx.lineTo(x + this.width, y - this.ascent);
	ctx.stroke();
	this.box.drawOnCanvas(ctx, x + 12, y);
    },
    pushSubContainers: function (containers, x, y) {
	this.box.pushContainers(containers, x - 10, y);
    }
};
RootSign = Box.specialise(RootSign);

var RaiseBox = {
    __name__: "RaiseBox",
    __init__: function (height, box) {
	this.raiseHeight = height;
	this.box = box;
	this.calculate();
    },
    calculate: function () {
	this.width = this.box.width;
	this.height = this.box.height + this.raiseHeight;
	this.ascent = this.box.ascent + this.raiseHeight;
	this.descent = this.box.descent + this.raiseHeight;
    },
    drawOnCanvas: function (ctx, x, y) {
	ctx.save();
	ctx.translate(0, -this.raiseHeight);
	this.box.drawOnCanvas(ctx, x, y);
	ctx.restore();
    },
    pushSubContainers: function (containers, x, y) {
	this.box.pushContainers(containers, x, y + this.raiseHeight);
    }
};
RaiseBox = Box.specialise(RaiseBox);

var Table = {
    __name__: "Table",
    __init__: function (array, hspace, vspace) {
	this.rows = array;
	this.nrows = this.rows.length;
	this.ncols = this.rows.reduce(function (m, r) {
	    return Math.max(m, r.length);
	}, 0);
	this.hspace = hspace || 0;
	this.vspace = vspace || 0;
	this.calculate();
    },
    calculate: function () {
	var i, j;
	var widths = this.widths = [];
	for (i = 0; i < this.ncols; i++) {
	    widths.push(0);
	}
	var ascents = this.ascents = [];
	var descents = this.descents = [];
	for (j = 0; j < this.nrows; j++) {
	    ascents.push(-1000);
	    descents.push(1000);
	}
	var add = function (x, y) { return x + y; };
	this.rows.forEach(function (row, i) {
	    row.forEach(function (box, j) {
		if (widths[j] < box.width) {
		    widths[j] = box.width;
		}
		if (ascents[i] < box.ascent) {
		    ascents[i] = box.ascent;
		}
		if (descents[i] > box.descent) {
		    descents[i] = box.descent;
		}
	    });
	});
	this.height = 0;
	for (i = 0; i < this.nrows; i++) {
	    this.height += ascents[i] - descents[i];
	}
	this.width = widths.reduce(add, 0) + this.hspace*(this.ncols - 1);
	this.ascent = this.height/2;
	this.descent = -this.ascent;
    },
    drawOnCanvas: function (ctx, x, y) {
	var self = this;
	var dx;
	y -= this.ascent;
	this.rows.forEach(function (row, i) {
	    y += self.ascents[i];
	    dx = 0;
	    row.forEach(function (box, j) {
		box.alignOnCanvas(ctx, x + dx + self.widths[j]/2, y, "center");
		dx += self.widths[j] + self.hspace;
	    });
	    y += self.vspace - self.descents[i];
	});
    },
    pushSubContainers: function (containers, x, y) {
	var self = this;
	var dx;
	y += this.ascent;
	this.rows.forEach(function (row, i) {
	    y -= self.ascents[i];
	    dx = 0;
	    row.forEach(function (box, j) {
		box.pushContainers(containers, x - dx - self.widths[j]/2, y, "center");
		dx += self.widths[j] + self.hspace;
	    });
	    y -= self.vspace - self.descents[i];
	});
    }
};
Table = Box.specialise(Table);
