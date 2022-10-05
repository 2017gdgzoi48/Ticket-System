const getCode=require('../inc/codeConfig.js');
const {extname}=require('path');

function checkAccess(req,res,level=1){
	let userLevel=req.session.userInfo?.level ?? -2;
	if(userLevel<level){
		if(level==1)res.json(getCode(302));
		else if(level==0&&userLevel==-1)res.json(getCode(301));
		else res.json(getCode(303));
		return false;
	}
	return true;
}

function checkFormat(format,obj){
	function checkItem(val,targetVal){
		if(val==null){
			return targetVal==val;
		}else if(val.name=="Date"){
			return (new Date(targetVal)).toString() !== 'Invalid Date';
		}else if(typeof targetVal!=='object'){ //基本类型
			// console.log(val,)
			if(val.name?.toString().toLowerCase()=='string'&&typeof targetVal=='number')return true;
			return typeof targetVal == val.name?.toString().toLowerCase();
		}else{
			return checkFormat(val,targetVal);
		}
	}
	if(!format)return true;
	if(format instanceof Array){
		if(format.length>1){
			return format.every((val,idx)=>{
				let targetVal=obj[idx];
				return checkItem(val,targetVal);
			})
		}else{
			return obj.every(targetVal=>{
				let val=format[0];
				return checkItem(val,targetVal);
			})
		}
	}
	if(typeof format=='function'){
		return typeof obj == format.name?.toString().toLowerCase() || obj instanceof format;
	}
	return Object.entries(format).every(ele=>{
		let [key,val]=ele;
		let optional=key.endsWith('?');
		key=key.replace('?','');
		let targetVal=obj[key];
		if(!targetVal)return optional;
		return checkItem(val,targetVal);
	})
}

function turnIntoFormat(format,obj){
	function turnItem(val,targetVal){
		// console.log(val,targetVal);
		if(val==null){
			return null;
		}else if(val.name=="Date"){
			return new Date(targetVal);
		}else if(typeof targetVal!=='object'){ //基本类型
			return targetVal;
		}else{
			return turnIntoFormat(val,targetVal);
		}
	}
	if(!format)return obj;
	if(format instanceof Array){
		return [...obj].slice(0,(format.length==1?undefined:format.length)).map((targetVal,idx)=>{
			let val=format[idx];
			return turnIntoFormat(val,targetVal);
		});
	}
	if(typeof format=='function'){
		if(obj instanceof format)return obj;
		return format(obj);
	}
	Object.entries(format).forEach(ele=>{
		let [key,val]=ele;
		let optional=key.endsWith('?');
		key=key.replace('?','');
		// console.log(key,val,obj,obj[key]);
		let targetVal=obj[key];
		if(!targetVal)return;
		// console.log(val,targetVal,turnItem(val,targetVal));
		return obj[key]=turnItem(val,targetVal);
	})
	return obj;
}

function formatToString(format){
	if(!format)return '未指定';
	if(typeof format=='function')return format.name;
	if(typeof format!=='object')return JSON.stringify(format);
	return '\n'+Object.entries(format).map(ele=>{
		let [key,val]=ele;
		if(typeof val=='function')val=val.name;
		else if(val instanceof Array){
			if(val.length==1){
				val=`数组[] ${val.map(formatToString)}`;
			}
			else{
				val=`[${val.map(formatToString).join(', ')}]`;
			}
			val=val.split('\n');
			if(val.length>1)val=[val[0],...val.slice(1,-1).map(ele=>'\t'+ele),val[val.length-1]].join('\n');
			else val=val[0];
			// console.log(val);
		}
		else if(typeof val!=='object')val=JSON.stringify(val);
		else if(val==null)val='未指定';
		else if(Object.keys(val)==0)val='{}'
		else val='\n'+formatToString(val).split('\n').map(ele=>'\t'+ele).join('\n');
		return [key,val];
	}).reduce((str,ele)=>{
		let [key,val]=ele;
		// console.log(val.split('\n').filter(Boolean));
		val=val.split('\n').filter(s=>Boolean(s.trim())).join('\n');
		if(val.includes('\n'))val='\n'+val;
		return str+`- ${key}: ${val} \n`;
	},'');
}

function handleFileObj(files,fields){
	return Object.fromEntries(fields.map(field=>{
		let fileList=files.filter(f=>f.fieldname==field);
		fileList=fileList.map(f=>{
			return {
				imgData:f.buffer,
				imgType:extname(f.originalname).slice(1)
			}
		})
		// if(fileList.length==1)fileList=fileList[0];
		return [field,fileList];
	}))
}

