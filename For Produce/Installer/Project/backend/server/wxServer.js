const server=require('express')();
const xmlParser=require('express-xml-bodyparser');
// const {baseURL,introURL}=require('../inc/setting.js');
const {join}=require('path');
const {appendFile}=require('fs');
const fromMsg=require('../util/wxTextReply.js');
const {sysConfig:config}=require('../service/dataService.js');

server.use(xmlParser());
server.listen(80);

server.post('/',(req,res)=>{
	let {openid,msg,reply}=fromMsg(req,res);
	if(msg.type=='text'){
		let {content}=msg;
		if(config.wxKeyWord.includes(content)){
			reply(config.wxTipText);
		}else if(content.startsWith('留言')){
			reply('留言成功！感谢你的支持！');
		}else{
			reply(config.wxFailText);
		}
	}else if(msg.type=='event'){
		if(msg.event=='subscribe'){
			reply(config.wxWelcomeText);
		}else reply('');
	}else reply('');
})

// console.log(config)

