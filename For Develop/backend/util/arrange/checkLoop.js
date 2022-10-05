const Grid=require('./seatmapArrange.js');
const ActivityService=require('../../service/ActivityService.js');
const TicketService=require('../../service/TicketService.js');
const UserService=require('../../service/UserService.js');
const DataService=require('../../service/dataService.js');
const AS=new ActivityService();
const TS=new TicketService();
const US=new UserService();

function adaptor(seatMap,areaid){
	// console.log()
	let row=0,col=0;
	let disabled=[],shape=[];
	let g2sObj={};
	seatMap.forEach(rowData=>{
		if(!rowData||rowData.length==1)return;
		rowData.slice(1).forEach(seat=>{
			if(seat.padding!=0){
				for(let i=0;i<Math.ceil(seat.padding/2);i++){
					disabled.push([row,col]);
					col++;
				}
			}
			if(seat.area.areaid==areaid){
				g2sObj[row+','+col]=seat.row+','+seat.col;
			}
			else{
				disabled.push([row,col]);
			}
			col++;
		})
		row++;
		shape.push(col);
		col=0;
	});
	// console.log(s2gObj,shape,disabled)
	return {
		grid:new Grid(shape,disabled),
		g2s:(row,col)=>{
			let str=row+','+col;
			if(g2sObj[str])return g2sObj[str].split(',').map(ele=>Number(ele));
			else return null
		},
		s2g:(row,col)=>{
			let str=row+','+col;
			for(let key in g2sObj){
				if(g2sObj[key]==str){
					return key.split(',').map(ele=>Number(ele));
				}
			}
			// console.log(row,col,g2sObj)
			return null;
		}
	}
}

async function doArea(seatMap,area,aid){
	let {grid,s2g,g2s}=adaptor(seatMap,area.areaid);
	// console.log(grid);
	let ticketList=await TS.ds.runSQL(`SELECT COUNT(*) AS num,payer_id FROM ticket WHERE aid=${aid} AND areaid=${area.areaid} AND token IS null GROUP BY payer_id;`);
	for(let j=0;j<ticketList.length;j++){
		let {payerId,num}=ticketList[j];
		let tidArr=(await TS.ticketTable.select(['tid'],{aid,areaid:area.areaid,payerId})).map(ele=>ele.tid);
		// console.log(tidArr);
		for(let tid of tidArr){
			await TS.ticketTable.update({content:null},{tid});
		}
		// let {uid,schoolType,cardid}=await US.getUserDetail(payerId);
		ticketList[j]={
			data:tidArr,
			num
		}
	}
	// console.log(ticketList);
	let {result}=grid.doInsert(ticketList) ?? {result:[]};
	// console.log(result);
	return result.map(ticket=>{
		return {
			content:JSON.stringify([area.areaid,area.areaName,...g2s(...ticket.pos)]),
			tidArr:ticket.data,
			aid
		}
	})
}

async function loop(){
	let activityList=await AS.ds.runSQL("SELECT * FROM `activity` WHERE NOW()>close_time AND mode=2;");
	// console.log(activityList);
	for(let i=0;i<activityList.length;i++){
		let activity=await ActivityService.utils.handleActivityItem(activityList[i],AS);
		activity.seatMap=ActivityService.utils.handleSeatMap(activity.seatMap,activity.area);
		let seatMap=activity.seatMap.map;
		// console.log(seatMap[1][1].area);
		let result=[];
		for(let area of activity.area){
			// console.log(area);
			result.push(... await doArea(seatMap,area,activity.aid,{AS,TS,US}));
		}
		
		let seatMapStr=activity.seatMap.toShortString();
		let temp=await AS.rs.getSeatMap(activity.aid);
		await AS.rs.initActivity(activity.aid,seatMapStr);

		let successArr=[];
		try{
			for(let ticket of result){
				let tid=ticket.tidArr.find(t=>!successArr.includes(t));
				await TS.ticketTable.update({content:ticket.content,token:TicketService.utils.createToken()},{tid});
				successArr.push(tid);
			}
		}catch(err){
			// for(let ticket of successArr){
			// 	await TS.removeTicket(ticket.tid);
			// 	await AS.setStatus(activity.aid,ticket.content[2],ticket.content[3],'s','returnTicket');
			// }
			await AS.rs.initActivity(activity.aid,temp);
			console.log('['+(new Date).toString()+']','auto arranging failed because of',err);
			return null;
		}
		// console.log(success);
		// await TS.clearOldTicket(activity.aid);
		// for(let ticket of successArr){
		// 	let {tid}=ticket;
		// 	await TS.ds.fromDB('ticket').update({used:null},{tid});
		// }
		await AS.updateActivityInfo(activity.aid,{mode:1});
		console.log(Date.now(),'auto arranging succeed for aid',activity.aid);
		// let Grid
	}
}

setInterval(()=>{
	loop();
},60*1000);
// console.log('a')
loop();

// module.exports=checkLoop;