const fs = require("fs");
const historicalData = 'SPY.csv';
const testFile = 'tests.txt';
const resultsFile = 'results.txt';
const resultsSummaryFile = 'summary.csv';
const lineBreak = '________________________________________';
let index = {};
let testResultArray = [];

//Main
fs.writeFileSync(resultsSummaryFile, '');
let resultsSummaryFileStream = fs.createWriteStream(resultsSummaryFile, {flags: 'a'});

for(let i = 0; i < 100; i++){
	testResultArray[i] = [];
}
loadHistoricalData();
startTests();

resultsSummaryFileStream.end('\n');

//load stock history data
function loadHistoricalData(){
	try{
		console.log("Loading Historical Data");

		let data = String(fs.readFileSync(historicalData));
		let lines = data.split("\n"); //downloaded from yahoo finance
		lines.shift();
		lines.forEach((line) => {
			let splitData = line.split(',');
			let tempObj = {
				open: splitData[1],
				close: splitData[4]
			};
			index[splitData[0]] = tempObj;
		});

		console.log("Historical Data Loaded Successfully");
		console.log(lineBreak);

	}catch(err){
		console.error(err);
	}
}

//load and process each test
function startTests(){
	try{
		console.log("Starting Tests");

		let data = JSON.parse(fs.readFileSync(testFile));

		let testCounter = 1;

		Object.values(data).forEach((value) => {
			let testResultArray = [];
			console.log("Running test #"+testCounter);
			runTest(value, testCounter);
			processResults(value.startDate, testCounter);
			testCounter++;
		});

		console.log("Testing Complete");
	}catch(err){
		console.error(err);
	}
}

function processResults(startDate, testCounter){
	resultsSummaryFileStream.write('Test Number: '+testCounter+', Start Date: '+startDate+'\n');
	resultsSummaryFileStream.write('Ratio %, Min, SD1, Mean, SD2, Max, Count\n');
	for(let i = 0, j = testResultArray.length; i<j; i++){
		let total = testResultArray[i].length;
		let min;
		let max;
		let count = 0;
		for (let k = 0, l = testResultArray[i].length; k<l; k++){
			count+=parseInt(testResultArray[i][k]);
			if(min === undefined || min > testResultArray[i][k]){
				min = testResultArray[i][k];
			}
			if(max === undefined || max < testResultArray[i][k]){
				max = testResultArray[i][k];
			}
		}
		let average = count/testResultArray[i].length;
		let averageRounded = average.toFixed(2);
		let standardDeviationCount = 0;
		for(let m = 0, n = testResultArray[i].length; m<n; m++){
			let item = testResultArray[i][m];
			let temp = item - average;
			standardDeviationCount+=(temp * temp);
		}
		let variance = standardDeviationCount/testResultArray[i].length;
		let standardDeviation = Math.sqrt(variance);
		let temp1 = average-standardDeviation;
		let temp2 = average+standardDeviation;
		let sd1 = Math.round(temp1 * 100) / 100;
		let sd2 = Math.round(temp2 * 100) / 100;

		resultsSummaryFileStream.write(i+','+min+','+sd1+','+averageRounded+','+sd2+','+max+','+testResultArray[i].length+'\n');
	}
	resultsSummaryFileStream.write('\n\n');
}

function runTest(input, counter){
	let balance, startDate, repeat;
	
	balance = input.balance;
	startDate = input.startDate;
	repeat = input.numberOfRuns;

	let splitDate = startDate.split("/");
	let temp = splitDate[2]+"-"+splitDate[1]+"-"+splitDate[0];
	let date1 = new Date(temp);

	let duration = Math.round((Date.now()-date1.getTime())/(1000*3600*24));

	//repeat loop
	for(let k = 0, l = repeat; k<l; k++){
		let ratio = Math.floor(Math.random() * 100);

		let outputBalance = balance;
		//nested main loop
		let i = 0;
		while(outputBalance > 0 && i < duration){
			let currentDate = getDate(startDate, i);
			if(currentDate in index){
				let random = Math.floor(Math.random() * 100);
				let riskedAmount = outputBalance*0.1;
				if(random < ratio){
					//call
					let change = index[currentDate].close-index[currentDate].open;
					let value = change*riskedAmount;
					let temp = outputBalance+value;
					outputBalance = Math.round(temp * 100) / 100;
				}else{
					//put
					let change = index[currentDate].open-index[currentDate].close;
					let value = change*riskedAmount;
					let temp = outputBalance+value;
					outputBalance = Math.round(temp * 100) / 100;
				}
			}
			i++;
			if(outputBalance <= 0){
				outputBalance = 0;
			}
		}
		testResultArray[ratio].push(Math.floor(outputBalance*100)/100);
	}
}

function getDate(startDate, number){
	let splitDate = startDate.split("/");
	let temp = splitDate[2]+"-"+splitDate[1]+"-"+splitDate[0];
	let myDate = new Date(temp);
	let newDate = addDays(myDate, number);
	
	let year = newDate.getFullYear();
	let month = newDate.getMonth()+1;
	let day = newDate.getDate();
	if(String(month).length === 1){
		month = "0"+month;
	}
	if(String(day).length === 1){
		day = "0"+day;
	}
	return year+"-"+month+"-"+day;
}

//https://stackoverflow.com/questions/563406/add-days-to-javascript-date/34017571
function addDays(date, days) {
	var result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}