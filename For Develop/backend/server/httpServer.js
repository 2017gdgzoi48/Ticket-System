const express=require('express');
const bodyParser=require('body-parser');
const multer=require('multer')(); 
const session=require('express-session');
const cors=require('cors-express');
const {createClient} = require('redis');
const RedisStore = require('connect-redis')(session);
// const helmet=require('helmet');

const {api:httpAPI,endService}=require('./httpServerApi.js');
const {httpPort}=require('../inc/setting.js');
const {resolve}=require('path');

const server=express();

const redisClient = createClient({legacyMode:true});
redisClient.connect();
server.use(session({
	secret:'pyandhrx',
	resave:true,
	saveUninitialized: true,
	cookie:{
		maxAge:18000000,
		expires:18000000
	},
	rolling:true,
	store: new RedisStore({client: redisClient})
}))

// server.use(helmet());
server.use((req,res,next)=>{
 	res.setHeader('Access-Control-Allow-Origin','http://localhost:3000');
 	res.set('Access-Control-Allow-Credentials', true);
 	next();
});
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended:true}));
server.use('/assets',express.static('../dist/assets'));
let offset=Number(process.env.NODE_APP_INSTANCE ?? 0);
server.listen(httpPort+offset+1);


httpAPI.register(server,multer);;
server.get('/server-id',(req,res)=>{
	res.end(''+offset);
})

const pages={
	'login':'userLogin',
	'userIndex.html':'userIndex',
	'buyTicket.html':'buyTicket',
	'buyTicket2.html':'buyTicket2',
	'adminLogin.html':'adminLogin'
}
for(let key in pages){
	server.get('/'+key,(req,res)=>{
		res.sendFile(resolve(__dirname,`../dist/page/${pages[key]}.html`));
	})
}

server.get('/adminPage.html',(req,res)=>{
	if(!req.session?.userInfo||req.session?.userInfo?.level!==1){
		res.send('502 forbiden');
		return;
	}
	res.sendFile(resolve(__dirname,'../dist/page/adminPage.html'));
})


server.on('error',()=>{
  
});

process.on('exit',()=>{
	endService();
});

// console.log(resolve('D:\\购票系统\\代码\\server','..\\resourceImg\\','posterImg\\poster-951a5.jpg'));