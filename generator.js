const express = require('express');
const fs = require('fs');
const os = require('os');
const router = express.Router();
const seedrandom = require('seedrandom');
const claims = require('./claims');
const getPortrait = require('./portrait').getPortrait;

root = "/faas";
console.log(os.hostname());
if (os.hostname().indexOf("Omoikane") > -1)
	root = "";
console.log(`Root: "${root}"`);

const header = fs.readFileSync('header.html', 'utf8').replaceAll("ROOT", root);

const patterns = JSON.parse(fs.readFileSync('patterns.json', 'utf8'));
const presets = JSON.parse(fs.readFileSync('charpresets.json', 'utf8'));

function pick(fromSet, r)
{
	r = r || Math.random;
	return Math.floor(r() * fromSet.length)
}

function get(fromSet, r)
{
	while (Array.isArray(fromSet))
		fromSet = fromSet[pick(fromSet, r)];
	return fromSet; //should be a string now
}

function process(startingPattern, r)
{
	var thisSet = get(patterns[startingPattern], r);
	while (true)
	{
		var oldSet = thisSet;
		thisSet = thisSet.replace(/\[(.+?)\]/g, function(m,p) { return get(patterns[p], r); });
		if (oldSet == thisSet)
			break;
	}
	return thisSet;
}

function GetName(req, res)
{
	var amount = parseInt(req.query['amount'] || 1);
	if (amount > 100) amount = 100;

	if (req.query['seed'] != undefined)
		seedrandom(req.query['seed'], { global: true });

	var results = [];

	while (amount--)
	{
		var result = {};

		var startingPattern = '';
		if (req.query['male'] != undefined)
			startingPattern = 'male';
		else if (req.query['female'] != undefined)
			startingPattern = 'female';
		else
			startingPattern = get(['male','female']); //lol

		result['name'] = process(startingPattern);
		result['gender'] = startingPattern;

		if (results.find(e => e['name'] == result['name']))
			amount++;
		else
			results.push(result);
	}
	return results;
}

function GetPlace(req, res)
{
	var amount = parseInt(req.query['amount'] || 1);
	if (amount > 100) amount = 100;

	if (req.query['name'] != undefined)
	{
		req.query['name'] = req.query['name'].replace(/[^a-z 0-9]/gi, '');
		req.query['name'] = req.query['name'].replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });
		amount = 1;
		//seedrandom(req.query['name'], { global: true });
	}

	if (req.query['seed'] != undefined)
		seedrandom(req.query['seed'], { global: true });

	var results = [];

	while (amount--)
	{
		var result = {};

		var thisSet = process('place');
		if (req.query['name'] != undefined)
			thisSet = req.query['name'];
		result['name'] = thisSet;

		//Translate
		const translations = ['New?','Color','Thing','thing','PlaceSize'];
		translations.forEach(p => {
			for (var i = 0; i < patterns[p].length; i++)
				thisSet = thisSet.replace(patterns[p][i], patterns[p+'2'][i]);
		});
		result['felinese'] = thisSet;

		if (results.find(e => e['name'] == result['name']))
			amount++;
		else
			results.push(result);
	}
	return results;
}

function GetCharData(result)
{
	if (presets[result['name']] != undefined)
		return presets[result['name']];

	var r = seedrandom(result['name']);

	result['body'] = {
		'build': process('build', r),
		'height': 140 + (Math.floor(r() * 5) * 10),
		'eyes': process('eyeColor', r),
	};
	result['fur'] = {
		'color': process('furColor', r),
		'pattern': process('furPattern' ,r),
	};
	result['hair'] = {
		'color': process('hairColor', r),
		'length': process('hairLength', r),
		'style': process('hairStyle', r),
	};
	var month = Math.floor(r() * 10);
	var days = month < 9 ? (month % 2 == 0 ? 25 : 26) : 27;
	var day = Math.floor(r() * days);
	result['birth'] =
	{
		'month': 1 + month,
		'day': 1 + day,
	};
	result['likes'] = {
		'dress': process('likeDress', r),
		'food': process('likeFood', r),
		'drink': process('likeDrink', r),
	};

	return result;
}

