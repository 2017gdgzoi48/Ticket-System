const {readFileSync,writeFileSync}=require('fs');
const {execSync}=require('child_process'); 
const {join}=require('path');

const exec=str=>execSync(str).toString();

function getArgs(){
	let keyList=["http_port","ws_port","http_server_instance","ws_server_instance","mysql_password","local_ip","mysql_folder"];
	let underlineToCamel=str=>str.replace(/\_./g,(c)=>c.slice(1).toUpperCase());
	let defaults={
		httpPort:8080,
		wsPort:1234,
		httpServerInstance:5,
		wsServerInstance:5,
		mysqlPassword:Math.round(Math.random()*0x7ffffffff).toString(16).padStart(8,'0'),
		// mysqlPassword:'wilson2005',
		localIp:'127.0.0.1',
		mysqlFolder:'C:\\Program Files\\MySQL\\MySQL Server 5.7'
	}
	let obj=process.env,args={};
	keyList.forEach(key=>{
		let cKey=underlineToCamel(key);
		args[cKey]=obj[key] ?? defaults[cKey];
	});
	args.mysqlFolder=join(args.mysqlFolder,'\\bin\\');
	return args;
}

function replaceTemp(args){
	let savePath={
		'./Template/nginx.conf':'./APP/nginx/conf/nginx.conf',
		'./Template/setting.js':'./Project/backend/inc/setting.js',
		'./Template/config.js':'./Project/frontend/inc/config.js',
	}
	let obj={
		httpPort:args.httpPort,
		wsPort:args.wsPort,
		httpList:Array(args.httpServerInstance).fill(args.httpPort).map((ele,idx)=>'      server 127.0.0.1:'+(ele+idx+1)+';').join('\n'),
		wsList:Array(args.wsServerInstance).fill(args.wsPort).map((ele,idx)=>'      server 127.0.0.1:'+(ele+idx+1)+';').join('\n'),
		baseURL:args.localIp+':'+args.httpPort,
		mysqlPassword:args.mysqlPassword
	}
	for(let path in savePath){
		let str=readFileSync(path).toString();
		for(let key in obj){
			str=str.replace(new RegExp("\\$"+key+'\\$','g'),obj[key]);
		}
		writeFileSync(savePath[path],str);
	}
}

function changeMysqlPassword(args){
	process.chdir(args.mysqlFolder);
	exec('setx path "%path%;%cd%;"');
	exec('mysqld --install');
	exec('mysqld --initialize');
	let fileName=exec('cd ..\\data && where *.err').toString().trim();
	let str=readFileSync(fileName).toString();
	let tempPassword=/A temporary password is generated for root@localhost: (.+)/g.exec(str)[1].trim();
	console.log('temp password: ',tempPassword);
	console.log(exec('net start mysql'));
	writeFileSync('run-sql.txt',`SET PASSWORD = PASSWORD('${args.mysqlPassword}');
	ALTER USER 'root'@'localhost' PASSWORD EXPIRE NEVER;
	flush privileges;`)
	console.log(exec(`mysql -u root -p"${tempPassword}" --connect-expired-password < run-sql.txt`));
}

let args=getArgs();
console.log('参数：',args);
console.log('正在替换模板');
replaceTemp(args);
//console.log('正在初始化Mysql');
//changeMysqlPassword(args);
console.log('完成！');


// console.log(args);
// 5dcbd3d8f