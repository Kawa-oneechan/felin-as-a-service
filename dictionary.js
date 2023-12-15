const express = require('express');
const fs = require('fs');
const os = require('os');
const router = express.Router();
const encode = require('./encoder').encode;

root = "/faas";
console.log(os.hostname());
if (os.hostname().indexOf("Omoikane") > -1)
	root = "";
console.log(`Root: "${root}"`);

const header = fs.readFileSync('header.html', 'utf8').replaceAll("ROOT", root);

const conjCols = [ 'present', 'past', 'future', 'progressive' ];
const conjRows = [
	'1st sing.',
	'2nd sing.',
	'3rd sing.',
	'1st plur.',
	'2nd plur.',
	'3rd plur.',
	'imperative',
	'adjective',
	'interrogative',
	'agentive',
	'abilitive',
	'propositive',
];
const conjSuffixes = [
	[ 'l', 'lw', 'sena', 'lite' ],
	[ 'e', 'ew', 'esew', 'ite' ],
	[ 'n', 'nwa', 'esen', 'nite' ],
	[ 'li', 'lwi', 'senai', 'litei' ],
	[ 'ei', 'ewi', 'esewi', 'itei' ],
	[ 'ni', 'nwai', 'eseni', 'nitei' ],
	[ 'il' ],
	[ 'aw' ],
	[ 'ia' ],
	[ 'fhra' ],
	[ 'rhuw' ],
	[ 'iuhr' ],
];

const conjItems = [
	[ '1s-pres', 'l' ],
	[ '1s-past', 'lw' ],
	[ '1s-ft', 'sena' ],
	[ '1s-prog', 'lite' ],
	[ '2s-pres', 'e' ],
	[ '2s-past', 'ew' ],
	[ '2s-ft', 'esew' ],
	[ '2s-prog', 'ite' ],
	[ '3s-pres', 'n' ],
	[ '3s-past', 'nwa' ],
	[ '3s-ft', 'esen' ],
	[ '3s-prog', 'nite' ],
	[ '1p-pres', 'li' ],
	[ '1p-past', 'lwi' ],
	[ '1p-ft', 'senai' ],
	[ '1p-prog', 'litei' ],
	[ '2p-pres', 'ei' ],
	[ '2p-past', 'ewi' ],
	[ '2p-ft', 'esewi' ],
	[ '2p-prog', 'itei' ],
	[ '3p-pres', 'ni' ],
	[ '3p-past', 'nwai' ],
	[ '3p-ft', 'eseni' ],
	[ '3p-prog', 'nitei' ],
	[ 'imp', 'il' ],
	[ 'adj', 'aw' ],
	[ 'interr', 'ia' ],
	[ 'age', 'fhra' ],
	[ 'abil', 'rhuw' ],
	[ 'prop', 'iurh' ],
];

function makeConjugationsTable(entry)
{
	var html = '<table>\n';
	html += '\t<tr><th></th>';
	conjCols.forEach(c => html += `<th>${c}</th>`);
	html += '</tr>\n';
	for (var i = 0; i < conjRows.length; i++)
	{
		html += `\t<tr><th>${conjRows[i]}</th>`;
		for (var j = 0; j < conjCols.length; j++)
		{
			if (j < conjSuffixes[i].length)
			{
				html += `<td>${entry['felin']}${conjSuffixes[i][j]}</td>`;
			}
			else
				html += '<td></td>';
		}
	}
	html += '</table>\n';
	return html;
}

function makeConjugationsJson(entry)
{
	var ret = {};
	conjItems.forEach(c => ret[c[0]] = entry['felin'] + c[1]);
	return ret;
}

function makeLetterBar(current)
{
	var html = '[';
	const letters = '-abcdefghiklmnoprstuvw';
	for (var i in letters)
	{
		html += '\t';
		if (letters[i] != '-')
			html += '| ';
		html += `<a href="${root}/dict?letter=${letters[i]}">`;
		if (letters[i] == current) html += '<b>';
		html += letters[i].toUpperCase();
		if (letters[i] == current) html += '</b>';
		html += '</a>\n';
	}
	html += ']\n';
	return html;
}

router.get('/dict/json', express.json(), function(req, res) {
	if (req.query['letter'] == undefined)
	{
		res.status(400);
		res.send('Need a letter.');
	}
	else
	{
		const letter = req.query['letter'];
		const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
		var hits  = dict.filter(entry => entry['felin'].startsWith(letter));
		res.json(hits.map(entry => entry['felin']));
	}
});

router.get('/dict/eng/:word/json', express.json(), function(req, res) {
	const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
	req.params['word'] = req.params['word'].toLowerCase();
	var hits = dict.filter(entry => entry['english'].toLowerCase().startsWith(req.params['word']));
	if (hits.length == 0)
	{
		res.send(header + 'No such word.');
		return;
	}

	var ret = [];
	for (var e in hits)
	{
		const entry = hits[e];
		entry['code'] = encode(entry['felin'], 1);
		entry['ipa'] = encode(entry['felin'], 3);
		if (entry['pos'] == 'verb')
			entry['conj'] = makeConjugationsJson(entry);

		ret.push(entry);
	}
	res.json(ret);
});

