function getNumSplit(num,splitNum){
	if(splitNum==1)return [[num]];
	let result=[];
	for(let i=1;i<=Math.floor(num/splitNum);i++){
		let splitWays=getNumSplit(num-i,splitNum-1);
		splitWays.forEach(way=>{
			result.push([i,...way]);
		});
	}
	return result;
}
// console.log(getNumSplit(8,2).map(e=>e.join('+')+'=8').join('\n'))

function* genNumSplit(num){
	for(let i=1;i<=num;i++){
		let result=getNumSplit(num,i);
		for(let res of result){
			yield res;
		}
	}
}

// let iter=genNumSplit(7);
// for(let way of iter){
// 	// cnt++;
// 	console.log(way.join('+')+'=7');
// }

function* genNumShape(num){
	if(num==1){
		yield [1];
		return;
	}
	for(let i=2;i<=num;i++){
		if(num%i==0){
			yield new Array(num/i).fill(i);
		}
	}
}

// let iter=genNumShape(3);
// for(let shape of iter){
// 	console.log(shape.join('+')+'=8');
// }

function crossMake(a,b,shape=false){
	let res=[];
	for(let i=0;i<a.length;i++){
		for(let j=0;j<b.length;j++){
			if(!(a[i] instanceof Array))a[i]=[a[i]];
			if(!(b[j] instanceof Array))b[j]=[b[j]];
			let temp=[...a[i],...b[j]];
			// console.log(!shape);
			if(!shape||!checkCover(temp,shape.map(ele=>ele+1)))res.push(temp);
		}
	}
	return res;
}
// console.log(crossMake(crossMake([1,2,5],[3,4]),[5,6]))
// console.log(crossMake([[[1,2]],[[2,3]]],[[[1,3]]],[1,1]))

function checkCover(pArr,shape){
	let cover=[];
	pArr.map((p,idx)=>{
		let [x,y]=p;
		for(let i=0;i<shape[idx];i++){
			cover.push([x,y+i].join(','));
		}
	})
	return [...new Set(cover)].length!==cover.length;
}
// console.log(checkCover([[1,0],[1,0],[0,0]],[1,1]))

let cnt=0;
class Area{
	constructor(shape){
		this.shape=shape;
		this.id=cnt++;
	}
}

class Grid{
	constructor(shape,disabled=[]){
		this.shape=shape;
		this.status=shape.map(row=>new Array(row).fill(-1));
		this.disabled=disabled;
		disabled.forEach(p=>{
			let [x,y]=p;
			this.status[x][y]=-2;
		})
	}

	clone(){
		return new Grid(this.shape,this.disabled);
	}

	walk(pos,shape,emptyOnly=true){
		let [x,y]=pos,res=[];
		for(let i=0;i<shape.length;i++){
			// console.log(this.status[x],x,this.shape.length)
			if(x>this.shape.length-1){
				// console.log(i);
				for(let j=0;j<shape[i];j++)res.push([null,null]);
				shape[i]=0;
			}
			for(let j=0;j<shape[i];j++){
				if(y>this.shape[x]||(this.status[x][y]!==-1&&emptyOnly))res.push([null,null]);
				else res.push([x,y]);
				y++;
			}
			y-=shape[i];
			x++;
		}
		return res;
	}

	walkFrom(pos,emptyOnly=true){
		let [x,y]=pos,res=[],shape=this.shape;
		for(let i=y;i<shape[x];i++){
			if(this.status[x][i]==-1||!emptyOnly)res.push([x,i]);
		}
		for(let i=x+1;i<shape.length;i++){
			for(let j=0;j<shape[i];j++){
				if(this.status[i][j]==-1||!emptyOnly)res.push([i,j]);
			}
		}
		return res;
	}

	getMinEmptySeat(){
		let cnt=0,min=Infinity,row=-1;
		for(let p of this.walkFrom([0,0],false)){
			let [x,y]=p;
			if(x!==row){
				row=x;
				if(cnt)min=Math.min(min,cnt);
				cnt=0;
			}
			if(this.status[x][y]==-1)cnt++;
			else{
				if(cnt)min=Math.min(min,cnt);
				cnt=0;	
			}
		}
		return min;
	}

	suitAt(pos,area){
		let {shape}=area;
		// console.log(pos,shape[0]);
		return this.walk(pos,shape).every(ele=>ele[0]!==null);
	}

	tryAt(pos,num){
		let res=[];
		for(let shape of genNumShape(num)){
			// console.log(shape);
			let area=new Area(shape);
			if(this.suitAt(pos,area))res.push({area,pos});
		}
		// // for(let shape of genNumShape(num)){
		// 	// console.log(pos,shape);
		// 	let area=new Area([num]);
		// 	if(this.suitAt(pos,area))res.push({area,pos});
		// // }
		// if(res.length)console.log('aaaa');
		return res;
	}

