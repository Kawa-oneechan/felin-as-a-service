const express = require('express');
const Jimp = require('jimp');

exports.getPortrait = async function(res, req)
{
	const colors = { //HSV 360, 100, 100
		'brown': [ 25, 54, 26 * 2 ],
		'golden brown': [ 37, 100, 37 * 1.5 ],
		'dark brown': [ 37, 100, 50 * 1.5 ],
		'amber': [ 26, 58, 40 ],
		'red': [ 0, 70, 53 / 2 ],

		'counter-brown': [ 24, 29, 54 / 2 ],
	};

	var image = await Jimp.read('portraits/base.png');

	const parts = [
		[ 'body', res['fur']['color'] ],
		[ 'countershade' ],
		[ 'body-nc' ],
		[ 'eyes', res['body']['eyes'] ],
		[ 'shirt' ],
		[ 'hair1', res['hair']['color'] ],
		[ 'border' ],
	];
	for (var i = 0; i < parts.length; i++)
	{
		var p = parts[i];

		if (p[0] == 'border' && (res['status'] & 1))
			p[0] = 'premium';

		var part = await Jimp.read('portraits/' + p[0] + '.png');
		if (p[0] == 'countershade')
			p[1] = 'counter-' + res['fur']['color'];

		if (p[1])
		{
			var c = colors[p[1]];
			if (c == undefined)
			{
				c = colors[res['fur']['color']];
				if (c == undefined)
					c = [0, 0, 0];
				c[2] -= 10;
			}

			part.color([
				{ 'apply': 'shade', 'params': [ c[2] ] },
				{ 'apply': 'saturate', 'params': [ c[1] ] },
				{ 'apply': 'spin', 'params': [ c[0] ] }
			]);
		}
		image.composite(part, 0, 0);
	};

	var scale = req.query['scale'] || 3;
	if (scale < 1) scale = 0;
	if (scale > 10) scale = 10;
	image.resize(image.bitmap.width * scale, image.bitmap.height * scale, Jimp.RESIZE_NEAREST_NEIGHBOR);

	return image.getBufferAsync('image/png');
}
