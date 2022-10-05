const ActivityService=require('../activityService.js');
const {extname}=require('path');
let as=new ActivityService();


// as.getAllActivity().then(res=>{
// 	console.dir(res);
// 	as.end();
// })

// ----create activity
// let poster=['1.png','10.png','13.png'];
// let background=['14.png'];

// async function read(pathArr){
// 	let result=[];
// 	for(let path of pathArr){
// 		let imgType=extname(path).slice(1);
// 		let imgData=await as.ds.readFile(path);
// 		result.push({imgType,imgData});
// 	}
// 	return result;
// }

// read(poster).then(po=>{
// 	return read(background).then(bg=>{
// 		return as.createActivity({
// 			openTime:new Date(),
// 			closeTime:new Date(),
// 			activityName:'Test',
// 			posterImg:po,
// 			description:'hello....',
// 			laucher:'xk',
// 			limitNum:2,
// 			seatMap:`#
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0`,
// 			background:bg[0]
// 		})
// 	})
// }).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// ---setup area
// as.setArea(5,[{price:5,areaName:'C',color:'00FF00'},{price:5,areaName:'C',color:'00FF00'}]).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// ---get activity&area detail
// as.getActivityInfo(5).then(res=>{
// 	console.dir(res);
// 	as.end();
// })

// as.getAreaInfo(5).then(res=>{
// 	console.dir(res);
// 	as.end();
// })

//---update info
// as.updateActivityInfo(5,{closeTime:new Date()}).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// as.updateAreaInfo(5,{color:'0000FF'}).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// as.setStatus(5,2,3,3).then(res=>{
// 	console.log(res);
// 	as.end();
// })

//---binary data
// let poster=['1.png','10.png','13.png'];
// let background=['14.png'];

// async function read(pathArr){
// 	let result=[];
// 	for(let path of pathArr){
// 		let imgType=extname(path).slice(1);
// 		let imgData=await as.ds.readFile(path);
// 		result.push({imgType,imgData});
// 	}
// 	return result;
// }

// read(poster).then(res=>{
// 	return as.uploadPoster(5,res);
// }).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// as.removePoster(5,['36f9f6','43f6e']).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// read(background).then(bg=>{
// 	return as.uploadBackground(5,bg[0]);
// }).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// as.getBackground(5).then(res=>{
// 	console.log(res);
// 	as.end();
// })

//---delete
// as.deleteArea(6).then(res=>{
// 	console.log(res);
// 	as.end();
// })

// as.deleteActivity(1).then(res=>{
// 	console.log(res);
// 	as.end();
// })