	tryPartlyAt(pArr,num){
		let res=[],available=new Array(num);
		for(let i=1;i<num;i++){
			let ok=[];
			for(let p of pArr){
				if(this.suitAt(p,new Area([i]))){
					ok.push(p);
				}
			}
			available[i]=ok.map(ele=>[ele]);
			// console.log(i,available[i].length)
		}
		// console.log(available[1])

		let minWidth=this.getMinEmptySeat();
		for(let shape of genNumSplit(num)){
			// console.log(shape)
			if(Math.max(...shape)<minWidth)continue;
			let areaList=shape.map(row=>new Area([row]));
			let numSet=[...new Set(shape)];
			if(numSet.some(n=>!available[n]||!available[n].length))continue;
			// console.log('shape',shape,areaList)

			let result=areaList.reduce((arr,ele,idx)=>{
				// console.log(available[ele.shape[0]]);
				if(!arr.length)return available[ele.shape[0]];
				return crossMake(arr,available[ele.shape[0]],shape.slice(0,idx+1));
			},[]);
			// result.forEach(arr=>console.log(arr));
			// console.log(result.some(arr=>arr.reduce((val,area)=>val+area,0)==num));
			result=[...new Set(result.map(row=>{
				let temp=row.map((p,idx)=>p.join(',')+`,${areaList[idx].shape[0]}`).sort();
				if(row.reduce((val,ele,idx)=>val+areaList[idx].shape[0],0)!=num)return null;
				return temp.join('|');
			}).filter(Boolean))];
			result=result.map(ele=>{
				return ele.split('|').map(part=>{
					let pos=part.split(',').map(n=>Number(n));
					// if(shape.length==6)console.log(pos,areaList)
					// console.log(shape,pos.slice(-1)[0])
					// let len=areaList[shape.indexOf(pos.slice(-1)[0])].id;
					// console.log(len);
					return {area:areaList[shape.indexOf(pos.slice(-1)[0])],pos:pos.slice(0,-1)};
				})
			});
			// let way=result.find(way=>way.reduce((val,ele)=>val+ele.area.shape[0],0)!=num);
			// if(way)console.log(shape,...way)
			if(result.length)res.push(...result)
			// if(result.length)console.log(result);
		}
		// console.log(res.every(way=>way.reduce((val,ele)=>val+ele.area.shape[0],0)==num))
		return res;
	}

	fillAt(pos,area){
		// console.log(pos,area.shape)
		let {shape,id}=area;
		for(let p of this.walk(pos,shape)){
			if(p[0]==null){
				throw Error('Unchecked Position');
			}
			this.status[p[0]][p[1]]=id;
		}
		return this.status;
	}

	appendList(numList,mode){
		numList=numList.map((ele,idx)=>{return {num:ele,idx}}).sort((a,b)=>{
			if(a.num!==b.num)return a.num-b.num;
			else return a.idx-b.idx;
		});
		// console.log(numList);
		let avgWidth=Math.floor(this.shape.reduce((val,ele)=>val+ele,0)/this.shape.length);
		if(mode==2){
			let idx=numList.findIndex(n=>n.num>avgWidth);
			numList=numList.slice(0,idx).reverse().concat(numList.slice(idx));
		}else if(mode==1){
			numList=numList.reverse()
		}
		// console.log(numList);
		numList=numList.map(({num,idx})=>{
			// console.log('------',num,'------');
			let idList=this.append(num);
			this.status=this.status.map(row=>row.map(ele=>(idList.includes(ele)?idx:ele)));
			// console.log(this.status.join('\n'));
		});
		// let res=new Array(numList.length);
		// this.status.forEach((row,rowIdx)=>{
		// 	row.forEach((seat,colIdx)=>{
		// 		if(!res[seat])res[seat]=[[rowIdx,colIdx]];
		// 		else res[seat].push([rowIdx,colIdx]);
		// 	})
		// })
		return this;
	}

	append(num){
		let ways=[];
		let pArr=this.walkFrom([0,0]);
		for(let pos of pArr){
			ways.push(...this.tryAt(pos,num));
		}
		if(ways.length>0){
			ways=ways.map(way=>{return {...way,loss:this.loss1(way.pos,way.area.shape)}});
			let way=ways.sort((a,b)=>a.loss-b.loss)[0];
			// console.log(way)
			this.fillAt(way.pos,way.area);
			return [way.area.id];
		}

		ways=this.tryPartlyAt(pArr,num);
		// console.log(ways)
		ways=ways.map(way=>{return {parts:way,loss:this.loss2(way)}});
		// if(!ways)
		let way=ways.sort((a,b)=>a.loss-b.loss)[0];
		// console.dir(way.parts[1]);
		way.parts.map(part=>this.fillAt(part.pos,part.area));
		return way.parts.map(part=>part.area.id);
	}