let handleErr=(err,res)=>{
	if(!err.message)return;
	res.json(getCode(400));
	console.log(err);
}

function defineAPI(apiName,fn,option='get'){
	if(typeof option=='string')option={method:option};
	let {needAccess,format,formatGet,formatPost,method,defaults,files}=option;
	
	method=method||'get';
	let needFormat=format||formatGet||formatPost;
	if(method=='get')formatGet=formatGet||format;
	else if(method=='post')formatPost=formatPost||format;
	if(defaults&&!(defaults instanceof Array))defaults=[defaults];
	// needAccess=needAccess ?? 0;

	let apiFn=function(req,res){

		//预处理
		for(let key in req.query){
			try{
				req.query[key]=JSON.parse(req.query[key]);
			}catch{}
		}
		for(let key in req.body){
			try{
				req.body[key]=JSON.parse(req.body[key]);
			}catch{}
		}

		//处理文件
		if(files){
			req.files=handleFileObj(req.files||[],files||[]);
		}

		//处理默认值
		if(defaults){
			defaults.forEach(defaultObj=>{
				if(defaultObj=='selectionDefaults'){
					defaultObj={condition:null,option:{}};
				}
				for(let key in defaultObj){
					req.query[key]=req.query[key] ?? defaultObj[key];
				}
			})
		}

		//格式化
		if(needFormat){
			let checkResult;
			// console.log(req.query,formatGet);
			if(method=='get'){
				checkResult=checkFormat(formatGet,req.query);
			}
			else if(method=='post'){
				checkResult=checkFormat(formatPost,req.body)&&checkFormat(formatGet,req.query);
			}
			else checkResult=true;
			if(!checkResult)return res.json(getCode(402));
			else{
				// console.log(formatGet,formatPost);
				if(method=='get')req.query=turnIntoFormat(formatGet,req.query);
				else if(method=='post')[req.body,req.query]=[turnIntoFormat(formatPost,req.body),turnIntoFormat(formatGet,req.query)]
			}
		}

		//检测访问
		if(typeof needAccess!=='undefined'){
			// console.log(needAccess);
			let accessResult=checkAccess(req,res,needAccess);
			// console.log(accessResult,needAccess);
			if(!accessResult)return;
		}

		//运行
		try{
			fn(req,res);
		}catch(err){
			console.log('fuck!!!');
			handleErr(err,res);
		}
	}
	this.apiList.push({
		apiName,apiFn,method,
		fullData:{
			method,formatGet,formatPost,needAccess,apiName,defaults,files,format
		}
	})
}

function handleSummaryItem(api){
	let str='';
	str+=`## ${api.apiName}\n`;
	str+=`- 请求方法: \`${api.method.toUpperCase()}\`\n`;
	if(api.needAccess){
		let levelName={
			'-1':'未完善信息用户',
			'0':'普通用户',
			'1':'管理员'
		}
		str+=`- 能访问的最低等级: ${levelName[api.needAccess]}\n`;
	}
	if(api.formatGet){
		str+='- GET参数:\n';
		str+=formatToString(api.formatGet).trim().split('\n').map(ele=>'\t'+ele).join('\n')+'\n';
	}
	if(api.formatPost){
		str+='- POST参数:\n';
		str+=formatToString(api.formatPost).trim().split('\n').map(ele=>'\t'+ele).join('\n')+'\n';
	}
	if(api.defaults){
		str+='- 默认Get参数:\n';
		let z=api.defaults.map(defau=>{
			if(defau=='selectionDefaults'){
				defau={condition:null,option:{}};
			}
			return formatToString(defau);
		}).join('\n');
		str+=z.split('\n').filter(Boolean).map(ele=>'\t'+ele).join('\n')+'\n';
	}
	if(api.files){
		str+=`- 文件列表: \`${api.files.join('`, `')}\`\n`;
	}
	return str;
}

function summary(){
	return this.apiList.map(api=>handleSummaryItem(api.fullData)).join('\n\n');
}

function apiRoute(){
	this.def=defineAPI;
	this.apiList=[];
	this.register=function(server,multer){
		this.apiList.forEach(api=>{
			if(api.method=='get'){
				server.get('/api/'+api.apiName,api.apiFn);
			}else if(api.method=='post'){
				server.post('/api/'+api.apiName,multer.any(),api.apiFn);
			}
		});
	}
	this.summary=summary;
	return this;
}

module.exports={
	apiRoute,
	handleErr
}

// console.log(checkFormat({'a?':Date,'b?':Date},{
// 	a: '2022-08-06T16:31:08.000Z',
// 	b: 23424
// }))
// console.log(turnIntoFormat({a:[String]},{a:['a','b','c']}));