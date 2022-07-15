const fs = require('fs');

exports.checkCharacterClaim = function(name)
{
	var claims = JSON.parse(fs.readFileSync('charclaims.json', 'utf8'));
	var claim = claims.find(e => e['name'].toLowerCase() == name.toLowerCase());
	return claim;
}

exports.claimCharacter = function(name, claimant)
{
	var claims = JSON.parse(fs.readFileSync('charclaims.json', 'utf8'));
	var claim = claims.find(e => e['name'].toLowerCase() == name.toLowerCase());
	if (claim)
		return claim;
	claim = {'name': name, 'status': 1, 'claimant': claimant};
	claims.push(claim);
	fs.writeFileSync('charclaims.json', JSON.stringify(claims), 'utf8');
	claim['status'] = 2;
	return claim;
}

exports.listClaims = function(claimant)
{
	var claims = JSON.parse(fs.readFileSync('charclaims.json', 'utf8'));
	return claims.filter(e => e['claimant']['name'] == claimant);
}
