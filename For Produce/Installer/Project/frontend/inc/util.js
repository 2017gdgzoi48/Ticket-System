import {wsPort,httpPort} from './config.js';

function getImageURL(image){
	return 'http://'+location.hostname+':'+httpPort+'/api/getPoster?path='+encodeURIComponent(image);
}

function getUserPhotoURL(uid=null,cardid){
	if(uid)return `http://${location.hostname}:${httpPort}/api/getUserPhoto?uid=${uid}`;
	if(cardid)return `http://${location.hostname}:${httpPort}/api/getUserPhoto?cardid=${cardid}`;
}

const schoolLevel={
	'A':'初中部',
	'B':'高中部',
	'':'未指定',
	'X':'管理员'
}

const schoolLevelByText={
	'初中部':'A',
	'高中部':'B',
	'未指定':'',
	'管理员':'X'
}

function handleSeatMap(seatMap='#\n',areaList=[]){
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
			let seatObj={row:rowCnt,realPos:[resultMap.length]};
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
				if(!seatObj.area)seatObj.area={};
				padding=0;
				seatObj.realPos.push(seatRow.length);
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
				if(typeof seat=='string')return `--${seat}--`; 
				let char=Object.entries(statusCode)[seat.status][0];
				if(seat.areaIdx>=0)return ' '.repeat(seat.padding)+char+'_'+seat.areaIdx;
				else return ' '.repeat(seat.padding)+char;
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

// str=`# center
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// --过道--
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0      s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0      s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0      s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0      s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// --楼梯--
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0
// s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0
// s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0
// s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0    s_0s_0s_0s_0s_0s_0s_0s_0s_0s_0`
// console.log(handleSeatMap(str,[]).map[22][1])

// console.log(handleSeatMap(`#
// s_1s  s_1
// --eee--
// ss
// `,[]).toString())

export {getImageURL,schoolLevel,handleSeatMap,schoolLevelByText,getUserPhotoURL};	