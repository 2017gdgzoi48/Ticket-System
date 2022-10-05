var codeArr=[]
function definedCode(code,msg){
	codeArr.push({code,msg});
}

function getCode(code,data){
	var code=codeArr.find(ele=>ele.code==code);
	return Object.assign({},code,{data});
}

module.exports=getCode;

definedCode(200,'login success');
definedCode(201,'get userInfo success');
definedCode(202,'delete user success');
definedCode(203,'get userList success');
definedCode(204,'get ticketList success');
definedCode(205,'get activityList success');
definedCode(206,'change admin password success');
definedCode(207,'create activity success');
definedCode(208,'upload poster success');
definedCode(209,'remove poster success');
definedCode(210,'delete activity success');
definedCode(211,'update userInfo success');
definedCode(212,'update activity success');
definedCode(213,'update area success');
definedCode(214,'set area success');
definedCode(215,'get belonging tickets success');
definedCode(216,'buy ticket success');
definedCode(217,'validate ticket token success');
definedCode(218,'clear old ticket success');
definedCode(219,'use ticket success');
definedCode(220,'remove ticket success');
definedCode(221,'add payer info success');
definedCode(222,'get activity info success');
definedCode(223,'round 2 buy ticket success');
definedCode(224,'get config success');
definedCode(225,'set config success');
definedCode(226,'upload logo success');

definedCode(300,'login fail');
definedCode(301,'need update user info');
definedCode(302,'permission denied');
definedCode(303,'need login');
definedCode(304,'admin password incorrect');
definedCode(305,'poster not exsit');
definedCode(306,'ticket content format error');
definedCode(307,'fake ticket token!!!!!');
definedCode(308,'ticket amount reach limit');
definedCode(309,'activity not open');
definedCode(310,'activity closed');
definedCode(311,'user not exsit');
definedCode(312,'activity not exsit');
definedCode(313,'too much condition');
definedCode(314,'you can only delete your ticket');
definedCode(315,'ticket not exsit');

definedCode(400,'server error');
definedCode(401,'unknown error');
definedCode(402,'param error');

// codeArr.forEach(code=>{
// 	console.log('|'+code.code+'|'+code.msg+'|');
// })