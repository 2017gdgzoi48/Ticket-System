const DataService=require('./dataService.js');
const RedisService=require('./redisService.js');
const TicketService=require('./ticketService.js');
const {resolve,extname}=require('path');
const {camelToUnderline,objToArr,randomFileName,underlineToCamel}=require('../util/commonUtil.js');

const activityCol=['aid','open_time','close_time','activity_name','area','poster_img','description','laucher','limit_num','background'];
// var areaCol=['areaid','seat_map','price','svg_img','area_name','color'];

const basePath=resolve(__dirname,'../resourceImg/');

async function handleActivityItem(obj,as,includesArea=true){
	if(!!obj==false)return;
	let {posterImg,areaidList}=obj;
	// console.log(obj)
	obj.posterImg=[];	
	for(let path of posterImg.split('\n').filter(Boolean)){
		obj.posterImg.push(path.replace(basePath,'').slice(1));
	}
	obj.background=obj.background.replace(basePath,'').slice(1);

	let areaList=areaidList?.split(',');
	delete obj.areaidList;
	if(includesArea){
		obj.area=[];
		for(let areaid of areaList.filter(Boolean)){
			obj.area.push(await as.getAreaInfo(Number(areaid)));
		}
		// obj.seatMap=handleSeatMap(seatMap,obj.area);
	}
	return obj;
}

function handleSeatMap(seatMap,areaList=[]){
	// console.log(seatMap);
	var [style,...map]=seatMap.split('\n');
	var resultObj={};
	var statusCode={
		's':0,  //空座位
		'd':1,  //禁用
		'c':2,  //正在被选择
		'b':3,   //已被购买
		'u':4   //被当前用户选中
	};
	let resultMap=[null];
	for(let i=0,rowCnt=0;i<map.length;i++){
		let seatRow=[null],row=map[i];
		if(!row){
			resultMap.push([null]);
			continue;
		}
		if(row.startsWith('--')){
			resultMap.push([row.slice(2,-2)]);
			continue;
		}
		rowCnt++;
		row=row.trim().match(/((s|d|c|b|u)(_\d+)?)| /g);
		for(let j=0,padding=0;j<row.length;j++){
			let seatObj={row:rowCnt};
			if(row[j]!==' '){
				seatObj.col=seatRow.length;
				seatObj.status=statusCode[row[j][0]];
				seatObj.padding=padding;
				if(row[j].includes('_')){
					seatObj.areaIdx=Number(row[j].slice(2));
					seatObj.area=areaList[seatObj.areaIdx];
				}else{
					seatObj.areaIdx=-1;
					seatObj.area=null;
				}
				padding=0;
				seatRow.push(seatObj);
			}else{
				padding+=1;
			}
		}
		resultMap.push(seatRow);
	}
	resultObj.map=resultMap;
	resultObj.style=style.slice(1).trim() || 'center';
	resultObj.toString=function(){
		return '# '+this.style+'\n'+this.map.map(row=>{
			if(row==null)return '';
			return row.map(seat=>{
				if(seat==null)return'';
				let char=Object.entries(statusCode)[seat.status][0];
				return ' '.repeat(seat.padding)+char+'_'+seat.areaIdx;
			}).join('');
		}).filter(Boolean).join('\n');
	}
	resultObj.toShortString=function(){
		return this.map.map((row,idx)=>{
			if(row==null)return (idx?'':' ');
			return row.map(seat=>{
				if(seat&&typeof seat.status=='undefined')return '';
				if(seat==null)return' ';
				let char=Object.entries(statusCode)[seat.status][0];
				return char;
			}).join('');
		}).filter(Boolean).join('\n');
	}
	resultObj.get=function(row,col){
		let seatMap=this.map.flat().filter(Boolean);
		return seatMap.find(seat=>seat.row==row&&seat.col==col);
	}
	return resultObj;
}
function handleAreaItem(obj){
	if(!!obj==false)return;
	obj.color='#'+obj.color;
	return obj;
}

