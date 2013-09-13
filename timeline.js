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
			start: 4500,
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
			start: 550,
			color: '#99c18d'
		},
		{
			name: 'Mesozoic',
			start: 250,
			color: '#64c6c9'
		},
		{
			name: 'Cenozoic',
			start: 60,
			color: '#ebe82b'
		},
		{ // used as a stopper
			name: '',
			start: 0,
			color: ''
		}
	],
	myaExpanded = 550, // total number of years accounted for in expanded region
	myaCompressed = 3950, // total number of years accounted for in compressed region
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
			evenColor = '#ebecee',
			oddColor = '#afb1b0',
			scaleChange = height - height * compressedRatio,
			compressedHeight = height - scaleChange,
			expandedHeight = height - compressedHeight,
			compressedDivHeight = compressedHeight / (myaCompressed / compressedDivSpan),
			expandedDivHeight = expandedHeight / (myaExpanded / expandedDivSpan),
			drawCoords = [];
		
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
			
			ctx.fillRect(eonWidth+1, drawPos, iterationWidth, expandedDivHeight);
			
			currTime -= expandedDivHeight;
		}
		if (drawPos > 0)  {
			if (drawEven) {
				ctx.fillStyle = evenColor;
			}
			else {
				ctx.fillStyle = oddColor;
			}
			
			ctx.fillRect(eonWidth+1, 0, iterationWidth, drawPos);
		}
		
		/* Draw the scale division */
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.moveTo(eonWidth+1, scaleChange);
		ctx.lineTo(eonWidth+iterationWidth, scaleChange);
		ctx.stroke();
		
		/* Draw the outline */
		ctx.strokeStyle = 'black';
		ctx.strokeRect(eonWidth, 0, iterationWidth, height);
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
	drawLabels = function(ctx, width, height) {
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
				'noshow': true
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
								dodger.dodge();
							}
						}
						img.src = fig;
					})();
					xpos += 32;
				}
			});
		}
	};
	
	this.render = function(canvas) {
		var context = canvas.getContext('2d'),
		    width = canvas.width,
			height = canvas.height;
		
		drawBar(context, width, height);
		drawLabels(context, width, height);
	};
}