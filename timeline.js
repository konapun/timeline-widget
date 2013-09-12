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
		/* Extended */
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
	compressedRatio = 1/4, // how much of the space to use for compressed periods
	
	getPeriodDrawHeight = function(start, end, totalHeight) {
		var availablePixels = totalHeight,
		    myaExpanded = 550, // total number of years accounted for in expanded region
			myaCompressed = 3950, // total number of years accounted for in compressed region
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
	drawScale = function(ctx, width, height) {
		var textHeight = 8, // height of text in pixels, will be width when drawn vertically
		    drawPos = height,
			evenColor = '#ebecee',
			oddColor = '#afb1b0',
			eonWidth = 24,
			iterationWidth = 38,
			drawEven = true,
			drawCoords = [];
		for (var i = 0; i < times.length-1; i++) {
			var time = times[i],
			    name = time.name,
				start = time.start,
				end = times[i+1].start,
				color = time.color,
				drawHeight = getPeriodDrawHeight(start, end, height);
			
			/* draw the background */
			ctx.fillStyle = color;
			ctx.fillRect(0, drawPos-drawHeight, eonWidth, drawHeight);
			ctx.strokeStyle = 'black';
			ctx.strokeRect(0, drawPos-drawHeight, eonWidth, drawHeight);
			
			/* Draw the scale lines */
			var divisions = 100, // draw divisions at every 100mya
			    iterations = (start - end) / divisions,
				iterationHeight = drawHeight / iterations,
				iterDrawPos = drawPos;
			for (var j = 0; j < iterations; j++) {
				if (drawEven) {
					ctx.fillStyle = evenColor;
				}
				else {
					ctx.fillStyle = oddColor;
				}
				drawEven = !drawEven;
				
				/* Iteration background */
				var drawCoord = {
					x: eonWidth+1,
					y: iterDrawPos-iterationHeight,
					width: iterationWidth,
					height: iterationHeight,
					start: start,
					end: end,
					span: start - end,
					iter: j
				};
				ctx.fillRect(drawCoord.x, drawCoord.y, drawCoord.width, drawCoord.height);
				drawCoords.push(drawCoord);
				
				iterDrawPos = iterDrawPos - iterationHeight;
			}
			
			/* Outline the iterations scale */
			ctx.strokeStyle = 'black';
			ctx.strokeRect(eonWidth, 0, iterationWidth, height);
			
			/* draw the era text*/
			var textWidth = ctx.measureText(name).width;
			ctx.save();
			ctx.font = 'bold';
			ctx.rotate(-Math.PI/2);
			ctx.fillStyle = 'black';
			ctx.fillText(name.toUpperCase(), (drawPos - (drawHeight-textWidth)/2)* -1, 15);
			ctx.restore();
			
			drawPos = drawPos - drawHeight;
		}
		
		/* FIXME Draw the year labels */
		/*
		ctx.fillStyle = 'black';
		for (var i = 0; i < drawCoords.length; i++) {
			var coord = drawCoords[i];
			
			if (i%4 == 0) ctx.fillText('- ' + (coord.end - (coord.span * coord.iter)) + ' -', coord.x, coord.y, iterationWidth);
		}
		*/
		
		/* Draw the scale change division line */
		var divYPos = height - height * compressedRatio;
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.moveTo(eonWidth+1, divYPos);
		ctx.lineTo(63, divYPos);
		ctx.stroke();
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
							ctx2.drawImage(img, cpyX+10, cpyY-15, 30, 30);
							
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
		
		drawScale(context, width, height);
		drawLabels(context, width, height);
	};
}