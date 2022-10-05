import {ref,reactive} from 'vue';

const guestureType={
    scale:1,move:2
}

const config={
    MOVE_STEP:1,
    SCALE_STEP:1,
    MOVE_SCALE_RATE:function(x){
        return 1;
        // if(x>2)return (3/x**1.5);
        // else return 4/x;
    }
}

const direction={
    LU:0, // left up
    RU:1, // right up
    RD:2, // right down
    LD:3 // left down
}

let recordL=[];
// let fuck=500;

class TouchControl{
    constructor({ele,containerSize,viewPortSize,viewSize,defaultOffset},cb=()=>{}){
        this.target=ele;
        this.containerSize=containerSize;
        this.viewPortSize=viewPortSize;
        if(!viewSize){
            let scaleW=containerSize[0]/viewPortSize[0];
            let scaleH=containerSize[1]/viewPortSize[1];
            let scaleRate=Math.max(scaleW,scaleH);
            // let scaleRate=Math.min(scaleW,scaleH);
            // console.log(scaleRate1/scaleRate)
            // let scaleRate=scaleW;
            viewSize=[containerSize[0]/scaleRate,containerSize[1]/scaleRate];
        }
        if(!defaultOffset){
            defaultOffset=[0,0];
        }
        this.state={
            running:false,
            viewPort:[defaultOffset,[defaultOffset[0]+viewSize[0],defaultOffset[1]],[viewSize[0]+defaultOffset[0],viewSize[1]+defaultOffset[1]],[defaultOffset[0],viewSize[1]+defaultOffset[1]]],
            // viewPort:[[0,0],[containerSize[0]*1,0],[containerSize[0]*1,containerSize[1]*1],[0,containerSize[1]*1]],
            // viewPort,
            scaleRate:1,
            // moveOffset:[0,0]
            moveOffset:defaultOffset
        }
        this.onchange=cb;
        this.initEle(ele);
    };
    initEle(ele){
        ele.ontouchstart=eve=>{
            this.touchOneMoreFinger(eve)
        }
        let handle=debounce(eve=>{
            if(this.state.type==guestureType.move)this.fingerMove(eve);
            else if(this.state.type==guestureType.scale){
                this.fingerScale(eve);
            } 
        });
        ele.ontouchmove=eve=>{
            handle(eve);
        }
        ele.ontouchend=eve=>{
            this.removeOneFinger(eve);
        }
        // ele.onscroll=eve=>{
        //     eve.preventDefault();
        // }
        this.refresh();
    };
    getPosFromEvent(eve,relative=true){
        let pArr=unwrapPos(eve);
        let {offsetTop,offsetLeft,offsetWidth,offsetHeight}=this.target;
        let {viewPort}=this.state;
        let [viewW,viewH]=[viewPort[1][0]-viewPort[0][0],viewPort[2][1]-viewPort[0][1]];
        let [eleW,eleH]=this.containerSize;
        let rateArr=[eleW/viewW,eleH/viewH],offsetArr=[offsetLeft,offsetTop];
        let temp=pArr.map(p=>{
            return p.map((val,idx)=>{
	            return this.state.moveOffset[idx]+(val-offsetArr[idx])/rateArr[idx];
	        })
        });
        // recordL.push([pArr[0][0],x[0][0],this.state.moveOffset[0]]);
        if(!relative)return temp;
        else return pArr
    }
    touchOneMoreFinger(eve){
        if(eve.touches.length==1){
            this.state.type=guestureType.move;
            this.state.startPos=this.getPosFromEvent(eve)[0];

            // let p1=this.getPosFromEvent(eve,false)[0];
            // debugger;
            // document.querySelector('.cursor').style.transform=`translate(${p1[0]}px,${p1[1]}px)`;
        }
        if(eve.touches.length==2){
            if(this.state.running)return;
            let [p1,p2]=this.getPosFromEvent(eve,false);
            // let [p1]=this.getPosFromEvent(eve,false),p2=[300,300];
            this.state.type=guestureType.scale;
            this.state.startPos=this.getPosFromEvent(eve);    
            // this.state.startPos=[...this.getPosFromEvent(eve),p2]; 

            let {viewPort}=this.state;
            let [viewW,viewH]=[viewPort[1][0]-viewPort[0][0],viewPort[2][1]-viewPort[0][1]];
            let [eleW,eleH]=this.containerSize;
            let rateArr=[eleW/viewW,eleH/viewH];
            this.state.rotateCenter=middle(p1,p2);
        }
    };
    fingerMove(eve){
        this.state.running=true;
        let posData=this.getPosFromEvent(eve);

        // let p1=this.getPosFromEvent(eve,false)[0];
        // document.querySelector('.cursor').style.transform=`translate(${p1[0]}px,${p1[1]}px)`;

        this.handleMove(posData[0]);
    };
    fingerScale(eve){
        this.state.running=true;
        let posData=this.getPosFromEvent(eve);
        this.handleScale(posData);
    }
    handleMove(newPos){
        // debugger;
        let {viewPort}=this.state;
        let [viewW,viewH]=[viewPort[1][0]-viewPort[0][0],viewPort[2][1]-viewPort[0][1]];
        let [eleW,eleH]=this.containerSize;
        let rateArr=[eleW/viewW,eleH/viewH];
        let [offsetX,offsetY]=[this.state.startPos[0]-newPos[0],this.state.startPos[1]-newPos[1]].map((ele,idx)=>{
            // return ele*config.MOVE_STEP*this.state.scaleRate*config.MOVE_SCALE_RATE(this.state.scaleRate);
            return ele/rateArr[idx];
        });
        let directionID=getMoveDirection(offsetX,offsetY);
        let offset=checkMove(offsetX,offsetY,this.state.viewPort,directionID,this.viewPortSize);
        this.changeStateByMove(offset);
        this.state.startPos=newPos;
        this.refresh();
    };
    handleScale(newPos){
        // alert();
    	// newPos.push([300,300]);
    	let d1=distance(...this.state.startPos),d2=distance(...newPos);
    	// debugger;
    	let scaleRate=d2/d1*this.state.scaleRate*config.SCALE_STEP;
    	scaleRate=checkScale(scaleRate);
    	this.changeStateByScale(scaleRate);
        this.state.startPos=newPos;
        this.refresh();
    };
    removeOneFinger(eve){
        if(eve.touches.length==1){
            this.touchOneMoreFinger(eve);
            return;
        }
        else{
            // let size=this.Size;
            // console.log(recordL)
            this.state.running=false;
            delete this.state.startPos;
            delete this.state.rotateCenter;
            delete this.state.type;
            return;
        }
    };

