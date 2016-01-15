var jsts = require('jsts');
var svgPathParser = require('svg-path-parser');

//not doing polyfills
function forEach(hasLength, callback){
    for (var i = 0; i < hasLength.length; i++){
        callback(hasLength[i], i);
    }
}

function isolatePaths(parsedPath){
    parsedPath = parsedPath.slice(0); //clone so that we do not mutate original
    var parsedPaths = [];
    for(var i = 1; i < parsedPath.length; i++){
        if(parsedPath[i]["code"] === "M"){
            parsedPaths.push(parsedPath.slice(0, i));
            parsedPath.splice(0, i);
            i = 0;
        }
    }
    return parsedPaths;
}

function isClosed(parsedPaths){
    return false;
}

var inputSvg = document.getElementById("input");
var inputPaths = [];
forEach(inputSvg.getElementsByTagName("path"), function(path){
    var parsedPath = svgPathParser(path.getAttribute("d"));
    inputPaths = inputPaths.concat(isolatePaths(parsedPath));
});
console.log("input paths in global context", inputPaths);

var inputPolygons = [];
forEach(inputPaths, function(path){
   if(!isClosed(path)){
       throw "Is not closed path";
   }

});