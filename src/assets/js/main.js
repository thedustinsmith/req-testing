(function(global) {
	var POSSIBLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	var Board = global.Board = function Board (table) {
		this.initialize(table);
	}

	Board.prototype.initialize = function(table) {
		var board = this;
		this.$table = $table = $(table);
		this.cells = $table.find("td").map(function(ix, td) {
			return new Cell(td, board);
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

	Board.prototype._solveVeryBasic = function (unsolvedCells) {
		var unsuccessful = [];
		unsolvedCells.forEach(function (c, ix) {
			var possible = c.getPossible();
			if (possible.length === 1) {
				c.setGuess(possible[0]);
				c.$td.removeAttr("possible");
				c.$td.css('background', '#bada55');
				c.$td.attr("try", board.tries);
			}
			else {
				unsuccessful.push(c);
				c.$td.attr("possible", possible.join(","));
			}
		});
		return unsuccessful;
	};

	Board.prototype._solveRowSimple = function (unsolvedCells) {
		var unsuccessful = [];
		unsolvedCells.forEach(function (c, ix) {
			var myVals = c.getPossible();
			var rowCells = board.getRowCells(c.row).filter(function (rc) { return rc.id !== c.id; });
			rowCells.forEach(function (rc) { 
				if (rc.getVal()) return;
				var rcPoss = rc.getPossible();
				if (rcPoss.length > 0) {
					myVals = arr_diff(myVals, rcPoss);
				}
			});

			if (myVals.length === 1) {
				c.$td.css('background', 'yellow');
				c.$td.attr("try", board.tries);
				c.setGuess(myVals[0]);
				c.$td.removeAttr("possible");
			}
			else {
				unsuccessful.push(c);
			}
		});
		return unsuccessful;
	};

	Board.prototype._solveColSimple = function (unsolvedCells) {
		var unsuccessful = [];
		unsolvedCells.forEach(function (c, ix) {
			var myVals = c.getPossible();
			var colCells = board.getColCells(c.col).filter(function (rc) { return rc.id !== c.id; });
			colCells.forEach(function (rc) { 
				if (rc.getVal()) return;
				var rcPoss = rc.getPossible();
				if (rcPoss.length > 0) {
					myVals = arr_diff(myVals, rcPoss);
				}
			});

			if (myVals.length === 1) {
				c.$td.css('background', '#ffba00');
				c.$td.attr("try", board.tries);
				c.setGuess(myVals[0]);
				c.possible = [];
				c.$td.removeAttr("possible");
			}
			else {
				unsuccessful.push(c);
			}
		});
		return unsuccessful;
	};

	Board.prototype._solveBlockSimple = function (unsolvedCells) {
		var unsuccessful = [];
		unsolvedCells.forEach(function (c, ix) {
			var myVals = c.getPossible();
			var blockCells = board.getBlockCells(c.block).filter(function (rc) { return rc.id !== c.id; });
			blockCells.forEach(function (rc) { 
				if (rc.getVal()) return;
				var rcPoss = rc.getPossible();
				if (rcPoss.length > 0) {
					myVals = arr_diff(myVals, rcPoss);
				}
			});

			if (myVals.length === 1) {
				c.$td.css('background', 'fuchsia');
				c.$td.attr("try", board.tries);
				c.setGuess(myVals[0]);
				c.possible = [];
				c.$td.removeAttr("possible");
			}
			else {
				unsuccessful.push(c);
			}
		});
		return unsuccessful;
	};

	Board.prototype._doSomeElimination = function (unsolvedCells) {
		var board = this;
		var noSuccess = [];
		unsolvedCells.forEach(function (c) {
			var success = false;
			var myValues = c.getPossible();
			var blockCells = board.getBlockCells(c.block);
			var colCells = board.getColCells(c.col);
			myValues.forEach(function (v) {
				var valBlocks = blockCells.filter(function (b) { return b.getPossible().indexOf(v) > -1; });
				var doElim = !valBlocks.some(function (v) { return v.col != c.col; });

				var dolog = (c.id == 31 && v == 9);
				if (dolog) {
					log(doElim);
				}

				if (doElim) {
					colCells.forEach(function (colc) {
						var colPoss = colc.getPossible();
						var ix = colPoss.indexOf(v);
						if (dolog) {
							log(colc.col);
						}
						if (ix > -1) {
							colPoss.splice(ix, 1);
							if (colPoss.length === 1) {
								colc.setGuess(colPoss[0]);
								colc.$td.css('background', 'limegreen');
								success = true;
							}
						}
					});
				}
			});

			if (!success) {
				noSuccess.push(c);
			}
		});
		return noSuccess;
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

		unsolvedCells = board._solveVeryBasic(unsolvedCells);

		unsolvedCells = board._solveRowSimple(unsolvedCells);

		unsolvedCells = board._solveColSimple(unsolvedCells);

		unsolvedCells = board._solveBlockSimple(unsolvedCells);

		// todo not working
		//unsolvedCells = board._doSomeElimination(unsolvedCells);
		
		this.tries++;
		if (this.tries <= 15 && unsolvedCells.length > 0) {
			this.solve();
		}
		else {
			log("done in "+ this.tries + " tries");
		}
	};

	Board.prototype.isValid = function () {
		return !this.cells.some(function (c) {
			return !c.isValid();
		});
	};

	Board.prototype.getRowCells = function (row) {
		return this.cells.filter(function (c) { return c.row === row; });
	};

	Board.prototype.getColCells = function (col) {
		return this.cells.filter(function (c) { return c.col === col; });
	};

	Board.prototype.getBlockCells = function (block) {
		return this.cells.filter(function (c) { return c.block === block; });
	};

	var Cell = global.Cell = function Cell (td, board) {
		this.initialize(td, board);
	};

	Cell.prototype.initialize = function (td, board) {
		this.$td = $td = $(td);
		this.board = board;

		$td.data('cell', this);

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

	Cell.prototype.getRelated = function () {
		var ret = [];
		var self = this;
		this.board.cells.forEach(function (c) {
			if (c.id === self.id) return;

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

	Cell.prototype.getPossible = function () {
		var related = this.getRelated().filter(function (c) { return c.isPermanent || c.isGuess; });
		var permValues = related.map(function (c) {
			return c.getVal();
		});
		permValues = arr_unique(permValues);
		var possible = arr_diff(POSSIBLE_VALUES, permValues);
		return possible;
	};

	Cell.prototype.isValid = function () {
		var v = this.getVal();
		var poss = this.getPossible();

		if (!v && poss.length > 0) {
			return true;
		}

		return poss.length > 0 && poss.indexOf(v) > -1;
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