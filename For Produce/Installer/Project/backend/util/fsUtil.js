const fs=require('fs');

function getDir(path){
	return new Promise((res,rej)=>{
		fs.readdir(path,{withFileTypes:true},function(err,dir){
			if(err)rej(err);
			else res(dir);
		});
	})
}
function getFileStatus(path){
	return new Promise((res,rej)=>{
		fs.stat(path,callback=function(err,sta){
			if(err){
				rej(err);
				return;
			}
			var {size,mtime:lastModified}=sta;
			lastModified=lastModified.getTime();
			res({size,lastModified});
		});
	})
}
function readFile(path,encoding=null){
	return new Promise((res,rej)=>{
		fs.readFile(path.trim(),{encoding},function(err,dir){
			if(err)rej(err);
			else res(dir);
		});
	})
}
/*
readFile(path: string, encoding: null|string = null) => Promise<string|buffer>
*/
function writeFile(path,content){
	return new Promise((res,rej)=>{
		fs.writeFile(path.trim(),content,function(err){
			if(err)rej(err);
			else res(true);
		});
	})
}
/*
writeFile(path: string, conetent: string|buffer) => Promise<undefined>
*/
function deleteFile(path){
	return new Promise((res,rej)=>{
		fs.unlink(path.trim(),function(err){
			if(err)rej(err);
			else res(true);
		});
	})
}
/*
deleteFile(path: string) => Promise<undefined>
*/
function deleteDir(path){
	return new Promise((res,rej)=>{
		fs.rmdir(path,function(err,dir){
			if(err)rej(err);
			else res(dir);
		})
	})
}
module.exports={
	readFile,getDir,getFileStatus,writeFile,deleteFile,deleteDir
}
