/*
 * Display organisms on a timeline starting from hadean up until present
 *
 * Author: Bremen Braun
 */
function Timeline(data) {
	this.data = data;
	
	var times = [
		/* Compressed */
		{
			name: 'Had.',
			start: 4600,
			color: '#ad1f81'
		},
		{
			name: 'Archaean',
			start: 4000,
			color: '#ed087f'
		},
		{
			name: 'Proterozoic',
			start: 2500,
			color: '#ee3465'
		},
		/* Expanded */
		{
			name: 'Paleozoic',
			start: 542,
			color: '#99c18d'
		},
		{
			name: 'Mesozoic',
			start: 252,
			color: '#64c6c9'
		},
		{
			name: 'Cenozoic',
			start: 66,
			color: '#ebe82b'
		},
		{ // used as a stopper
			name: '',
			start: 0,
			color: ''
		}
	],
	myaExpanded = 542, // total number of years accounted for in expanded region
	myaCompressed = 4058, // total number of years accounted for in compressed region
	compressedRatio = 1/4, // how much of the space to use for compressed periods
	eonWidth = 24,
	iterationWidth = 38,
	
	getPeriodDrawHeight = function(start, end, totalHeight) {
		var availablePixels = totalHeight,
			myaInPeriod = start - end;
		
		if (start <= myaExpanded) { // expanded view for newer times; all expanded share 3/4 of the space
			var pxAvailable = totalHeight - (totalHeight * compressedRatio),
			    yearsPerPixel = pxAvailable/myaExpanded;
				
			return myaInPeriod * yearsPerPixel;
		}
		else { // compressed view; all compressed share 1/4 of the space
			var pxAvailable = totalHeight * compressedRatio,
			    yearsPerPixel = pxAvailable/myaCompressed;
				
			return myaInPeriod * yearsPerPixel;
		}
		
		return totalHeight / (times.length-1);
	},
	drawEons = function(ctx, width, height) {
		var textHeight = 8,
		    drawPos = height;
		for (var i = 0; i < times.length-1; i++) { 
			var time = times[i],
			    name = time.name,
				start = time.start,
				end = times[i+1].start,
				color = time.color,
				drawHeight = getPeriodDrawHeight(start, end, height);
			
			/* Draw the eon background */
			ctx.fillStyle = color;
			ctx.fillRect(0, drawPos-drawHeight, eonWidth, drawHeight);
			ctx.strokeStyle = 'black';
			ctx.strokeRect(0, drawPos-drawHeight, eonWidth, drawHeight);
			
			/* Draw the eon text */
			var textWidth = ctx.measureText(name).width;
			ctx.save();
			ctx.font = 'bold';
			ctx.rotate(-Math.PI/2);
			ctx.fillStyle = 'black';
			ctx.fillText(name.toUpperCase(), (drawPos - (drawHeight-textWidth)/2)* -1, 15);
			ctx.restore();
			
			drawPos = drawPos - drawHeight;
		}
	},
	drawScale = function(ctx, width, height) {
		var compressedDivSpan = 100, // draw divisions at every 100 mya for compressed
		    expandedDivSpan = 100, // draw divisions at every 50 mya for expanded
			currTime = times[0].start,
			drawPos = height,
			drawEven = false,
			oddColor = '#ebecee',
			evenColor = '#afb1b0',
			scaleChange = height - height * compressedRatio,
			compressedHeight = height - scaleChange,
			expandedHeight = height - compressedHeight,
			compressedDivHeight = compressedHeight / (myaCompressed / compressedDivSpan),
			expandedDivHeight = expandedHeight / (myaExpanded / expandedDivSpan),
			labelCoords = []; // hold coords and years for labeling step
		
		/* Draw compressed divisions */
		while (currTime > myaExpanded)  {
			drawPos -= compressedDivHeight;
			
			if (drawEven) {
				ctx.fillStyle = evenColor;
			}
			else {
				ctx.fillStyle = oddColor;
			}
			drawEven = !drawEven;
			
			labelCoords.push({
				x: eonWidth+1,
				y: drawPos,
				width: iterationWidth,
				height: compressedDivHeight,
				start: currTime,
				end: currTime - compressedDivSpan,
				compressed: true,
			});
			ctx.fillRect(eonWidth+1, drawPos, iterationWidth, compressedDivHeight);
			
			currTime -= compressedDivSpan;
		}
		
		/* Draw expanded divisions */
		currTime = myaExpanded;
		drawPos = scaleChange;
		var cmod = currTime % 100;
		if (cmod > 0) { // want color changes to demarcate 100 year marks so we make up the difference
			var corrHeight = expandedDivHeight / (expandedDivSpan / cmod);
			drawPos -= corrHeight;
			if (drawEven) {
				ctx.fillStyle = evenColor;
			}
			else  {
				ctx.fillStyle = oddColor;
			}
			drawEven = !drawEven;
			
			labelCoords.push({
				x: eonWidth+1,
				y: drawPos,
				width: iterationWidth,
				height: corrHeight,
				start: currTime,
				end: currTime - cmod,
			});
			ctx.fillRect(eonWidth+1, drawPos, iterationWidth, corrHeight);
			
			currTime -= cmod;
		}
		while (currTime >= 0) {
			drawPos -= expandedDivHeight;
			if (drawEven) {
				ctx.fillStyle = evenColor;
			}
			else {
				ctx.fillStyle = oddColor;
			}
			drawEven = !drawEven;
			
			labelCoords.push({
				x: eonWidth+1,
				y: drawPos,
				width: iterationWidth,
				height: expandedDivHeight,
				start: currTime,
				end: currTime - expandedDivSpan
			});
			ctx.fillRect(eonWidth+1, drawPos, iterationWidth, expandedDivHeight);
			
			currTime -= expandedDivSpan;
		}
		if (drawPos > 0)  {
			if (drawEven) {
				ctx.fillStyle = evenColor;
			}
			else {
				ctx.fillStyle = oddColor;
			}
			
			labelCoords.push({
				x: eonWidth+1,
				y: 0,
				width: iterationWidth,
				height: drawPos,
				start: currTime,
				end: 0
			});
			ctx.fillRect(eonWidth+1, 0, iterationWidth, drawPos);
		}
		
		/* Draw the scale change division */
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.moveTo(eonWidth+1, scaleChange);
		ctx.lineTo(eonWidth+iterationWidth, scaleChange);
		ctx.stroke();
		
		/* Draw the outline */
		ctx.strokeStyle = 'black';
		ctx.strokeRect(eonWidth, 0, iterationWidth, height);
		
		/* Draw the year division labels */
		ctx.fillStyle = 'black';
		for (var i = 0; i < labelCoords.length; i++) {
			var coord = labelCoords[i],
			    text = coord.end,
				textWidth = ctx.measureText(text).width;
			
			if (text > 0 && (!coord.compressed || (text%1000 === 0))) {
				ctx.fillText(text, coord.x + (coord.width-textWidth)/2, coord.y + 6/2);
			}
		}
	},
	drawBar = function(ctx, width, height) {
		drawEons(ctx, width, height);
		drawScale(ctx, width, height);
	},
	pixelBoundsForPeriod = function(start, end, height) {
		var startPx = height,
		    endPx = 0;
		for (var i = 0; i < times.length-1; i++) {
			var time = times[i],
			    next = times[i+1];
			
			if (time.start == start) {
				var drawHeight = getPeriodDrawHeight(time.start, next.start, height);
				endPx = startPx + drawHeight;
				break;
			}
			startPx -= getPeriodDrawHeight(time.start, next.start, height);
		}
		
		return {
			start: startPx,
			end: endPx
		};
	},
	periodBoundsForAge = function(age) {
		for (var i = 0; i < times.length-1; i++) {
			time = times[i],
			next = times[i+1];
			
			if (age <= time.start && age > next.start) {
				return {
					start: time.start,
					end: next.start
				};
			}
		}
	},
	ageToPx = function(age, height) {
		var period = periodBoundsForAge(age),
			pixelBounds = pixelBoundsForPeriod(period.start, period.end, height),
			periodRange = period.start - period.end,
			pixelRange = pixelBounds.end - pixelBounds.start,
			myaPerPixel = periodRange / pixelRange,
			ageSincePeriodStart = period.start - age;
		
		return pixelBounds.start - (ageSincePeriodStart / myaPerPixel);
	},
	generateLinks = function(canvas, rows, clickCb) {
		canvas.addEventListener("click", function(e) {
			var clickX = e.pageX - canvas.offsetLeft,
			    clickY = e.pageY - canvas.offsetTop;
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i],
				    item = row.items[0],
				    text = item.res,
					x = item.x,
					y = row.y,
					width = item.width,
					height = row.height;
				
				if (clickX >= x && clickX <= x + width && clickY <= y && clickY >= y - height) {
					var orgs = text.match(/(.+),/),
					    org = orgs[0].substring(0, orgs[0].length-1);
					
					clickCb(org);
					break;
				}
			}
		});
	},
	drawLabels = function(ctx, width, height, linkClick) {
		var dodger = new LabelDodge(ctx), // make it so labels don't overlap
		    opsTotal = 0,
		    opsDone = 0; // keep track of whether or not all image load events have fired so that dodge can be called correctly
		dodger.left = 64;
		dodger.lineLength = 40;
		
		data.push({
			id: -1,
			name: {
				common: 'SCALE CHANGES'
			},
			branch: {
				'length': 550,
				'correction': 0,
				'showYear': false
			},
			figurines: []
		});
		for (var i = 0; i < data.length; i++) {
			var org = data[i],
			    name = org.name.common || org.name.scientific,
				age = org.branch.length,
				corr = org.branch.correction,
				images = org.figurines;
			
			ctx.fillStyle = 'black';
			dodger.lineToRow(function(ctx2) {
				var visible = name;
				if (age && !org.branch.noshow) {
					visible += ", " + age;
				}
				if (corr) {
					visible += " \u00B1 " + corr;;
				}
				
				var xpos = 0,
				    ypos = ageToPx(age, height),
					rows = [],
				    textWidth = ctx.measureText(visible).width;
				ctx2.fillText(visible, xpos, ypos);
				xpos += textWidth;
				opsTotal += org.figurines.length;
				for (var j = 0; j < org.figurines.length; j++) {
					(function() {
						var fig = org.figurines[j],
							img = new Image(),
							cpyX = xpos,
							cpyY = ypos;
						img.onload = function() { 
							ctx2.drawImage(img, cpyX+10, cpyY-10, 20, 20);
							
							if (++opsDone == opsTotal) { // finished all placement ops, do actual dodging draw
								var rows = dodger.dodge();
								if (linkClick) {
									generateLinks(ctx.canvas, rows, linkClick);
								}
							}
						}
						img.src = fig;
					})();
					xpos += 32;
				}
			});
		}
	};
	
	this.render = function(canvas, linkClick) {
		var context = canvas.getContext('2d'),
		    width = canvas.width,
			height = canvas.height;
		linkClick = typeof linkClick === 'undefined' ? false : linkClick;
		
		drawBar(context, width, height);
		drawLabels(context, width, height, linkClick);
	};
}