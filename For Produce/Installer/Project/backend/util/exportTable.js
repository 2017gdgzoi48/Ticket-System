const {Workbook}=require('exceljs');
const {baseURL}=require('../inc/setting.js');

function exportUserTable(list){
	let workbook=new Workbook();
	const sheet=workbook.addWorksheet('Users');
	sheet.columns=[
		{header:'uid',key:'uid'},
		{header:'openid',key:'openid',width:30},
		{header:'姓名',key:'realName',width:11},
		{header:'所属',key:'schoolText'},
		{header:'卡号',key:'cardid',width:12},
		{header:'图像',key:'img'}
	];
	list.forEach(user=>{
		let {uid,openid,realName,schoolText,cardid}=user;
		sheet.addRow({uid,openid,realName,schoolText,cardid,
			img:{
				hyperlink:`http://${baseURL}/api/getUserPhoto?uid=${uid}`,
				text:'查看图像'
			}
		}).commit();
	})
	return workbook.xlsx.writeBuffer();
}

function exportTicketTable(list){
	let workbook=new Workbook();
	const sheet=workbook.addWorksheet('Ticket');
	sheet.columns=[
		{header:'id',key:'tid'},
		{header:'支付者',key:'payer',width:14},
		{header:'支付者ID',key:'payerId'},
		{header:'活动ID',key:'aid'},
		{header:'支付时间',key:'time',width:14},
		{header:'token',key:'token'},
		{header:'使用情况',key:'used'},
		{header:'区域名字',key:'areaName'},
		{header:'行',key:'row'},
		{header:'列',key:'col'},
		{header:'价格',key:'price'}
	];
	list.forEach(ticket=>{
		let {tid,content,payer,aid,time,token,used,price}=ticket;
		let {row,col,areaName}=content;
		let {uid:payerId}=payer;
		payer=payer.cardid+payer.schoolType;
		used=(used?'已使用':'未使用');
		sheet.addRow({
			tid,content,payer,payerId,aid,time,token,used,price,
			row,col,areaName
		}).commit();
	})
	return workbook.xlsx.writeBuffer();
}

module.exports={
	exportUserTable,
	exportTicketTable
}