	loss1(pos,shape){
		// console.log(shape);
		let pArr=this.walk(pos,shape,false);
		// console.log(pos,shape);
		let uMin,dMin,lMin,rMin;
		pArr=pArr.map(p=>{
			// console.log(p);
			return [p[0],this.shape[p[0]]-p[1]-1,this.shape.length-p[0]-1,p[1]];
		});
		uMin=pArr.sort((a,b)=>a[0]-b[0])[0][0];
		dMin=pArr.sort((a,b)=>a[2]-b[2])[0][2];
		lMin=pArr.sort((a,b)=>a[3]-b[3])[0][3];
		rMin=pArr.sort((a,b)=>a[1]-b[1])[0][1];
		// console.log(pArr)
		let xMin=Math.min(lMin,rMin),yMin=Math.min(uMin,dMin);
		return (xMin+1)*(yMin+1)*shape.length;
	}

	loss2(parts){
		// console.log(parts)
		parts=parts.map(({pos,area})=>{
			// console.log(area,pos)
			let len=area.shape[0];
			// if(len>3)console.trace();
			return [pos[0],pos[1]+len/2,len,pos];
		});
		let l1=0,l2=0,l3=0;
		for(let i=0;i<parts.length;i++){
			for(let j=0;j<i;j++){
				l1+=Math.sqrt((parts[i][0]-parts[j][0])**2+(parts[i][1]-parts[j][1])**2);
			}
		}

		let minLen=Math.min(...parts.map(ele=>ele[2]));
		if(minLen<2)l2+=3;

		for(let part of parts){
			l2+=this.loss1(part[3],[part[2]])*part[2]/2;
			let [x,y]=part[3];
			if(y>0&&this.status[x][y-1]>=0)l2-=5;
			// if(part[3])console.log(part,l2);
		}		
		// console.log(loss,maxSubMin);
		return l1*2+l2+l3;
	}

	evaluate(){
		let partIdx=-1,obj={},part={len:0},loss=0;
		for(let i=0;i<this.shape.length;i++){
			// console.log();
			for(let j=0;j<this.shape[i];j++){
				let idx=this.status[i][j];
				part.len++;
				if(partIdx!==idx){
					if(!obj[partIdx])obj[partIdx]=[];
					part.len--;
					part.area=new Area([part.len]);
					if(part.len)obj[partIdx].push(part);
					part={
						pos:[i,j],
						len:1
					};
					partIdx=idx;
				}
			}
			if(!obj[partIdx])obj[partIdx]=[];
			part.area=new Area([part.len]);
			if(part.len)obj[partIdx].push(part);
			part={
				pos:[i+1,0],
				len:0
			};
			// partIdx=idx;
		}
		// console.log(obj);
		for(let idx in obj){
			// console.log(idx,obj[idx])
			if(obj[idx].length)loss+=this.loss2(obj[idx]);
		}
		return loss;
	}

	doInsert(reqArr){
		// let temp=;
		if(!reqArr.length)return;
		let [idxArr]=Object.entries(reqArr).map(ele=>Number(ele));
		let [numArr,dataArr]=[reqArr.map(({num})=>num),reqArr.map(({data})=>data)];
		let res1=this.clone().appendList(numArr,1);
		let res2=this.clone().appendList(numArr,2);

		let res,resArr=[];
		if(res1.evaluate()>res2.evaluate())res=res2;
		else res=res1;

		res.walkFrom([0,0],false).map(p=>{
			// console.log(p);
			let [x,y]=p;
			let idx=res.status[x][y];
			if(idx<0)return;
			resArr.push({
				data:dataArr[idx],
				pos:p
			});
		})
		// console.log(resArr,res.walkFrom([0,0],false))

		return {
			result:resArr,
			loss:res.evaluate(),
			graph:res.status,
			grid:res
		}
	}
}

// let grid=new Grid([3,5,6,7]);
// let arr=[7,7,7].map(val=>{
// 	let randColor=[Math.floor(Math.random()*256),Math.floor(Math.random()*256),Math.floor(Math.random()*256)];
// 	randColor='#'+randColor.map(ele=>ele.toString(16).padStart(2,'0')).join('');
// 	return {
// 		num:val,
// 		data:randColor
// 	}
// })
// // console.log(arr);
// let {graph,loss,result}=grid.doInsert(arr);
// console.log('-----end------')
// console.log(graph.join('\n'));
// console.log('loss: ',loss);
// console.log('res: ',result)

module.exports=Grid;