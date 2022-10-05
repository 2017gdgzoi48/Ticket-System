const {runSync}=require('node-cmd');
var okA=Boolean(runSync("if exist ../userPhotoA echo ok").data);
var okB=Boolean(runSync("if exist ../userPhotoB echo ok").data);
if(!okA&&!okB){
	return;
}

runSync(`rmdir /s /q ..\\resourceImg\\userPhoto\\`);
runSync(`mkdir ..\\resourceImg\\userPhoto\\`);

var count=0;
function run(type){
	var str=runSync(`cd ..\\userPhoto${type} && where /r . *.jpg`).data;
	str.split('\n').filter(Boolean).forEach(path=>{
		//console.log(`copy ${path} ..\\resourceImg\\userPhoto\\${path.match(/\d{8}.+\.jpg/ig)[0]}`)
		runSync(`copy ${path} ..\\resourceImg\\userPhoto\\${path.match(/\d{8}.+\.jpg/ig)[0].replace(/[^\d]+/g,'')}${type}.jpg`);
		count++;
	})
	runSync(`rmdir /s /q ..\\userPhoto${type}\\`);
}

if(okA)run('A');
if(okB)run('B');
console.log(count);