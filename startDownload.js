var Nightmare = require('nightmare');       
var vo = require('vo');
var fs = require('fs');
var ProgressBar = require('progress');
var request = require('request');

//Generate banner text
var AsciiBanner = require('ascii-banner');  
AsciiBanner
.write('DM Comic Downloader')
.color('green')
.font('Thin')
.after('>v{{version}}', 'yellow')
.before('>[{{name}}<')
.out();

setTimeout(function(){
  vo(run)(function(err, result) {
    if (err) throw err
  })
}, 1000);



function *run() {
  var allUrls = [];
  process.argv.forEach(function (val, index, array) {
    if(index > 3){
      allUrls.push(val);
    }
  });

  var startIndex = process.argv[2];
  var dest = process.argv[3];

  for(var i=0; i<allUrls.length; i++){
    console.log('Downloading content of  -> ' + allUrls[i]);
    var nightmare = Nightmare({ show: false });
    var pageUrls = yield nightmare
    .goto(allUrls[i])
    .wait('#cp_image')
    .evaluate(function () {
      //var imgUrl = document.querySelector('#cp_image').getAttribute("src");
      var pageUrls = [];
      
      [].forEach.call(
        document.querySelectorAll('div.pageBar.bar.up.iList > a'), 
        function(el){
          pageUrls.push(el.getAttribute('href'));
        }
      );

      return pageUrls;
    });

    yield nightmare.end();

    //console.log(pageUrls);
    var dirName = dest+"/"+(startIndex++)+"";
    try {
      fs.mkdirSync(dirName);
    } catch(e) {
      
    }
    var imgUrls = yield getDetail(pageUrls, allUrls[i], dirName, getLocation(allUrls[i]));
    //console.log(imgUrls);
    yield nightmare.end();
    //yield goDownload(imgUrls, allUrls[i], dirName);
  }
  
}

function *getDetail(arr, mainUrl, dirName, rootUrl){
  var imgUrls = [];
  var bar = new ProgressBar('downloading content [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: arr.length
  });

  console.log('Total page to be downloaded: ' + arr.length);
    for(i=0; i<arr.length; i++){
    //for(i=0; i<1; i++){
      var targetUrl = rootUrl+arr[i];
      //console.log("resolving url of " + targetUrl + " ...");
      var nightmare = Nightmare({ show: false });
      var imgUrl = yield nightmare
      .goto(targetUrl)
      .wait('#cp_image')
      .wait(100)
      .evaluate(function () {
          return document.querySelector('#cp_image').getAttribute("src");
      })
      .catch(function (error) {
        console.error('Search failed:', error);
      });

    if(imgUrl != null){
      //imgUrls.push(imgUrl);  
      download(mainUrl, imgUrl, dirName+"/"+i+'.'+getFileExt(imgUrl), function(){
        //console.log('done');
      });
    }
    
    yield nightmare.end();
    bar.tick();
  }

  console.log('download completed\n');

  return imgUrls;
}

function *goDownload(arr, mainUrl, dirName){
  for(var i=0; i<arr.length; i++){
    //console.log('Downloading img: ' + arr[i]);
    download(mainUrl, arr[i], dirName+"/"+i+'.'+getFileExt(arr[i]), function(){
      //console.log('done');
    });
  }
}

function getLocation(href) {
    urlParts = /^(?:\w+\:\/\/)?([^\/]+)(.*)$/.exec(href);
    return 'http://'+urlParts[1]; 
};

function getFileExt(filename){
  var tmp = filename.substring(0,filename.indexOf('?'));
  return /[^.]+$/.exec(tmp);
}

function download(referrer, uri, filename, callback){
  var options = {
    url: uri,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      'Referer': referrer
    }
  };

  request(options, callback).pipe(fs.createWriteStream(filename));

}