function ActivityService(){
	this.ds=new DataService();
	this.rs=new RedisService();
	this.activityTable=this.ds.fromDB('activity');
	this.areaTable=this.ds.fromDB('area');
	// let handle=setInterval(()=>checkLoop(this),1000*60);
	return this;
}

ActivityService.prototype.createActivity=async function(obj){
	let activityTable=this.activityTable;
	obj.posterImg=(await this.uploadPoster(null,obj.posterImg)).join('\n');
	obj.background=(await this.uploadBackground(null,obj.background));
	obj.areaidList='';
	let result=await activityTable.insert(obj);

	let {seatMap}=obj;
	seatMap=handleSeatMap(seatMap,[]).toShortString();
	await this.rs.initActivity(result.insertId,seatMap);
	return result.insertId;// here!
}
// openTime,closeTime,activityName,posterImg,description,laucher,limitNum,seatMap,background

ActivityService.prototype.uploadPoster=async function(aid=null,posterList){
	let pathArr=[];
	// console.log(posterList);
	for(let poster of posterList){
		let {imgType,imgData}=poster;
		let imgPath=basePath+'\\posterImg\\'+randomFileName('poster',imgType);
		let posterImg=await this.ds.writeFile(imgPath,imgData);
		// console.log(pathArr);
		pathArr.push(imgPath);
	}
	if(aid==null)return pathArr;
	let activityTable=this.activityTable;
	let previous=await activityTable.select(['posterImg'],{aid});
	// console.log(previous,pathArr);
	previous=previous[0].posterImg;
	let result=await activityTable.update({posterImg:(previous+'\n'+pathArr.join('\n')).trim()},{aid});
	return pathArr;
}

ActivityService.prototype.removePoster=async function(aid,posterNameList){
	let activityTable=this.activityTable;
	let pathArr=(await activityTable.select(['posterImg'],{aid}))[0].posterImg.split('\n');
	if(typeof posterNameList=="string")posterNameList=[posterNameList];
	pathArr=pathArr.map(path=>{
		if(posterNameList.every(posterName=>!path.includes(posterName)))return path;
		this.ds.deleteFile(path).catch(err=>{});
		return '';
	}).filter(Boolean);
	await activityTable.update({posterImg:pathArr.join('\n')},{aid});
	return true;
}

ActivityService.prototype.uploadBackground=async function(aid=null,background){
	let {imgType,imgData}=background;
	if(aid==null){
		let backgroundPath=basePath+'\\background\\'+randomFileName('BG',imgType);
		await this.ds.writeFile(backgroundPath,imgData);
		return backgroundPath;
	}
	let activityTable=this.activityTable;
	let {background:backgroundPath}=(await activityTable.select(['background'],{aid}))[0];
	await this.ds.writeFile(backgroundPath,imgData);
	return backgroundPath;
}

ActivityService.prototype.setArea=async function(aid,areaList){
	let areaTable=this.areaTable;
	let activityTable=this.activityTable;
	let oldAreaList=(await activityTable.select(['areaidList'],{aid}))[0].areaidList.split(',');
	for(let areaid of oldAreaList){
		await areaTable.delete({areaid});
	}
	var areaIdArr=[],areaArr=[];
	for(let area of areaList){
		let {insertId}=await areaTable.insert(area);
		area.areaid=insertId;
		areaIdArr.push(insertId);
		areaArr.push(handleAreaItem(area));
	};
	await activityTable.update({areaidList:areaIdArr.toString()},{aid});
	return areaArr;
}

ActivityService.prototype.getAreaInfo=async function(areaid){
	let areaTable=this.areaTable;
	let result=await areaTable.select(null,{areaid});
	return await handleAreaItem(result[0]);
}

ActivityService.prototype.updateAreaInfo=async function(areaid,data){
	let areaTable=this.areaTable;
	let result=await areaTable.update(data,{areaid});
	return true;
}

