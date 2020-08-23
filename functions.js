var column_map = {
	'sku': "STOCK_NO", 
	'name': "FULL_TITLE",
	'description': "MAIN_DESC",
	'image': "IMAGE_LINK",
	'price': "SRP",
	'brand': "PUBLISHER",
	'weight': "UNIT_WEIGHT",
	'length': "UNIT_LENGTH",
	'width': "UNIT_WIDTH",
	'height': "UNIT_HEIGHT"
},
		proxyUrl = 'https://cors-anywhere.herokuapp.com/',
		parser = new DOMParser(),
		fr=new FileReader(),
		prefix = "https://www.previewsworld.com",
		coverNotFound = "https://publications.iarc.fr/uploads/media/default/0001/02/thumb_1292_default_publication.jpeg",
		descNotFound = "Description Not Available",
		downloadText = "Download CSV File";


function parseRow(row){
	var obj = {}
	row.split("\t").forEach((d, i) => {
		obj[inputColumns[i]] = d;
	});
	return obj;
}

async function processLink(targetUrl){
	return await fetch(proxyUrl + targetUrl)
		.then(blob => blob.text())
		.then(data => {
		window.doc = parser.parseFromString(data, "text/html");
		try{
			imgSrcRel = $(doc).find("#MainContentImage").attr('src');
//			desc = $(doc).find(".Text")[0].childNodes[4].textContent.trim().replace(",", "-");
			desc = $(doc).find(".Text")[0];
			desc.children.forEach(e => {e.decompose()});
			desc = desc.text.trim().replace(",", "-");
			imgUrl = `${prefix}${imgSrcRel}`;
		}catch(e){
			desc = "";
			imgUrl = coverNotFound;
			console.log(e)
		}
		return [imgUrl, desc];
	})
		.catch(e => {
		console.log(e);
		return ["", ""];
	});
}

async function processRow(row){
	if (row.DIAMD_NO){
		url = `${prefix}/Catalog/${row.DIAMD_NO}`;
		[row.IMAGE_LINK, row.MAIN_DESC] = await processLink(url);
		const rowElem = Object.values(column_map).map((prop) => row[prop]);
		console.log(rowElem);
		const rowText = rowElem.map((e) => e ? e.replace(",", "") : "").join(",") + "\n";
		outTxt += rowText;
	}
}

function download(filename, text) {
	var button = document.getElementsByClassName("widget-form-button-wrapper")[0]
	var element = button.getElementsByTagName("a")[0]
	// var element = document.createElement('a');
	element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);
	// var button = document.createElement('button');
	// button.setAttribute('type', 'button');
	// textNode = document.createTextNode(downloadText);
	// button.appendChild(textNode);
	// element.appendChild(button);
	// document.getElementById("container").appendChild(element);
}

fr.onload = async function(){ 
	var lines = fr.result.split("\n");
	outTxt = Object.keys(column_map).join(",") + "\n",
		inputColumns = lines[0].split("\t");
	inputList = lines.slice(1).filter(r => r.trim()).map(parseRow);
	var n = inputList.length;
	var outputTxt = "";

	for(var i = 0; i < inputList.length; i++){
		await processRow(inputList[i], i);
		document.getElementById('output').textContent = `Done with ${i+1}/${n}`;
	}
	download(`output-${new Date().toISOString()}.csv`, outTxt);
}

document.getElementById('inputfile') 
	.addEventListener('change', function(ev) { 
	fr.readAsText(this.files[0]);
	document.getElementById('output').textContent = `Starting..... ${this.files[0].name}`;
})