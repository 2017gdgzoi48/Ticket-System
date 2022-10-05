const {extname}=require('path');

function underlineToCamel(obj){
	if(typeof obj=='string'){
		return obj.replace(/_./g,match=>match[1].toUpperCase());
	}
	if(!(obj instanceof Array)){
		var entry=Object.entries(obj);
		return Object.fromEntries(entry.map(ele=>{
			return [underlineToCamel(ele[0]),ele[1]];
		}));
	}else{
		return obj.map(ele=>{
			return underlineToCamel(ele);
		});
	}
}

function camelToUnderline(obj){
	if(obj==null)return null;
	if(typeof obj=='string'){
		return obj.replace(/([a-z\d][A-Z])|([A-Z]+[A-Z])/g,match=>match.slice(0,-1)+'_'+match.slice(-1).toLowerCase());
	}
	if(!(obj instanceof Array)){
		var entry=Object.entries(obj);
		return Object.fromEntries(entry.map(ele=>{
			return [camelToUnderline(ele[0]),ele[1]];
		}));
	}else{
		return obj.map(ele=>{
			return [camelToUnderline(ele[0]),ele[1]];
		});
	}
}

function objToArr(keyList,obj,handleFunction=()=>null){
	return keyList.reduce((data,key)=>{
		if(handleFunction(key)!==null)data.push(handleFunction(key));
		else data.push(obj[key]);
		return data;
	},[]);
}

function randomFileName(prefix='',ext=''){
	return prefix+'-'+Math.round(Math.random()*0x7fffff).toString(16)+'.'+ext;
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
		if(fileList.length==1)fileList=fileList[0];
		return [field,fileList];
	}))
}

// console.log(handleFileObj([
// 	{fieldname:'a',buffer:'a',originalname:'/eee/a.png'},
// 	{fieldname:'a',buffer:'a',originalname:'/eee/a.png'},
// 	{fieldname:'b',buffer:'a',originalname:'/eee/a.jpg'}],['a','b']))

module.exports={
	underlineToCamel,
	camelToUnderline,
	objToArr,
	randomFileName,
	handleFileObj
}