ActivityService.prototype.setStatus=async function(aid,row,col,status,kind){
	let opr={
		toId:Math.random(),row,col,status,kind,aid
	}
	return new Promise((res,rej)=>{
		let timeout=setTimeout(()=>rej('operation timeout'),3000);
		this.rs.changeSeatMap({aid,idx:row},opr,(result)=>{
			let ok=result.some(ele=>{
				return ele.row==row&&ele.col==col&&ele.kind==opr.kind&&ele.status==status&&ele.aid==aid&&ele.toId==opr.toId
			});
			if(ok){
				clearTimeout(timeout);
				res();
			}
		})
	})
	// let {seatMap}=await this.getActivityInfo(aid);
	// seatMap=handleSeatMap(seatMap);
	// seatMap.map[row][col].status=status;
	// seatMap=seatMap.toString();
	// await this.activityTable.update({seatMap},{aid});
	// return true;
}

ActivityService.prototype.getActivityInfo=async function(aid){
	let activityTable=this.activityTable;
	let result=await activityTable.select(null,{aid});
	return await handleActivityItem(result[0],this);
}

ActivityService.prototype.updateActivityInfo=async function(aid,data){
	let activityTable=this.activityTable;
	let result=await activityTable.update(data,{aid});

	if(data.seatMap){
		let seatMap=handleSeatMap(data.seatMap,[]).toShortString();
		await this.rs.initActivity(aid,seatMap);
	}
	return true;
}

ActivityService.prototype.getAllActivity=async function(condition=null,opt={}){
	let activityTable=this.activityTable;
	let cols=['aid','activityName','openTime','closeTime','posterImg','limitNum','description','laucher','background','mode'];
	let result=await activityTable.select(cols,condition,opt);
	let resArr=[];
	for(let activity of result){
		resArr.push(await handleActivityItem(activity,this,false))
	}
	return resArr;
}

ActivityService.prototype.deleteArea=async function(areaid){
	let areaTable=this.areaTable;
	await areaTable.delete({areaid});
	return true;
}

ActivityService.prototype.deleteActivity=async function(aid){
	let activityTable=this.activityTable;
	let activity=(await activityTable.select(null,{aid}))[0];
	let area=activity.areaidList.split(',').filter(Boolean);
	for(let areaid of area){
		await this.deleteArea(areaid);
	}
	this.ds.deleteFile(activity.background).catch(err=>{});
	let posterImg=activity.posterImg.split('\n').filter(Boolean);
	for(let path of posterImg){
		await this.ds.deleteFile(path);
	}
	await activityTable.delete({aid});

	await this.rs.deleteActivity(aid);
	return true;
}

ActivityService.prototype.getBackground=async function(aid){
	let activityTable=this.activityTable;
	let {background}=(await activityTable.select(['background'],{aid}))[0];
	// console.log(background);
	// return [await this.ds.readFile(background),extname(background).slice(1)];
	let buf=await this.ds.readFile(background);
	return buf;
}

ActivityService.prototype.end=function(){
	this.ds.end();
	return null;
}

ActivityService.utils={
	handleAreaItem,
	handleActivityItem,
	handleSeatMap
}

module.exports=ActivityService;


/*
examples:

var as=new ActivityService();
as.getAllActivity().then(res=>{
	console.dir(res);
	as.end();
})


as.createActivity({
	openTime:new Date(),
	closeTime:new Date(),
	activityName:'Test Activity',
	description:'just an activity',
	laucher:'信科',
	limitNum:2
})

as.uploadPoster(2,[{
	imgType:'png',
	imgData:img
}]);

as.setArea(2,[{
	seatMap:'ssssss\nssss',
	price:9,
	areaImg:`sssssssssssssssssssssssssssssssssssssss`,
	areaName:'Test',
	color:'FFFFFF'
},{
	seatMap:'ssssss\nssss',
	price:19,
	areaImg:`sssssssssssssssssssssssssssssssssssssss`,
	areaName:'Test2',
	color:'FFFFFF'
}])

*/

// console.log(handleSeatMap(`#
// ssssssss
// sssssss`).toString())