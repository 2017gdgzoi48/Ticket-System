const config=require('../inc/setting.js');

function fromMsg(req,res){
	let {tousername:toUserName,fromusername:openid,msgtype:msgType}=req.body.xml;
	toUserName=toUserName[0]
	openid=openid[0];
	let msg={
		type:msgType[0]
	}
	console.log(msgType)
	if(msgType=='text'){
		msg.content=req.body.xml.content[0];
	}else if(msgType=='event'){
		msg.event=req.body.xml.event[0];
	}

	let textContent=`<xml>
		<ToUserName><![CDATA[${openid}]]></ToUserName>
		<FromUserName><![CDATA[${toUserName}]]></FromUserName>
		<CreateTime>${Date.now()}</CreateTime>
		<MsgType><![CDATA[text]]></MsgType>
		<Content><![CDATA[$$$]]></Content>
	</xml>`;

	let fn=(content)=>{
		if(content.length==0){
			res.end();
			return;
		}
		config.openid=openid;
		for(let key in config){
			// let k='$'+key;
			content=content.replace(new RegExp('\\$'+key,'g'),()=>config[key]);
		}
		res.end(textContent.replace(/\$\$\$/,()=>content));
	}

	return {
		reply:fn,
		// content,
		openid,
		msg
	}
}

module.exports=fromMsg

// let openid=111;
// let toUserName="fuck";
// let textContent=`<xml>
// 		<ToUserName><![CDATA[${openid}]]></ToUserName>
// 		<FromUserName><![CDATA[${toUserName}]]></FromUserName>
// 		<CreateTime>${Date.now()}</CreateTime>
// 		<MsgType><![CDATA[text]]></MsgType>
// 		<Content><![CDATA[$$$]]></Content>
// 	</xml>`;
// let fn=(content)=>{
// 	for(let key in config){
// 		// let k='$'+key;
// 		console.log(key);
// 		content=content.replace(new RegExp('\\$'+key,'g'),()=>config[key]);
// 	}
// 	console.log(textContent.replace(/\$\$\$/,()=>content));
// }
// fn('你好$introURL');	