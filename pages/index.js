var jsts = require('jsts');
var svgPathParser = require('svg-path-parser');

//not doing polyfills
function forEach(hasLength, callback) {
    for (var i = 0; i < hasLength.length; i++) {
        callback(hasLength[i], i);
    }
}

function first(hasLength){
    return hasLength[0];
}

function last(hasLength){
    return hasLength.length > 0 ? hasLength[hasLength.length - 1] : undefined;
}

function empty(hasChildren){
    while(hasChildren.firstChild){
        hasChildren.removeChild(hasChildren.firstChild);
    }
}

/*
 If a path is composed of multiple paths, split into those paths
 returns a list of parsedPath
 */
function isolatePaths(parsedPath) {
    parsedPath = parsedPath.slice(0); //clone so that we do not mutate original
    var parsedPaths = [];
    for (var i = 1; i < parsedPath.length; i++) {
        if (parsedPath[i]["code"] === "M") {
            parsedPaths.push(parsedPath.slice(0, i));
            parsedPath.splice(0, i);
            i = 0;
        }
    }
    parsedPaths.push(parsedPath); // add remaining path
    return parsedPaths;
}

/*
 Must at least be a triangle, and last command is a close path or is same coord as first
 Assumes that this is an isolated path
 */
function isClosed(parsedPath) { // may still be self intersecting
    var hasAtleastThreePoints = parsedPath.length >= 3;
    var firstPoint = first(parsedPath);
    var lastPoint = last(parsedPath);
    var lastCodeIsZ = lastPoint["code"] === "Z";
    var lastPointIsFirstPoint = firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;

    return hasAtleastThreePoints && (lastCodeIsZ || lastPointIsFirstPoint);
}

/*
  If not closed, excepts
 */
function checkClosed(parsedPath){
    if (!isClosed(parsedPath)) {
        throw "Is not closed path";
    }
}

function getInputPaths(){
    var inputSvg = document.getElementById("input");
    var inputPaths = [];
    forEach(inputSvg.getElementsByTagName("path"), function (path) {
        var parsedPath = svgPathParser(path.getAttribute("d"));
        inputPaths = inputPaths.concat(isolatePaths(parsedPath));
    });
    return inputPaths;
}

function getInputPolygons(inputPaths){
    var factory = new jsts.geom.GeometryFactory();
    function coord(xy){
        return new jsts.geom.Coordinate(xy.x, xy.y);
    }

    function linring(parsedPath){
        checkClosed(parsedPath);
        var coords = [];
        //convert all but last command to coord
        forEach(parsedPath.slice(0, parsedPath.length-1), function(xy){
            coords.push(coord(xy));
        });
        //last coord should be the first coord
        coords.push(first(coords));
        return factory.createLinearRing(coords);
    }

    function polygon(parsedPath){
        checkClosed(parsedPath);
        var polygon = factory.createPolygon(linring(parsedPath));
        if(!polygon.isValid()){
            throw "polygon was not valid";
        }
        return polygon;
    }

    var inputPolygons = [];
    forEach(inputPaths, function (parsedPath) {
        checkClosed(parsedPath);
        inputPolygons.push(polygon(parsedPath));
    });
    return inputPolygons;
}

function convertPolygonToPath(outputPolygon){
    function moveTo(coord){
        return "M" + coord.x + "," + coord.y;
    }

    function lineTo(coord){
        return "L" + coord.x + "," + coord.y;
    }

    function lineTos(coords){
        var output = [];
        forEach(coords, function(coord){
            output.push(lineTo(coord));
        });
        return output;
    }
    var outputCoords = outputPolygon.shell.points;
    return [moveTo(first(outputCoords))]
        .concat(lineTos(outputCoords.slice(1, outputCoords.length - 1)), ["Z"]).join(" ");
}

function writeToOutputSvg(outputD){
    var outputSvg = document.getElementById("output");
    empty(outputSvg);
    var outputPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    outputPath.setAttribute("d",outputD);
    outputSvg.appendChild(outputPath);
}

function main(){
    var inputPaths = getInputPaths();
    var inputPolygons = getInputPolygons(inputPaths);

    var outputPolygon = first(inputPolygons);
    forEach(inputPolygons.slice(1), function(inputPolygon){
        outputPolygon = outputPolygon.union(inputPolygon);
    });

    var outputD = convertPolygonToPath(outputPolygon);
    writeToOutputSvg(outputD);
}

main();