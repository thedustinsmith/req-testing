(function(global) {
	var POSSIBLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	var Board = global.Board = function Board (table) {
		this.initialize(table);
	}

	Board.prototype.initialize = function(table) {
		this.$table = $table = $(table);
		this.cells = $table.find("td").map(function(ix, td) {
			return new Cell(td);
		}).toArray();
		this.tries = 0;
	};

	Board.prototype.reset = function () {
		this.tries = 0;
		this.cells.forEach(function (c) {
			c.reset();
		});
	};

	Board.prototype.load = function (json) {
		this.cells.forEach(function (c) {
			var cV = json[c.id.toString()];
			if (cV) {
				c.setVal(cV);
			}
			else {
				c.setVal('');
			}
		});
	};

	Board.prototype.toJSON = function() {
		var json = {};
		this.cells.forEach(function (c) {
			if (c.getVal()) {
				json[c.id.toString()] = c.getVal();
			}
		});
		return json;
	};

	Board.prototype.solve = function () {

		var board = this;
		var solvedCells = [];
		var unsolvedCells = [];
		this.cells.forEach(function (c) {
			if (board.tries === 0 && c.getVal()) {
				c.setPerm(true);
				solvedCells.push(c);
			}
			else if (c.isPermanent || c.isGuess) {
				solvedCells.push(c);
			}
			else {
				unsolvedCells.push(c);
			}
		});

		var unsolved1 = [];
		unsolvedCells.forEach(function (c, ix) {
			var related = c.getRelated(solvedCells);
			var permValues = related.map(function(c) {
				return c.getVal();
			});
			permValues = arr_unique(permValues);
			var possible = arr_diff(POSSIBLE_VALUES, permValues);

			if(c.id === 25) log("basic", possible);
			c.possible = possible;
			if (possible.length === 1) {
				c.setGuess(possible[0]);
				c.$td.removeAttr("possible");
				solvedCells.push(c);
				c.$td.css('background', '#bada55');
			}
			else {
				unsolved1.push(c);
				c.$td.attr("possible", possible.join(","));
			}
		});

		var unsolved2 = []
		unsolvedCells.forEach(function (c, ix) {
			var myVals = c.possible;
			var rowCells = board.getRowCells(c.row).filter(function (rc) { return rc.id !== c.id; });
			rowCells.forEach(function (rc) { 
				if (rc.possible && rc.possible.length > 0) {
					myVals = arr_diff(myVals, rc.possible);
				}
			});

			if (myVals.length === 1) {
				c.$td.css('background', 'yellow');
				c.$td.attr("try", self.tries);
				c.setGuess(myVals[0]);
				c.possible = [];
				c.$td.removeAttr("possible");
				solvedCells.push(c);
			}
			else {
				unsolved2.push(c);
			}
		});

		var unsolved3 = []
		unsolved2.forEach(function (c, ix) {
			var myVals = c.possible;
			var rowCells = board.getColCells(c.col).filter(function (rc) { return rc.id !== c.id; });
			rowCells.forEach(function (rc) { 
				if (rc.possible && rc.possible.length > 0) {
					myVals = arr_diff(myVals, rc.possible);
				}
			});

			if (myVals.length === 1) {
				c.$td.css('background', '#ffba00');
				c.$td.attr("try", self.tries);
				c.setGuess(myVals[0]);
				c.possible = [];
				c.$td.removeAttr("possible");
				solvedCells.push(c);
			}
			else {
				unsolved3.push(c);
			}
		});



		this.tries ++;
		if (this.tries <= 10) {
			this.solve();
		}
	};

	Board.prototype.getRowCells = function (row) {
		return this.cells.filter(function (c) { return c.row === row; });
	};

	Board.prototype.getColCells = function (col) {
		return this.cells.filter(function (c) { return c.col === col; });
	};

	var Cell = global.Cell = function Cell (td) {
		this.initialize(td);
	};

	Cell.prototype.initialize = function (td) {
		this.$td = $td = $(td);

		var cellIx = $td.index();
		var rowIx = $td.closest("tr").index();

		this.col = cellIx + 1;
		this.row = rowIx + 1;
		this.id = cellIx + (9 * rowIx);

		var colFact = num(((this.col - 1) / 3) + 1);
		var rowFact = num(((this.row - 1) / 3));
		this.block = colFact + (3 * rowFact);
	};

	Cell.prototype.getVal = function() {
		var v = this.$td.html();
		if (!v) {
			return undefined;
		}
		return num(v);
	};

	Cell.prototype.setVal = function (v) {
		this.$td.html(v);
	};

	Cell.prototype.setGuess = function (v) {
		this.isGuess = true;
		this.setVal(v);
	};

	Cell.prototype.setPerm = function (p) {
		this.isPermanent = p;
	};

	Cell.prototype.getRelated = function (cells) {
		var ret = [];
		var self = this;
		cells.forEach(function (c) {
			if(c.row === self.row || c.col === self.col || c.block === self.block) {
				ret.push(c);
			}
		});
		return ret;
	};

	Cell.prototype.reset = function () {
		this.$td.css("background", "");
		this.$td.html('');
		this.isPermanent = false;
		this.isGuess = false;
		this.possible = false;
	};



/* Utilities */
	function num (v) {
		return parseInt(v, 10);
	}

	function arr_unique (arr) {
	   var u = {}, a = [];
	   for(var i = 0, l = arr.length; i < l; ++i){
	      if(u.hasOwnProperty(arr[i])) {
	         continue;
	      }
	      a.push(arr[i]);
	      u[arr[i]] = 1;
	   }
	   return a;
	}

	function arr_diff(a, b) {
		return a.filter(function(i) {return b.indexOf(i) < 0;});
	};

})(window);