    changeStateByMove(offset){
        let [offsetX,offsetY]=offset;
        this.state.viewPort=this.state.viewPort.map(ele=>[ele[0]+offsetX,ele[1]+offsetY]);
        this.state.moveOffset=this.state.viewPort[0];
    }
    changeStateByScale(scaleRate){
        let rate=this.state.scaleRate/scaleRate;
        let [w,h]=this.viewPortSize;
        let [ox,oy]=this.state.rotateCenter;
        let temp=this.state.viewPort.map(p=>{
        	return [rate*p[0]+(1-rate)*ox,rate*p[1]+(1-rate)*oy];
        })
        let [offset,cnt]=temp.map((p,directionID)=>{
        	if(directionID==direction.LU)return [[-p[0],-p[1]],[p[0],p[1]]];
        	else if(directionID==direction.RU)return [[w-p[0],-p[1]],[w-p[0],p[1]]];
        	else if(directionID==direction.RD)return [[w-p[0],h-p[1]],[w-p[0],h-p[1]]];
        	else return [[-p[0],h-p[1]],[p[0],h-p[1]]];
        }).map(p=>{
        	// console.log(p[1]);
        	return [p[0].map((ele,idx)=>(p[1][idx]<0?ele:0)),p[1].filter(ele=>ele<0).length];
        }).sort((a,b)=>b[1]-a[1])[0];
        // console.log(cnt);
        if(cnt>0){
        	temp=temp.map(p=>{
        		return [p[0]+offset[0],p[1]+offset[1]];
        	});
        }
        this.state.scaleRate=scaleRate;
        this.state.viewPort=temp;
        this.state.moveOffset=this.state.viewPort[0];
        // this.state.rotateCenter=middle(this.state.viewPort[0],this.state.viewPort[]);
    }
    refresh(){
        // console.log(this);
        // debugger;
        let {containerSize:size,state}=this;
        let [moveX,moveY]=state.moveOffset;
        let [viewW,viewH]=[state.viewPort[1][0]-state.viewPort[0][0],state.viewPort[2][1]-state.viewPort[0][1]];
        console.log(this.state,viewW,viewH);
        let [eleW,eleH]=size;
        let [rx,ry]=[eleW/viewW,eleH/viewH];
        this.CSSStyle={
            transform:`translate(${-moveX*rx}px,${-moveY*ry}px) scale(${rx},${ry})`,
            clipPath:`path("M ${moveX} ${moveY} l ${viewW} 0 l 0 ${viewH} l ${-viewW} 0 Z")`
        }
        this.target.style.transform=this.CSSStyle.transform;
        this.target.style.clipPath=this.CSSStyle.clipPath;
        this.onchange(this);
    };
}

function debounce(fn){
    let last=new Date();
    return function(eve){
        if(new Date()-last<10){
            return;
            // console.log('aa')
        }
        last=new Date();
        setTimeout(()=>{
            fn(eve);
            // console.log('eve');
        },10);
    }
}

function unwrapPos(eve){
    // console.log(eve.touches);
    return [...eve.touches].map(ele=>[ele.clientX,ele.clientY]);
}

function distance(p1,p2){
    return Math.sqrt((p1[0]-p2[0])**2+(p1[1]-p2[1])**2);
}

function middle(p1,p2){
	return [(p1[0]+p2[0])/2,(p1[1]+p2[1])/2]
}

function getMoveDirection(offsetX,offsetY){
    if(!offsetX)offsetX=1;
    if(!offsetY)offsetY=1;
    if(offsetX>0&&offsetY<0)return direction.RU;
    else if(offsetX<0&&offsetY<0)return direction.LU;
    else if(offsetX<0&&offsetY>0)return direction.LD;
    else return direction.RD;
}

function checkMove(offsetX,offsetY,viewPort,directionID,size){
    // console.log(offsetX,offsetY,viewPort,directionID,size)
    // debugger;
    let [x,y]=viewPort[directionID];
    let [w,h]=size;
    if(directionID==direction.LU)return [Math.max(offsetX,-x),Math.max(offsetY,-y)];
    else if(directionID==direction.RU)return [Math.min(offsetX,w-x),Math.max(offsetY,-y)];
    else if(directionID==direction.LD)return [Math.max(offsetX,-x),Math.min(offsetY,h-y)];
    else return [Math.min(offsetX,w-x),Math.min(offsetY,h-y)];
}

function checkScale(scaleRate){
	return Math.min(Math.max(1,scaleRate),7);
}

export default TouchControl