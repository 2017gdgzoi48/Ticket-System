export async function TransactionAsync(data,action,rollback){
	let result=[];
	for(let i=0;i<data.length;i++){
		let cur=data[i];
		try{
			for(let j=0;j<action.length;j++){
				cur=await (action[j](cur));
			}
		}catch(err){
			result.push(null);
			try{
				for(let j=0;j<rollback.length;j++){
					cur=await (rollback[j](cur));
				}
			}catch(e){}
			continue;
		}
		result.push(cur);
	}
	return result;
}

export function TransactionSync(data,action,rollback){
	let result=[];
	for(let i=0;i<data.length;i++){
		let cur=data[i];
		try{
			for(let j=0;j<action.length;j++){
				cur=action[j](cur);
			}
		}catch(err){
			// console.log(err);
			result.push(null);
			try{
				for(let j=0;j<rollback.length;j++){
					cur=rollback[j](cur);
				}
			}catch(e){}
			continue;
		}
		result.push(cur);
	}
	return result;
}

export async function wsDoOpr(ws,opr,sid,timeoutMs=3000){
	if(!sid)sid=Math.round(Math.random()*100000000).toString(16);
	ws.emit("changeSeatMapFromClient",{
		fromId:sid,
		opr
	});
	return new Promise((res,rej)=>{
		// debugger;
		let timeout=setTimeout(()=>rej('ws'),timeoutMs);
		let handle=ws.on("changeSeatMap",oprList=>{
			// console.log(opr,oprList);
			let ok=oprList.some(cur=>cur.col==opr.col&&cur.row==opr.row&&cur.status==opr.status&&cur.toId==sid);
			console.log(ok,opr,oprList);
			if(ok){
				ws.off(handle);
				clearTimeout(timeout);
				res(opr);
			}
		});
	});
}

// let res=TransactionSync([1,'2',3],[s=>{if(typeof s=='number')return s;throw  Error('1')}],[s=>console.error('error: '+s)])
// console.log(res);