function GetChar(req, res)
{
	if (req.query['claimant'] != undefined)
	{
		var myClaims = claims.listClaims(req.query['claimant']);
		var ret = [];
		for (var e in myClaims)
			ret.push(GetChar({'query': { 'amount': 1, 'name': myClaims[e]['name'] }}, res)[0]);
		//console.log(ret);
		return ret;
	}

	var amount = parseInt(req.query['amount'] || 1);
	if (amount > 100) amount = 100;

	if (req.query['name'] != undefined)
	{
		req.query['name'] = req.query['name'].replace(/[^a-z 0-9]/gi, '');
		req.query['name'] = req.query['name'].replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });
		amount = 1;
		seedrandom(req.query['name'], { global: true });
	}

	if (req.query['seed'] != undefined)
		seedrandom(req.query['seed'], { global: true });

	var results = [];

	while (amount--)
	{
		var result = {};

		var maybeBless = false;
		var startingPattern = '';
		if (req.query['male'] != undefined)
			startingPattern = 'male';
		else if (req.query['female'] != undefined)
			startingPattern = 'female';
		else if (req.query['blessed'] != undefined)
			startingPattern = get(['male','female']);
		else
		{
			maybeBless = true;
			startingPattern = get(['male','female']);
		}

		result['name'] = process(startingPattern);

		if (req.query['name'] != undefined)
			result['name'] = req.query['name'];

		var holoCheat = false;
		if (result['name'] == 'Holo') {
			result['name'] = 'Horo';
			startingPattern = 'blessed';
			holoCheat = true;
		}

		result['gender'] = startingPattern;
		if ((maybeBless && Math.random() > 0.98) || (req.query['blessed'] != undefined))
			result['gender'] = 'blessed';

		result = GetCharData(result);

		if (holoCheat)
			result['name'] = 'Holo';

		if (results.find(e => e['name'] == result['name']))
			amount++;
		else
			results.push(result);
	}
	return results;
}

function genderIcon(r)
{
	if (r['gender'] == 'male')
		return '&#x2642;';
	else if (r['gender'] == 'female')
		return '&#x2640;';
	else if (r['gender'] == 'blessed')
		return 'x';
	return '?';
}

function genderName(r)
{
	if (r['gender'] == 'male')
		return 'felir';
	else if (r['gender'] == 'female')
		return 'fela';
	else if (r['gender'] == 'blessed')
		return 'felhru';
	return 'felin';
}

function heOrShe(r, initial)
{
	if (r['gender'] == 'male')
		return initial ? 'He' : 'he';
	else if (r['gender'] == 'female')
		return initial ? 'She' : 'she';
	return initial ? 'They' : 'they';
}

function isOrAre(r)
{
	if (r['gender'] == 'blessed')
		return 'are';
	return 'is';
}

function was(r)
{
	if (r['gender'] == 'blessed')
		return 'were';
	return 'was';
}

router.get('/namegen/json', express.json(), function(req, res) {
	res.json(GetName(req, res));
});

router.get('/namegen/table', function(req, res) {
	var results = GetName(req, res);
	var html = header + '<table>\n\t<th>#</th><th>Name</th>\n';
	if (req.query['male'] != undefined || req.query['female'] != undefined)
		html += '</tr>\n';
	else
		html += '<th>Gender</th></tr>\n';
	var i = 0;
	if (req.query['male'] != undefined || req.query['female'] != undefined)
		results.forEach(r => { i++; html += `\t<tr><td>${i}</td><td>${r['name']}</td></tr>\n`; });
	else
		results.forEach(r => { i++; html += `\t<tr><td>${i}</td><td>${r['name']}</td><td>${r['gender']}</td></tr>\n`; });
	html += '</table>\n';
	res.send(html);
});

