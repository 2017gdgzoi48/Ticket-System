const DataService=require('./dataService.js');
const {adminID}=require('../inc/setting.js');

const ticketCol=['tid','content','payer','aid','time','token','used'];
const selectSQL=`SELECT ticket.*,activity.activity_name,area.price,area.area_name FROM ticket,area,activity where $$ AND area.areaid=ticket.areaid AND activity.aid=ticket.aid;`;

function createToken(){
	let dict='abcdfghijklmnopqrstuvwxyz0123456789'.split('');
	return [0,0,0,0].map(ele=>{
		dict.sort(()=>Math.random()-0.5);
		return dict[0];
	}).join('');
}

function handleTicketArr(arr){
	// console.log(arr);
	if(!arr.map)return null;
	return arr.map(ticket=>handleTicketItem(ticket));
}
function handleTicketItem(obj){
	if(!!obj==false)return null;
	if(!obj.token&&!obj.content)return null;
	let ticket={...obj};
	ticket.payer={
		cardid:ticket.payer.slice(0,8),
		schoolType:ticket.payer[8],
		uid:ticket.payerId
	}
	delete ticket.payerId;
	ticket.tid=Number(obj.tid);
	ticket.used=(obj.used!==null);
	if(!obj.token){
		ticket.inited=false;
		ticket.token='****';
		ticket.tempContent=JSON.parse(obj.content);
		obj.content=`[${ticket.areaid},"${ticket.areaName}","?","?"]`;
	}else{
		ticket.inited=true;
	}
	let contentJSON=JSON.parse(obj.content);
	// console.log(contentJSON);
	ticket.content={
		areaid:contentJSON[0],
		areaName:contentJSON[1],
		row:contentJSON[2],
		col:contentJSON[3],
		fullText:`${contentJSON[1]}区 第${contentJSON[2]}排 第${contentJSON[3]}列`
	}
	return ticket;
}

function TicketService(){
	this.ds=new DataService();
	this.ticketTable=this.ds.fromDB('ticket');
	return this;
}

TicketService.prototype.addTicket=async function(content,payer,aid,mode=1){
	let ticketTable=this.ticketTable;
	let token=createToken(),areaid=content[0];
	content=JSON.stringify(content);
	if(mode==2){
		// content=null;
		token=null;
	}
	// var result=await ticketTable.insert(ticketCol.slice(1),[JSON.stringify(content),payer,aid,new Date(),token,null]);
	let result=await ticketTable.insert({
		content,
		payerId:payer.uid,
		payer:payer.cardid+payer.schoolType,
		aid,
		time:new Date(),
		areaid,
		token,
		used:null
	});
	return {tid:result.insertId,token};
}

TicketService.prototype.removeTicket=async function(tid){
	let ticketTable=this.ticketTable;
	await ticketTable.delete({tid});
	return true;
}

TicketService.prototype.getTicketDetail=async function(tid){
	let sql=selectSQL.replace('$$',`ticket.tid=${tid}`);
	let result=await this.ds.runSQL(sql);
	return handleTicketItem(result[0]);
}

TicketService.prototype.validateTicket=async function(token){
	let sql=selectSQL.replace('$$',`ticket.token="${token}"`);
	let result=await this.ds.runSQL(sql);
	return handleTicketItem(result[0]);
}

TicketService.prototype.clearOldTicket=async function(aid){
	let ticketTable=this.ticketTable;
	let condition={used:['is',null],aid};
	let result=await ticketTable.select(null,condition);
	await ticketTable.delete(condition);
	return handleTicketArr(result);
}

TicketService.prototype.useTicket=async function(tid){
	let ticketTable=this.ticketTable;
	await ticketTable.update({used:''},{tid});
	return true;
}

TicketService.prototype.changePayerInfo=async function(tid,payer){
	var ticketTable=this.ticketTable;
	await ticketTable.update({
		payerId:payer.uid,
		payer:payer.cardid+payer.schoolType
	},{tid});
	return true;
}

TicketService.prototype.getAllTicket=async function(aid=null,condition=null,opt={}){
	let ticketTable=this.ticketTable;
	let sql=selectSQL;
	if(aid!==null)sql=sql.replace('$$',`ticket.aid=${aid} AND $$$$`);
	if(condition==null)sql=sql.replace('$$',` (1=1) `);
	else sql=sql.replace('$$',` (${DataService.utils.toCondition(condition).slice(5)}) `);//把条件开头的'where'去掉
	// console.log(sql)
	let result=await this.ds.runSQL(sql);
	return handleTicketArr(result);
}

TicketService.prototype.deleteActivityTicket=async function(aid){
	var ticketTable=this.ticketTable;
	await ticketTable.delete({aid});
	return true;
}

TicketService.prototype.getBelonging=async function(payer){
	// console.time();
	let sql=selectSQL;
	sql=sql.replace('$$',`ticket.payer="${payer.cardid+payer.schoolType}"`);
	let result=await this.ds.runSQL(sql);
	// console.timeEnd();
	return handleTicketArr(result);
}

TicketService.prototype.end=function(){
	this.ds.end();
	return null;
}

TicketService.utils={createToken};

module.exports=TicketService;


// var ts=new TicketService();
// let payer={cardid:20180936,schoolType:'A',uid:3};
// ts.getAllTicket(6).then(res=>{
// 	console.log(res);
// 	ts.end();
// });