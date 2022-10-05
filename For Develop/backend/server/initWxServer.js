const server=require('express')();
const {SHA1,enc:cryptoEnc}=require('crypto-js');
const {wxToken}=require('../inc/setting.js');
server.listen(80);

function check(timestamp,nonce){
	var arr=[wxToken,timestamp,nonce];
	var str=arr.sort().join('');
	return SHA1(str).toString(cryptoEnc.Hex);
}

server.get('/',(req,res)=>{
	var {echostr,nonce,timestamp,signature}=req.query;
	var ps=check(timestamp,nonce);
	if(ps!==signature)res.end('');
	else {
		res.end(req.query.echostr);
		setTimeout(()=>{
			process.exit(0);
		},3000)
	}
})