router.get('/namegen', function(req, res) {
	var results = GetName(req, res);
	var html = header + '<ol>\n';
	if (req.query['male'] != undefined || req.query['female'] != undefined)
		results.forEach(r => { html += `\t<li>${r['name']}</li>\n`; });
	else
		results.forEach(r => { html += `\t<li>${r['name']} ${genderIcon(r)}</li>\n`; });
	html += '</ol>\n';
	res.send(html);
});




router.get('/placegen/json', express.json(), function(req, res) {
	res.json(GetPlace(req, res));
});

router.get('/placegen/table', function(req, res) {
	var results = GetPlace(req, res);
	var html = header + '<table>\n\t<th>#</th><th>English</th><th>Felinese</th></tr>\n';
	var i = 0;
	results.forEach(r => { i++; html += `\t<tr><td>${i}</td><td>${r['name']}</td><td>${r['felinese']}</td></tr>\n`; });
	html += '</table>';
	res.send(html);
});

router.get('/placegen', function(req, res) {
	var results = GetPlace(req, res);
	var html = header + '<ol>\n';
	results.forEach(r => { html += `\t<li>${r['name']} (${r['felinese']})</li>\n`; });
	html += '</ol>\n';
	res.send(html);
});



router.get('/chargen/json', express.json(), function(req, res) {
	var r = GetChar(req, res);
	res.json(r);
});

router.get('/chargen/claim', function(req, res) {
	var html = header + '\n';
	var name = req.query['name'].replace(/[^a-z0-9]/gi, '');
	name = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });

	html += 'If you want to claim this character, visit the Firrhna Project or bcord Discord server and say this:<p>\n';
	html += `<tt>$char claim ${name}</tt>`;
	res.send(html);
});

router.get('/chargen/table', function(req, res) {
	var results = GetChar(req, res);
	if (results.length == 0) {
		res.send(header + '\nNo results to show.');
		return;
	}
	var html = header + '<table>\n';
	html += '\t<th rowspan=2>#</th><th rowspan=2>Name</th><th rowspan=2>Gender</th><th colspan=2>Body<th><th colspan=2>Fur</th><th colspan=3>Hair</th>';
	html += '<th colspan=3>Birth</th><th colspan=3>Likes</th><th rowspan=2>Status</th></tr>\n';
	html += '\t<th>Build</th><th>Height</th><th>Eyes</th><th>Color</th><th>Pattern</th><th>Color</th><th>Length</th><th>Style</th>';
	html += '<th colspan=2>Month</th><th>Day</th><th>Dress</th><th>Food</th><th>Drink</th>';
	html += '<tr>\n';
	var i = 0;
	results.forEach(r => {
		i++;

		var name = r['name'].replace(/[^a-z 0-9]/gi, '');
		name = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });

		var claimLink = `<a href="/chargen/claim/?name=${r['name']}">`;
		var claimHtml = `${claimLink}Claimable</a>`;
		var claim = claims.checkCharacterClaim(r['name']);
		if (claim) {
			if (claim['gender']) r['gender'] = claim['gender'];
			if (r['status'] & 1) claimHtml = `Premium, claimed by <a href="/faas/chargen/table/?claimant=${claim['claimant']['name']}">${claim['claimant']['name']}</a>`;
			else claimHtml = `Claimed by <a href="/faas/chargen/table/?claimant=${claim['claimant']['name']}">${claim['claimant']['name']}</a>`;
		}
		else
			if (r['status'] & 1) claimHtml = `Premium, ${claimLink}claimable</a>`;

		html += `\t<tr><td>${i}</td><td>${r['name']}</td><td>${r['gender']}</td>`;
		html += `<td>${r['body']['build']}</td><td>${r['body']['height']}cm</td><td>${r['body']['eyes']}</td>`;
		html += `<td>${r['fur']['color']}</td><td>${r['fur']['pattern']}</td>`;
		html += `<td>${r['hair']['color']}</td><td>${r['hair']['length']}</td><td>${r['hair']['style']}</td>`;

		if (r['birth']['month'])
			html += `<td>${r['birth']['month']}</td><td>${patterns['months'][r['birth']['month'] - 1]}</td><td>${r['birth']['day']}</td>`;
		else
			html += '<td colspan=3>Unknown</td>';

		html += `<td>${r['likes']['dress']}</td><td>${r['likes']['food']}</td><td>${r['likes']['drink']}</td>`;

		html += `<td>${claimHtml}</td>`;

		html += `</tr>\n`; });
	html += '</table>';
	res.send(html);
});

