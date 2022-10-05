const ActivityService=require('../service/ActivityService.js');
const TicketService=require('../service/TicketService.js');
const UserService=require('../service/UserService.js');
const DataService=require('../service/dataService.js');
const getCode=require('../inc/codeConfig.js');
// const {camelToUnderline,handleFileObj}=require('../util/commonUtil.js');
const {apiRoute,handleErr}=require('../util/apiUtil.js');
// const checkLoop=require('../util/arrange/checkLoop.js');
const {exportUserTable,exportTicketTable}=require('../util/exportTable.js');
const {extname,resolve}=require('path');

const AS=new ActivityService();
const TS=new TicketService();
const US=new UserService();


function endService(){
	AS.end();
	TS.end();
	US.end();
}

let api=new apiRoute();
// console.log(turnIntoFormat({aid:String},{aid:'11111'}));

api.def('userLogin',(req,res)=>{
	let openid=req.body.openid;
	US.userLogin(openid).then(user=>{
		if(!user){
			res.json(getCode(300));
			return ;
		}
		req.session.userInfo=user;
		res.json(getCode(200,user));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	format:{openid:String}
});

api.def('adminLogin',(req,res)=>{
	let password=req.body.password;
	US.adminLogin(password).then(result=>{
		if(!result){
			res.json(getCode(304));
			return ;
		}
		// console.log(req.session);
		req.session.userInfo=result;
		res.json(getCode(200,result));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	format:{password:String}
});

api.def('getUser',(req,res)=>{
	let userInfo=req.session.userInfo;
	if(userInfo.level<1||(userInfo.level==1&&typeof req.query.uid=='undefined')) //当用户不是管理员自己时，只能获取自己的信息
		res.json(getCode(201,userInfo));
	else if(userInfo.level==1){
		US.getUserDetail(req.query.uid).then(userInfo=>{
			if(!userInfo)res.json(getCode(311));
			else res.json(getCode(201,userInfo));
		}).catch(err=>handleErr(err,res));
	}
	else res.json(getCode(401));
},{
	format:{'uid?':Number},
	needAccess:-1
});

api.def('deleteUser',(req,res)=>{
	US.deleteUser(req.query.uid).then(()=>{
		res.json(getCode(202));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	format:{uid:Number}
})

api.def('getAllUser',(req,res)=>{
	// console.log(req.query);
	let {condition,option}=req.query;
	US.getAllUser(condition,option).then(userList=>{
		res.json(getCode(203,userList));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	defaults:'selectionDefaults'
})

api.def('getAllTicket',(req,res)=>{
	let {aid,condition,option}=req.query;
	TS.getAllTicket(aid,condition,option).then(ticketList=>{
		res.json(getCode(204,ticketList));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	defaults:['selectionDefaults',{aid:null}]
})

api.def('getAllActivity',(req,res)=>{
	let {condition,option}=req.query;	
	AS.getAllActivity(condition,option).then(activityList=>{
		res.json(getCode(205,activityList));
	}).catch(err=>handleErr(err,res));
},{
	defaults:'selectionDefaults'
})

api.def('getActivityInfo',(req,res)=>{
	AS.getActivityInfo(req.query.aid).then(activity=>{
		if(!activity)res.json(getCode(312));
		else res.json(getCode(222,activity));
	}).catch(err=>handleErr(err,res));
},{
	format:{aid:Number}
})

api.def('changeAdminPassword',(req,res)=>{
	let password=req.body.password;
	US.changeAdminPassword(password).then(()=>{
		res.json(getCode(206));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	needAccess:1,
	format:{password:String}
});

api.def('createActivity',(req,res)=>{
	let initObj={...req.query,...req.files};
	initObj.background=req.files.background[0];
	AS.createActivity(initObj).then(aid=>{
		res.json(getCode(207,{aid}));
	}).catch(err=>handleErr(err,res));
},{
	formatGet:{
		openTime: Date, 
		closeTime: Date,
		activityName: String,
		description: String,
		laucher: String,
		limitNum: Number,
		seatMap: String,
		mode: Number
	},
	files:['background','posterImg'],
	needAccess:1,
	method: 'post'
});

api.def('uploadPoster',(req,res)=>{
	let {aid}=req.query;
	// console.log(req.files);
	AS.uploadPoster(aid,req.files.posterImg).then(()=>{
		res.json(getCode(208));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	formatGet:{aid:Number},
	files:['posterImg'],
	needAccess:1
});

api.def('removePoster',(req,res)=>{
	let {aid,removeName}=req.query;
	AS.removePoster(aid,[removeName]).then(()=>{
		res.json(getCode(209));
	}).catch(err=>handleErr(err,res));
},{
	method:'get',
	format:{
		aid:Number,
		removeName:String
	},
	needAccess:1
});

api.def('getPoster',(req,res)=>{
	let {path}=req.query;
	res.setHeader('x-frame-options','ALLOW-FROM http://localhost:3000'); //轮播图
	let ds=new DataService();
	// console.log(__dirname,'../resourceImg/',path);
	ds.readFile(resolve(__dirname,'../resourceImg/',path)).then(buffer=>{
		// console.log(buffer);
		if(!buffer){
			res.json(getCode(305));
			return;
		}
		res.end(buffer);
		ds.end();
	}).catch(err=>handleErr(err,res));
},{
	format:{path:String}
});

api.def('deleteActivity',(req,res)=>{
	AS.deleteActivity(req.query.aid).then(()=>{
		res.json(getCode(210));
	}).catch(err=>handleErr(err,res));
},{
	format:{aid:Number},
	needAccess:1
})

api.def('updateUser',(req,res)=>{
	let {uid,...data}=req.query,{userInfo}=req.session;
	uid=uid || userInfo.uid;
	if(!userInfo||(userInfo.uid!==uid&&userInfo.level<1))return res.json(getCode(300));
	US.updateUser(uid,data).then(user=>{
		// console.log(user);
		if(uid==userInfo.uid)req.session.userInfo=user;
		res.json(getCode(211,user));
	}).catch(err=>handleErr(err,res));
},{
	defaults:{
		cardid:'',
		realName:'',
		schoolType:''
	},
	format:{'uid?':Number},
	needAccess:-1
});

api.def('updateActivity',(req,res)=>{
	let {aid}=req.query,changeData=req.body || {};
	// console.log(changeData);
	AS.updateActivityInfo(aid,changeData).then(()=>{
		res.json(getCode(212));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	formatGet:{aid:Number},
	formatPost:{
		'openTime?':Date,
		'closeTime?':Date
	},
	needAccess:1,
});

api.def('updateArea',(req,res)=>{
	let {areaid}=req.query,changeData=req.body || {};
	AS.updateAreaInfo(areaid,changeData).then(()=>{
		res.json(getCode(213));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	needAccess:1,
	formatGet:{areaid:Number}
});

api.def('setArea',(req,res)=>{
	let {aid}=req.query,{areaArr}=req.body;
	AS.setArea(aid,areaArr).then(()=>{
		res.json(getCode(214));
	}).catch(err=>handleErr(err,res));
},{
	method:'post',
	needAccess:1,
	formatGet:{aid:Number},
	formatPost:{
		areaArr:[{
			color:String,
			areaName:String,
			price:Number
		}]
	}
});

api.def('getActivityBackground',(req,res)=>{
	let {aid}=req.query;
	AS.getBackground(aid).then(img=>{
		res.end(img);
	}).catch(err=>handleErr(err,res));
},{
	format:{aid:Number}
})

api.def('getBelonging',(req,res)=>{
	let {uid,payer}=req.query;
	if(!uid){
		console.log(Date.now())
		if(!payer){
			payer=req.session.userInfo;
			payer=payer.cardid+payer.schoolType;
		}
		TS.getAllTicket(null,{payer}).then(ticketList=>{
			res.json(getCode(215,ticketList));
			console.log(Date.now())
		}).catch(err=>handleErr(err,res));
	}else if(uid&&!payer){
		US.getUserDetail(uid).then(user=>{
			return TS.getAllTicket(null,{payer:user.cardid+user.schoolType});
		}).then(ticketList=>{
			res.json(getCode(215,ticketList));
		}).catch(err=>handleErr(err,res));
	}else {
		res.json(getCode(313));
	}
},{
	needAccess:0,
	format:{
		'uid?':Number,
		'payer?':String
	}
});

api.def('buyTicket',(req,res)=>{
	let {payer,content,aid}=req.query;
	if(!payer||req.session.level<1)payer=req.session.userInfo;
	let payerStr=payer.cardid+payer.schoolType,payerId=payer.uid;

	// if(Math.random()>0.5){res.json(getCode(310));throw Error();}

	let limit;
	AS.getActivityInfo(aid).then(activity=>{
		let {limitNum,openTime,closeTime}=activity;

		//检查买票时间
		let now=Date.now();
		if(now<openTime&&payer.level<1){res.json(getCode(309));throw Error();}
		if(now>closeTime&&payer.level<1){res.json(getCode(310));throw Error();}

		limit=limitNum;
		return TS.getAllTicket(aid,{payer:payerStr});
	}).then(ticketList=>{
		let nowNum=ticketList.length;
		if(nowNum>=limit&&payer.level<1){//票数达到上限
			res.json(getCode(308));
			throw Error();
		}else{
			return TS.addTicket(content,payer,aid);
		}
	}).then(()=>{
		res.json(getCode(216));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:0,
	format:{
		'payer?':{
			uid:Number,
			cardid:String,
			schoolType:String
		},
		content:[Number,String,Number,Number],
		aid:Number
	}
})


api.def('buyTicketMode2',(req,res)=>{
	let {payer,content,aid}=req.query;
	if(!payer||req.session.level<1)payer=req.session.userInfo;
	let payerStr=payer.cardid+payer.schoolType,payerId=payer.uid;

	// if(Math.random()>0.5){res.json(getCode(310));throw Error();}

	let limit;
	AS.getActivityInfo(aid).then(activity=>{
		let {limitNum,openTime,closeTime}=activity;

		//检查买票时间
		let now=Date.now();
		if(now<openTime&&payer.level<1){res.json(getCode(309));throw Error();}
		if(now>closeTime&&payer.level<1){res.json(getCode(310));throw Error();}

		limit=limitNum;
		return TS.getAllTicket(aid,{payer:payerStr});
	}).then(ticketList=>{
		let nowNum=ticketList.length;
		if(nowNum>=limit&&payer.level<1){//票数达到上限
			res.json(getCode(308));
			throw Error();
		}else{
			return TS.addTicket(content,payer,aid,2);
		}
	}).then(()=>{
		res.json(getCode(216));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:0,
	format:{
		'payer?':{
			uid:Number,
			cardid:String,
			schoolType:String
		},
		content:[Number,String,Number,Number],
		aid:Number
	}
})

api.def('validateTicket',(req,res)=>{
	let {token}=req.query;
	TS.validateTicket(token).then(ticket=>{
		if(ticket==null)res.json(getCode(307));
		else res.json(getCode(217,ticket));	
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	format:{token:String}
})

api.def('clearOldTicket',(req,res)=>{
	let {aid}=req.query;
	TS.clearOldTicket(aid).then(ticketList=>{
		let promiseArr=[];
		ticketList.forEach(ticket=>{
			let {row,col}=ticket.content;
			promiseArr.push(AS.setStatus(aid,row,col,'s','returnTicket'));
		})
		return Promise.all(ticketList).then(()=>{
			res.json(getCode(218,ticketList));
		});	
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	format:{aid:Number}
})

api.def('useTicket',(req,res)=>{
	let {tid}=req.query;
	TS.useTicket(tid).then(()=>{
		res.json(getCode(219));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	format:{tid:Number}
})

api.def('returnTicket',(req,res)=>{
	let {tid}=req.query;
	let {uid,level,cardid,schoolType}=req.session.userInfo;
// res.json(getCode(315));throw Error();
	TS.getTicketDetail(tid).then(ticket=>{
		if(!ticket){
			res.json(getCode(315));
			throw Error();
		}
		let {row,col}=ticket.content,{aid,payer:ticketPayer}=ticket;
		if((cardid!==ticketPayer.cardid||schoolType!==ticketPayer.schoolType)&&level<1){//普通用户不能删别人的票！！！
			res.json(getCode(314));
			throw Error();
		}
		return TS.removeTicket(tid);
	}).then(()=>{
		res.json(getCode(220));
	}).catch(err=>handleErr(err,res));
},{
	format:{tid:Number},
	needAccess:0
})

api.def('addPayerInfo',(req,res)=>{
	let {tid,cardid}=req.query;
	let openid=Math.round(Math.random()*10e10).toString(16);
	US.createUser(openid).then(user=>{
		return US.updateUser(user.uid,{
			cardid,schoolType:'B',realName:'TEMP'
		});
	}).then(user=>{
		return TS.changePayerInfo(tid,user);
	}).then(()=>{
		res.json(getCode(221));
	}).catch(err=>handleErr(err,res));
},{
	format:{tid:Number,cardid:Number},
	needAccess:1
})

api.def('getUserPhoto',(req,res)=>{
	function readImg(cardid){
		let ds=new DataService();
		ds.readFile(resolve(__dirname,`../resourceImg/userPhoto/${cardid}.jpg`)).then(img=>{
			res.end(img);
			ds.end();
		}).catch(err=>{
			res.sendFile(resolve(__dirname,'../resourceImg/static/placeholder.jpg'));
			ds.end();
		});
	}
	let {uid,cardid}=req.query;
	if(cardid){
		readImg(cardid);
		return;
	}
	US.getUserDetail(uid).then(user=>{
		if(!user){
			readImg('');
			return;
		}
		let {cardid,schoolType}=user;
		res.setHeader('Content-Type','image/jpeg');
		readImg(cardid+schoolType);
	}).catch(err=>handleErr(err,res));
},{
	format:{
		'uid?': Number,
		'cardid?':String
	},
	needAccess:1
})

api.def('exportUserTable',(req,res)=>{
	US.getAllUser().then(list=>{
		return exportUserTable(list)
	}).then(xlsx=>{
		res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.end(xlsx);
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1
})

api.def('exportTicketTable',(req,res)=>{
	TS.getAllTicket().then(list=>{
		return exportTicketTable(list);
	}).then(xlsx=>{
		res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.end(xlsx);
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1
})

api.def('round2BuyTicket',(req,res)=>{
	let {aid,content,cardid,schoolType}=req.query;
	let openid=Math.round(Math.random()*10e10).toString(16);
	let tid,token,limitNum;
	AS.getActivityInfo(aid).then(activity=>{
		limitNum=activity.limitNum;
		return TS.getBelonging({
			cardid,schoolType
		})
	}).then(ticketList=>{
		if(ticketList.length>limitNum){
			res.json(getCode(308));
			throw new Error;
		}
		return US.createUser(openid);
	}).then(user=>{
		return US.updateUser(user.uid,{
			cardid,schoolType,realName:'TEMP'
		});
	}).then(user=>{
		return TS.addTicket(content,user,aid);
	}).then(ticket=>{
		tid=ticket.tid,token=ticket.token;
		return TS.useTicket(tid);
	}).then(()=>{
		res.json(getCode(223,{
			tid,token
		}));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	format:{
		cardid:Number,
		schoolType:String,
		content:[Number,String,Number,Number],
		aid:Number
	}
})

api.def('getConfig',(req,res)=>{
	let {key,asBin}=req.query;
	if(!asBin){
		res.json(getCode(224,{
			value:DataService.sysConfig[key]
		}))
	}else{
		res.sendFile(resolve(__dirname,DataService.sysConfig[key]));
	}
},{
	// needAccess:-2,
	format:{
		key:String,
		'asBin?':Number
	}
})

api.def('setConfig',(req,res)=>{
	let {key,value}=req.query;
	DataService.sysConfig[key]=value;
	res.json(getCode(225));
},{
	needAccess:1,
	format:{
		key:String
	}
})

api.def('getLogo',(req,res)=>{
	res.sendFile(resolve(__dirname,DataService.sysConfig['logoPath']));
})

api.def('uploadLogo',(req,res)=>{
	let {logo}=req.files;
	let {imgType,imgData}=logo[0];
	console.log(imgType,imgData,logo);
	let path=`../resourceImg/static/logo.${imgType}`;
	DataService.sysConfig['logoPath']=path;

	let ds=new DataService();
	ds.writeFile(resolve(__dirname,path),imgData).then(()=>{
		ds.end();
		res.json(getCode(226));
	}).catch(err=>handleErr(err,res));
},{
	needAccess:1,
	method:'post',
	files:['logo']
})

module.exports={api,endService};

// checkLoop(AS,US,TS,ActivityService.utils);

// console.log(api.summary());
