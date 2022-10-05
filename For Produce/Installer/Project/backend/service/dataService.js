const {createConnection:MySQLConect,createPool:MySQLConnectPool,escape}=require('mysql');
const {createClient:RedisCilent}=require('redis');
const {mysqlHost:host,mysqlUser:user,mysqlPassword:password}=require('../inc/setting.js'); 
const {toCondition,toOption,toCol,toVal}=require('../util/dbtrans.js');
const {readFile,writeFile,deleteFile}=require('../util/fsUtil.js');
const {underlineToCamel,camelToUnderline}=require('../util/commonUtil.js');
const fs=require('fs');

function DataService(init=false){
	let config={host,user,password};
	if(init){
		config.flags='MULTI_STATEMENTS';
		let connection=MySQLConect(config);
		connection.connect();
		this.connection=connection;
		return this;
	}
	config.database='ticketsys3';
	config.connectionLimit=10;
	let pool=MySQLConnectPool(config);
	this.connection=pool;
	return this;
}

DataService.prototype.runSQL=function(query){
	let connection=this.connection;
	// console.log(query);
	return new Promise((res,rej)=>{
		connection.query(query,function(err,result){
			if(err)rej(err);
			if(result instanceof Array)res(underlineToCamel(result));
			else res(result);
		})
	})
}

DataService.prototype.fromRedis=function(){
	// console.log(RedisCilent);
	return RedisCilent();
}

DataService.prototype.fromDB=function(table){
	let obj={};
	let connection=this.connection,makeQuery=this.runSQL.bind(this);
	obj.select=function(cols=null,where=null,opt={}){
		let query=`select ${toCol(cols,opt)} from \`${table}\` ${toCondition(where)} ${toOption(opt)} ;`;
		// console.log(query);
		return makeQuery(query);
	}
	obj.update=function(vals,where){
		let query=`update \`${table}\`  set ${toVal(vals)} ${toCondition(where)} ;`;
		return makeQuery(query);
	}
	obj.insert=function(cols=null,vals){// cols: str[]|{[index: string]:any}
		if(!(cols instanceof Array)){
			[cols,vals]=[Object.keys(cols),Object.values(cols)];
		}
		let query=`insert into \`${table}\` `;
		if(cols!==null)query+=`(${toCol(cols)})`;
		query+='values ('+vals.map(val=>escape(val)).join(',')+') ;';
		return makeQuery(query);
	}
	obj.delete=function(where){
		let query=`delete from \`${table}\` ${toCondition(where)} ;`
		return makeQuery(query);
	}
	return obj;
}

DataService.prototype.fromFile=function(path){
	let obj={};
	obj.read=function(encoding=null){
		return readFile(path,encoding);
	}
	obj.write=function(content){
		return writeFile(path,content);
	}
	obj.delete=function(){
		return deleteFile(path);
	}
	return obj;
}

DataService.prototype.readFile=function(path,encoding=null){
	return readFile(path,encoding);
}

DataService.prototype.writeFile=function(path,content){
	return writeFile(path,content);
}

DataService.prototype.deleteFile=function(path){
	return deleteFile(path);
}

DataService.prototype.end=function(){
	this.connection.end();
}

DataService.utils={toCondition,toOption,toCol,toVal};

DataService.sysConfig=new Proxy({},{
	get:function(target,prop){
		let str=fs.readFileSync('../inc/sysConfig.json');
		let config=JSON.parse(str);
		return config[prop];
	},
	set:function(target,prop,val){
		let str=fs.readFileSync('../inc/sysConfig.json');
		let config=JSON.parse(str);
		config[prop]=val;
		fs.writeFileSync('../inc/sysConfig.json',JSON.stringify(config));
	}
})

module.exports=DataService

/*

SELECT ticket.*,area.price AS price FROM ticket,area where ticket.tid=2 AND area.areaid=ticket.areaid;
SELECT ticket.used,area.price,area.area_name FROM ticket,area where ticket.payer='20211234S' AND area.areaid=ticket.areaid;


*/

// let ds=new DataService();
// ds.fromDB('user').insert({cardid:20211234}).then(ele=>{
// 	console.log(ele);
// });

// console.log(config.wxTipText);
// config.a=2;