const DataService=require('./dataService.js');
const {MD5:md5,enc:cryptoEnc}=require('crypto-js');
const {adminID}=require('../inc/setting.js');

function handleUserArr(arr){
	if(!(arr instanceof Array))return null;
	return arr.map(user=>handleUserItem(user));
}
function handleUserItem(obj){
	if(!!obj==false)return;
	let schoolLevel={
		'A':'初中部',
		'B':'高中部',
		'':'未指定',
		'X':'管理员'
	}
	let schoolText=schoolLevel[obj.schoolType];
	let level=(obj.cardid==''?-1:(obj.schoolType=='X'?1:0));
	return {
		...obj,
		schoolText,
		enchanceYear:Number(obj.cardid.slice(0,4)),
		level
	}
}

function UserService(){
	this.ds=new DataService();
	this.userTable=this.ds.fromDB('user');
	return this;
}

UserService.prototype.userLogin=async function(openid){
	let userTable=this.userTable;
	// if(openid.search(/[^\w]/g)!=-1)return null;
	let result=await userTable.select(null,{openid});
	if(!result[0]){
		let newUser=await this.createUser(openid);
		return newUser;
	}
	return handleUserItem(result[0]);
}

UserService.prototype.createUser=async function(openid){
	let userTable=this.userTable;
	let {insertId}=await userTable.insert({openid});
	let result=await userTable.select(null,{uid:insertId});
	return handleUserItem(result[0]);
}

UserService.prototype.getUserDetail=async function(uid){
	let userTable=this.userTable;
	let result=await userTable.select(null,{uid});
	return handleUserItem(result[0]);
}

UserService.prototype.updateUser=async function(uid,userData){
	let userTable=this.userTable;
	let result=await userTable.update(userData,{uid});
	return this.getUserDetail(uid);
}

UserService.prototype.deleteUser=async function(uid){
	let userTable=this.userTable;
	let result=await userTable.delete({uid});
	return true;
}

UserService.prototype.getAllUser=async function(condition=null,option){
	let userTable=this.userTable;
	let result=await userTable.select(null,condition,option);
	return handleUserArr(result);
}

UserService.prototype.adminLogin=async function(password){
	password=md5(password).toString(cryptoEnc.Hex);
	let passwordFile=await this.ds.readFile('../inc/password.txt');
	if(passwordFile==password){
		return await this.userLogin(adminID);
	}
	else return null;
}

UserService.prototype.changeAdminPassword=async function(password){
	password=md5(password).toString(cryptoEnc.Hex);
	password=md5(password).toString(cryptoEnc.Hex);
	await this.ds.writeFile('../inc/password.txt',password);
	return true;
}



UserService.prototype.end=function(){
	this.ds.end();
	return null;
}

module.exports=UserService;

// var as=new UserService();
// as.getUserDetail(2).then(res=>{
// 	console.log(res);
// 	as.end();
// });
