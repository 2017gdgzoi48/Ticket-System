const readline=require('readline');
// const {runSync}=require('node-cmd');
const DataService=require('./service/dataService.js');
const {adminID,tcpPort,httpPort,wsPort}=require('./inc/setting.js');
const {execSync:runSync}=require('child_process');

// var red,blue,green;
import('chalk').then(chalk=>{
	var c=new chalk.Chalk();
	red=c.redBright;
	blue=c.blueBright;
	green=c.greenBright;
	cyan=c.cyanBright;
	grey=c.grey;
	console.log('二中信科命令行工具 v1.0')
	console.log('输入'+blue('help')+'以获取帮助。');
	console.log('');
	console.log(red(`/**
 *                    _ooOoo_
 *                   o8888888o
 *                   88" . "88
 *                   (| -_- |)
 *                    O\  =  /O
 *                ____/\`---'\____
 *              .   ' \\| |// \`.
 *               / \\||| : |||// \\
 *             / _||||| -:- |||||- \\
 *               | | \\\ - /// | |
 *             | \_| ''\---/'' | |
 *              \ .-\__ \`-\` ___/-. /
 *           ___\`. .' /--.--\ \`. . __
 *        ."" '< \`.___\_<|>_/___.' >'"".
 *       | | : \`- \`.;\`\ _ /\`;.\`/ - \` : | |
 *         \ \ \`-. \_ __\ /__ _/ .-\` / /
 * ======\`-.____\`-.___\_____/___.-\`____.-'======
 *                    \`=---='
 *
 * .............................................
 *          佛祖保佑             永无BUG
 */


 `));
	cli.prompt('>');
});


function handle(cmd,next){
	if(cmd.trim()==''){
		next();
		return;
	}
	switch(cmd){
		case 'init':
			init(next);
			break;
		case 'start':
			start(next);
			break;
		case 'ls':
			ls(next);
			break;
		case 'stop':
			stop(next);
			break;
		case 'monit':
			monit(next);
			break;
		case 'help':
			help(next);
			break;
		case 'initWX':
			initWx(next);
			break;
		case 'config':
			runSync('start notepad "./inc/setting.js" >nul');
			console.log();
			next();
			break;
		case 'hello':
			console.log('World\n');
			next();
			break;
		case 'importPhoto':
			importPhoto(next);
			break;
		case 'cmd':
			startCMD(next);
			break;
		default:
			console.log('未知命令，笑死！不会用就别用！\n');
			next();
			break;
	}
}

async function init(next){
	var ds=new DataService(1);
	var res=(await ds.runSQL('SHOW DATABASES')).some(db=>db.Database=='ticketsys');
	if(res){
		console.log('你搁着玩呢？已经初始化过了欸。');
		cli.question('确定覆写吗？'+red('将会完全删除原来的数据。')+'(y/n)',async (ans)=>{
			if(ans=='y'){
				await ds.runSQL('DROP DATABASE `ticketsys`');
				runSync('rmdir resourceImg\\areaSVG /s /q >nul');
				runSync('rmdir resourceImg\\posterImg /s /q >nul');
				runSync('rmdir resourceImg\\background /s /q >nul');
				init(next);
			}else{
				console.log('服了你了！别乱玩啊！');
				next();
			}
		});
		return;
	}
	var sql=(await ds.fromFile('./inc/initSQL.txt').read()).toString();
	console.log('数据库初始化中……');
	await ds.runSQL(sql);
	await ds.runSQL("INSERT INTO `user` (`openid`, `cardid`, `real_name`, `school_type`) VALUES ('"+adminID+"', '00000000', '管理员', 'X');");
	console.log('数据库初始化完毕，初始化密码……');
	await ds.fromFile('./inc/password.txt').write('8f925706feedef8cd5aaf81943e8b7c9');
	console.log('初始化密码完毕，初始化文件树……');
	runSync('mkdir resourceImg\\posterImg >nul');
	runSync('mkdir resourceImg\\background >nul');
	console.log('初始化文件树完毕。');
	console.log('初始化结束了！请'+red('记住')+'下面的信息，不要到时候回来问我！');
	console.log('-------------------------');
	console.log('管理员openid: '+green(adminID));
	console.log('初始密码: '+green('gzezistd2018'));
	console.log();
	next();
}

function start(next){
	console.log("启动中……");
	runSync('cd server && start cmd /c "npx pm2 start httpServer.js -i 5 >nul"');
	console.log('HTTP服务器已启动。  端口：'+blue(httpPort));
	runSync('cd server && start cmd /c "npx pm2 start websocketServer.js -i 5 >nul"');
	console.log('WebSocket服务器已启动。  端口：'+blue(wsPort));
	runSync('cd server && start cmd /c "npx pm2 start wxServer.js >nul"');
	console.log('微信服务器已启动。  端口：'+blue(80));
	runSync('cd util\\arrange && start cmd /c "npx pm2 start checkLoop.js >nul"');
	console.log('内部循环已启动。');
	console.log(green('全部启动成功。'));
	console.log();
	next();
}

function ls(next){
	var str=runSync('npx pm2 ls').toString();
	str=str.replace(/online/g,green('online'));
	str=str.replace(/error/g,red('error'));
	str=str.replace(/cluster/g,match=>blue(match));
	str=str.replace(/id|namespace|name|version|mode|pid|uptime|↺|status|cpu|mem|user|watching/g,match=>cyan(match))
	str=str.replace(/disabled/g,match=>grey(match));
	str=str.slice(str.indexOf('┌'));
	console.log(str);
	console.log();
	next();
}

function monit(next){
	runSync('start cmd /c "npx pm2 monit"');
	console.log('');
	next();
}

function stop(next){
	console.log('正在停止……');
	runSync('npx pm2 stop all >nul');
	console.log(green('停止成功。'));
	console.log();
	next();
}

function initWx(next){
	console.log('微信接入服务器已经启动。')
	runSync('node "./server/initWxServer.js"');
	console.log(green('成功接入微信。'));
	console.log();
	next();
}

function importPhoto(next){
	console.log('正在导入学生照片……')
	var count=runSync('cd util && node importPhoto.js').data;
	if(!count)console.log(red(`未发现学生照片文件夹。`));
	else console.log(green(`成功导入，共${count.trim()}张。`));
	console.log();
	next();
}

function startCMD(next){
	runSync("start cmd "+__dirname);
	console.log();
	next();
}

function help(next){
	console.log(`- ${blue('init')} 初始化项目。
- ${blue('config')} 修改配置，修改后请${red('重启')}该命令行。
- ${blue('initWX')} 接入微信API。
- ${blue('start')} 开始运行项目，开始后可以关闭此窗口。
- ${blue('ls')} 监视项目情况。
- ${blue('monit')} 更为高级地监视。
- ${blue('stop')} 停止项目运行。
- ${blue('importPhoto')} 导入学生照片。
	`);
	next();
}

var cli=readline.Interface({
	input:process.stdin,
	output:process.stdout
});
cli.on('line',line=>{
	handle(line,function(){
		cli.prompt('>');
	});
})