router.get('/dict/eng/:word', function(req, res) {
	const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
	req.params['word'] = req.params['word'].toLowerCase();
	var hits = dict.filter(entry => entry['english'].toLowerCase().startsWith(req.params['word']));
	if (hits.length == 0)
	{
		res.send(header + 'No such word.');
		return;
	}
	var lastHeader = '';
	var html = header;
	if (req.query['bare'] != undefined) html = '';
	for (var e in hits)
	{
		const entry = hits[e];
		if (lastHeader != entry['felin'])
		{
			if (e) html += '</ol>\n\n';
			html += `<h3>${entry['felin']}</h3>\n<ol>\n`;
			lastHeader = entry['felin'];
		}

		html += `\t<li><b class="pos-${entry['pos']}">${entry['english']}</b>`;
		if (entry['hint'] != undefined)
			html += `, ${entry['hint']}`;
		html += `\n\t<br><span class="felinese">${encode(entry['felin'], 1)}</span> ${encode(entry['felin'], 2)}\n`;
		if (entry['notes'] != undefined)
			html += `\t<br><i>${entry['notes']}</i>\n`;
		if (entry['pos'] == 'verb')
			html += makeConjugationsTable(entry);
		html += '\t</li>\n';
	}
	html += '</ol>'
	res.send(html);
});

router.get('/dict/:word/json', express.json(), function(req, res) {
	const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
	var hits = dict.filter(entry => entry['felin'].startsWith(req.params['word']));
	var decon = null;
	if (hits.length == 0)
	{
		decon = req.params['word'];
		for (var attempts = 0; attempts < 5; attempts++)
		{
			for (var i in conjSuffixes)
			{
				for (var j in conjSuffixes[i])
				{
					var conjCol = conjSuffixes[i][j];
					if (req.params['word'].endsWith(conjCol))
					{
						req.params['word'] = req.params['word'].slice(0, -conjCol.length);
					}
				}
			}
			if (req.params['word'].endsWith('\''))
			{
				req.params['word'] = req.params['word'].slice(0, -1);
			}
			hits = dict.filter(entry => entry['felin'].toLowerCase().startsWith(req.params['word']));
			if (hits.length)
				break;
		}
		if (hits.length == 0)
		{
			res.send(header + 'No such word.');
			return;
		}
	}

	var ret = [];
	for (var e in hits)
	{
		const entry = hits[e];
		entry['code'] = encode(entry['felin'], 1);
		entry['ipa'] = encode(entry['felin'], 3);
		if (entry['pos'] == 'verb')
			entry['conj'] = makeConjugationsJson(entry);

		ret.push(entry);
	}
	res.json(ret);
});

router.get('/dict/:word', function(req, res) {
	const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
	req.params['word'] = req.params['word'].toLowerCase();
	var hits = dict.filter(entry => entry['felin'].toLowerCase().startsWith(req.params['word']));
	var decon = null;
	if (hits.length == 0)
	{
		decon = req.params['word'];
		for (var attempts = 0; attempts < 5; attempts++)
		{
			for (var i in conjSuffixes)
			{
				for (var j in conjSuffixes[i])
				{
					var conjCol = conjSuffixes[i][j];
					if (req.params['word'].endsWith(conjCol))
					{
						req.params['word'] = req.params['word'].slice(0, -conjCol.length);
					}
				}
			}
			if (req.params['word'].endsWith('\''))
			{
				req.params['word'] = req.params['word'].slice(0, -1);
			}
			hits = dict.filter(entry => entry['felin'].toLowerCase().startsWith(req.params['word']));
			if (hits.length)
				break;
		}
		if (hits.length == 0)
		{
			res.send(header + 'No such word.');
			return;
		}
	}
	var lastHeader = '';
	var html = header + makeLetterBar(req.params['word'][0]) + '\n\n';
	console.log(req.query);
	if (req.query['bare'] != undefined) html = '';

	if (decon)
		html += `<p>(Original input was <i>${decon}</i>.)</p>\n`;
	for (var e in hits)
	{
		const entry = hits[e];
		if (lastHeader != entry['felin'])
		{
			if (e) html += '</ol>\n\n';
			html += `<h3>${entry['felin']}</h3>\n<ol>\n`;
			lastHeader = entry['felin'];
		}

		html += `\t<li><b class="pos-${entry['pos']}">${entry['english']}</b>`;
		if (entry['hint'] != undefined)
			html += `, ${entry['hint']}`;
		html += `\n\t<br><span class="felinese">${encode(entry['felin'], 1)}</span> ${encode(entry['felin'], 2)}\n`;
		if (entry['notes'] != undefined)
			html += `\t<br><i>${entry['notes']}</i>\n`;
		if (entry['pos'] == 'verb')
			html += makeConjugationsTable(entry);
		html += '\t</li>\n';
	}
	html += '</ol>'
	res.send(html);
});

router.get('/dict', function(req, res) {
	if (req.query['letter'] == undefined)
	{
		//var html = header + makeLetterBar('*') + '\n\n<p>Please select a starting letter.</p>';
		//res.send(html);
		var html = header + makeLetterBar('*') + fs.readFileSync('dictform.html', 'utf8').replaceAll("ROOT", root);
		res.send(html);
	}
	else
	{
		const letter = req.query['letter'];
		const dict = JSON.parse(fs.readFileSync('../firrhnaproject/dict.json', 'utf8'));
		var html = header + makeLetterBar(letter) + '\n\n<ul>\n';
		var hits  = dict.filter(entry => entry['felin'].startsWith(letter));
		for (var entry in hits)
			html += `\t<li><a href="${root}/dict/${hits[entry]['felin']}">${hits[entry]['felin']}</a> <span class="pos-${hits[entry]['pos']}">-</span> ${hits[entry]['english']}</li>\n`;
		html += '</ul>';
		res.send(html);
	}
});

router.get('/update', function(req, res) {
	const exec = require('child_process').exec;
	exec(
		'curl -o ../firrhnaproject/dict.json https://raw.githubusercontent.com/Kawa-oneechan/firrhna-project-docs/master/dict.json',
		(error, stdout, stderr) => {
			if (error)
			{
				res.status(500);
				res.send(header + `Curling is not a sport. (${error})`);
			}
			else
				res.send(header + `Curling is not a sport, but okay.`);
		}
	);
});

module.exports = router;
