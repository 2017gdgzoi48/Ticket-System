const {escape,escapeId}=require('mysql');
const {underlineToCamel,camelToUnderline}=require('./commonUtil.js');

function toCondition(obj){
	const operationKw={'eq':'=','neq':'<>','gt':'>','geq':'>=','lt':'<','leq':'<='};
	if(obj==null)return '';
	if(obj instanceof Array){
		return 'where '+obj.map(ele=>{
			if(typeof ele=='string')return ` ${ele.replace(/^where /,'')} `;
			else return ` ( ${toCondition(ele).replace(/^where /,'')} ) `
		}).join('');
	}
	else if(typeof obj=='string')return `where ${obj}`; 
	else return 'where '+Object.entries(obj).map(ele=>{
		let [keyName,keyVal]=ele;
		keyName=camelToUnderline(keyName);
		if(typeof keyVal!=="object")keyVal=['eq',keyVal];
		let [opName,val]=keyVal;
		if(opName=='between')val=`${val[0]} and ${val[1]}`;
		else if(opName=='in')val='('+val.map(ele=>escape(ele)).join(',')+')';
		else val=escape(val);
		return `${keyName} ${operationKw[opName] || opName} ${val}`;
	}).join(' and ');
}

/*
type SQLConditionValue = [string, any] | ['between', [number, number]] | ['in', Array<number>];
interface SQLConditionObject {
	[index:string] : SQLConditionValue
}
type SQLConditionItem = SQLConditionObject | null | string ;
type SQLCondition = SQLConditionItem | Array<SQLCondition> ; //可以循环嵌套

[{foo:'bar',date:['<=',new Date()]},'or',{id:['in',[1,2,3,4,5]]}]
=> where  ( foo = 'bar' and date <= '2022-07-18 23:37:02.213' )  or  ( id in (1,2,3,4,5) )
*/

function toOption(opt={}){
	let query='';
	if(opt?.orderBy)query+='order by '+opt.orderBy.map(col=>{
		col=col.split(' ');
		if(col.length==1)col.push('ASC');
		return escapeId(col[0])+' '+col[1];
	}).join(',')+' ';
	if(opt?.groupBy)query+='group by '+opt.groupBy.map(col=>escapeId(col)).join(',')+' ';
	if(opt?.limit)query+='limit '+opt.limit+' ';
	if(opt?.offset)query+='offset '+opt.offset+' ';
	return query;
}

/*
interface SQLSelectOption {
	orderBy?: Array<string | [string, string]>,
	groupBy?: Array<string>,
	limit?: number | string,
	offset?: number;
}

{orderBy:['bar'],limit:'114514'}
=> order by `bar` limit 114514
*/

function toCol(cols){
	if(cols==null)return '*';
	return cols.map(col=>{
		if(typeof col=="string")return camelToUnderline(escapeId(col));
		else{
			let {col:colName,distinct,as}=col;
			if(distinct)colName="distinct "+colName;
			if(as)colName=`${colName} as ${as}`;
			return colName;
		}
	}).join(' , ');
}

/*
interface SQLColItemObj {
	col: string,
	distinct: bool,
	as: string
}
type SQLColItem = string | SQLColItemObj;
type SQLCol = Array<SQLColItem> | null;

['foo',{col:'bar',distinct:true},{col:'COUNT(*)',as:'cnt'}]
=> `foo` , distinct bar , COUNT(*) as cnt
*/

function toVal(vals){
	return escape(camelToUnderline(vals));
}

/*
type SQLVal = {[index: string]: any}

{
	col1:'val1',
	col2:123,
	col3:new Date()
}
=>  col1='val1',col2=123,col3='2022-01-18 13:00:31.425'
*/
module.exports={
	toCondition,
	toVal,
	toOption,
	toCol
}