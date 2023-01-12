const express = require('express');
const fs = require('fs');
const router = express.Router();
const encode = require('./encoder').encode;

const header = fs.readFileSync('header.html', 'utf8');

function GetNumber(original)
{
	var original = parseInt(original);

	if (isNaN(original))
	{
		res.status(400); return 'Not a number.';
	}

	let number = original.toString(16);
	let negative = (parseInt(number, 16) < 0);
	if (negative)
		number = number.slice(1);
	if (parseInt(number, 16) == 0)
		number = '0';

	var handleMyriad = function(num)
	{
		if (typeof(num) != 'string')
			num = num.toString(16);

		var ones = parseInt(num.slice(-1), 16);
		if (ones > 15) {
			res.status(400); return 'Ones digit is out of bounds.';
		}
		var words = [
			'sarhi',   'erhi',    'karhi',   'henrhi',   'nemrhi',
			'nesarhi', 'nenerhi', 'nekarhi', 'nehenrhi', 'nenemrhi',
			'losarhi', 'lonerhi', 'lokarhi', 'lohenrhi', 'lonemrhi',
			'chisarhi' ];
		var longhand = words[ones];

		if (num.length > 1) {
			var tens = parseInt(num.slice(-2, -1), 16);
			if (tens > 15) {
				res.status(400); return 'Tens digit is out of bounds.';
			}
			if (ones == 0) {
				words = [
					'',          'tisarhi',   'tikarhi',   'tihenrhi',   'tinemrhi',
					'tinesarhi', 'tinenerhi', 'tinekarhi', 'tinehenrhi', 'tinenemrhi',
					'tilosarhi', 'tilonerhi', 'tilokarhi', 'tilohenrhi', 'tilonemrhi',
					'ticharhi' ];
				longhand = words[tens];
			} else {
				words = [
					'',        'tie-',    'tika-',   'tihen-',   'tina-',
					'tines-',  'tinene-', 'tineka-', 'tinehen-', 'tinenem-',
					'tinesa-', 'tilone-', 'tiloka-', 'tilohen-', 'tilonem-',
					'ticha-' ];
				longhand = words[tens] + longhand;
			}
		}

		if (num.length > 2) {
			var hundreds = parseInt(num.slice(-3, -2), 16);
			if (hundreds > 15) {
				res.status(400); return 'Hundreds digit is out of bounds.';
			}
			if (ones == 0 && tens == 0) {
				words = [
					'',           'sha-erhi',   'shakarhi',   'shahenrhi',   'shanemrhi',
					'shanesarhi', 'shanenerhi', 'shanekarhi', 'shanehenrhi', 'shanenemrhi',
					'shalosarhi', 'shalonerhi', 'shalokarhi', 'shalohenrhi', 'shalonemrhi',
					'shachisarhi' ];
				longhand = words[hundreds];
			} else {
				words = [
					'',        'sha\'e-',   'shaka-',   'shahene-',  'shana-',
					'shanes-', 'shana\'e-', 'shanaka-', 'shanahen-', 'shanana-',
					'shales-', 'shalo\'e-', 'shaloka-', 'shalohen-', 'shalona-',
					'shachisa-', ];
				longhand = words[hundreds] + longhand;
			}
		}

		if (num.length > 3) {
			var thousands = parseInt(num.slice(-4, -3), 16);
			if (thousands > 15) {
				res.status(400); return 'Thousands digit is out of bounds.';
				return;
			}
			if (ones == 0 && tens == 0 && hundreds == 0) {
				words = [
					'',          'esresarhi', 'eskarhi',   'eshenrhi',   'esnemrhi',
					'esnasarhi', 'esnanerhi', 'esnekarhi', 'esnehenrhi', 'esnenemrhi',
					'eslosarhi', 'eslonerhi', 'eslokarhi', 'eslohenrhi', 'eslonemrhi',
					'eschisarhi', ];
				longhand = words[thousands];
			} else {
				words = [
					'',        'esre-',   'eska-',   'eshen-',   'esnem-',
					'esne-',   'esnene-', 'esneka-', 'esnehen-', 'esnenem-',
					'eslosa-', 'eslone-', 'esloka-', 'eslohen-', 'eslonem-',
					'eschisa-' ];
				longhand = words[thousands] + longhand;
			}
		}
		return longhand;
	}
	var longhand = '';
	if (number.length > 4)
	{
		longhand = handleMyriad(parseInt(number.slice(-4), 16));
		if (longhand == 'sarhi')
			longhand = '';
		var num = number;
		while (num.length > 4)
		{
			num = num.slice(0,-4);
			var myriad = parseInt(num.slice(-4), 16);
			if (myriad == 0)
				longhand = 'setiksre ' + longhand;
			else
				longhand = handleMyriad(myriad) + '-tiksre ' + longhand;
		}
		longhand = longhand.replace(/tiksre se/g, 'tik-se');
	}
	else
		longhand += handleMyriad(number);
	if (negative)
		longhand = 'ut-' + longhand;
	longhand = longhand.trim();

	var feldigits = original.toString(16).toUpperCase();
	feldigits = feldigits.replace(/C/g, 'c');
	feldigits = feldigits.replace(/F/g, 'I');

	return {
		'dec': original,
		'hex': number,
		'fel': longhand,
		'code': encode(longhand, 1),
		'ipa': encode(longhand, 2),
		'fhx': feldigits,
	};
}