function aOrAn(thing)
{
	if (thing[0] == 'a' ||
		thing[0] == 'e' ||
		thing[0] == 'i' ||
		thing[0] == 'o' ||
		thing[0] == 'u')
		return 'an ' + thing;
	return 'a ' + thing;
}

function getCharProse(r)
{
	var birthDay = `${patterns['months'][r['birth']['month'] - 1]} ${r['birth']['day']}`;
	if (r['birth']['month'] == 0)
		birthDay = 'an unknown date';

	var ret = `${r['name']} is ${aOrAn(r['body']['build'])} ${genderName(r)}, ${r['body']['height']} centimeters tall,`;
	ret += ` with ${r['hair']['length']}, ${r['hair']['style']}, ${r['hair']['color']} hair, ${r['body']['eyes']} eyes,`;
	ret += ` and ${r['fur']['color']} fur${r['fur']['pattern']=='none' ? '' : ' with '+r['fur']['pattern']}.`;
	ret += ` ${heOrShe(r,true)} ${r['gender']=='blessed'?'were':'was'} born on ${birthDay}.`;
	ret += ` ${heOrShe(r,true)} ${r['gender']=='blessed'?'like':'likes'} ${r['likes']['dress']}, ${r['likes']['food']}, and ${r['likes']['drink']}.`;

	return ret;
}

router.get('/chargen/botprose', function(req, res) {
	var results = GetChar(req, res);
	if (results.length == 0) {
		res.send('No results to show.');
		return;
	}
	var r = results[0];
	var name = r['name'].replace(/[^a-z0-9]/gi, '');
	name = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });

	var ret = {
		'name': r['name'],
		'status': r['status'],
		'prose': getCharProse(r),
		'claim': claims.checkCharacterClaim(r['name']) || {'status':0},
	};
	res.json(ret);
});

router.get('/chargen/portrait', async function(req, res) {
	var results = GetChar(req, res);
	var r = results[0];
	var name = r['name'].replace(/[^a-z0-9]/gi, '');
	r['name'] = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });
	var buffer = await getPortrait(r, req);
	res.set('Content-Type', 'image/png')
	res.send(buffer);
});

router.get('/chargen', function(req, res) {
	var results = GetChar(req, res);
	if (results.length == 0) {
		res.send(header + '\nNo results to show.');
		return;
	}
	var html = header + '<ol>\n';
	results.forEach(r => {
		var name = r['name'].replace(/[^a-z0-9]/gi, '');
		name = name.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1); });

		var claimLink = `<a href="/faas/chargen/claim/?name=${r['name']}">`;
		var claimText = `${heOrShe(r,true)} can be ${claimLink}claimed</a>.`;
		var claim = claims.checkCharacterClaim(r['name']);
		if (claim) {
			if (claim['gender']) r['gender'] = claim['gender'];
			if (r['status'] & 1) claimText = `${heOrShe(r,true)} ${isOrAre(r)} a premium character, claimed by <a href="/faas/chargen/table/?claimant=${claim['claimant']['name']}">${claim['claimant']['name']}</a>.`;
			else claimText = `${heOrShe(r,true)} ${isOrAre(r)} claimed by <a href="/faas/chargen/table/?claimant=${claim['claimant']['name']}">${claim['claimant']['name']}</a>.`;
		}
		else
			if (r['status'] & 1) claimText = `${heOrShe(r,true)} ${isOrAre(r)} a premium character and can be ${claimLink}claimed</a>.`;

		html += `\t<li>${getCharProse(r)} ${claimText}</li>`;
	});
	html += '</ol>';
	res.send(html);
});


module.exports = router;