router.get('/number/md', function(req, res) {
	var md = '| Decimal | Hex     | Pronounciation               |\n';
	md += '| ------- | ------- | ---------------------------- |\n';
	for (var i = 0; i < 0x40; i++)
	{
		var num = GetNumber(i);
		md += `| ${num['dec'].toString().padEnd(7)} | ${num['fhx'].toString().padEnd(7)} | ${num['fel'].toString().padEnd(28)} |\n`;
	}
	for (var i = 0x40; i < 0x100; i += 0x10)
	{
		var num = GetNumber(i);
		md += `| ${num['dec'].toString().padEnd(7)} | ${num['fhx'].toString().padEnd(7)} | ${num['fel'].toString().padEnd(28)} |\n`;
	}
	for (var i = 0x100; i <= 0x600; i += 0x20)
	{
		var num = GetNumber(i);
		md += `| ${num['dec'].toString().padEnd(7)} | ${num['fhx'].toString().padEnd(7)} | ${num['fel'].toString().padEnd(28)} |\n`;
	}
	for (var i = 0x1000; i <= 0x2000; i += 0x100)
	{
		var num = GetNumber(i);
		md += `| ${num['dec'].toString().padEnd(7)} | ${num['fhx'].toString().padEnd(7)} | ${num['fel'].toString().padEnd(28)} |\n`;
	}
	var num = GetNumber(0x4444);
	md += `| ${num['dec'].toString().padEnd(7)} | ${num['fhx'].toString().padEnd(7)} | ${num['fel'].toString().padEnd(28)} |\n`;

	res.type('.md');
	res.send(md);
});

router.get('/number/:num/json', express.json(), function(req, res) {
	res.json(GetNumber(req.params['num'] || 1));
});

router.get('/number/:num', function(req, res) {
	num = GetNumber(req.params['num'] || 1);
	var html = header;
	html += '<table>\n';
	html += `\t<tr><th>Dec</th><td>${num['dec']}</td></tr>\n`;
	html += `\t<tr><th rowspan=2>Hex</th><td>0x${num['hex'].toUpperCase()}</td></tr>\n`;
	html += `\t<tr><td class="felinese">${num['fhx']}</td></tr>\n`;
	html += `\t<tr><th rowspan=2>Fel</th><td>${num['fel']}</td></tr>\n`;
	html += `\t<tr><td class="felinese">${num['code']}</td></tr>\n`;
	html += `\t<tr><th>IPA</th><td>${num['ipa']}</td></tr>\n`;
	html += '</table>';
	res.send(html);
});

module.exports = router;
