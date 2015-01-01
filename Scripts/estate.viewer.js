"use strict";

function TableMetaData() {
    this.tableIDWithEstateData;
    this.colArceID;
    this.colLandTilePic;
    this.colBuildingPic;
    this.colBuildingSize;
    this.colBuildingName;
}

function Estate() {
    this.acreList;
    this.acreMatrix;
    this.numOfAcreRows;
    this.numOfAcreCols;
}

function Acre() {
    this.name;
    this.buildings;
    this.landTileImage;
    this.pos;
}

function Building() {
    this.name;
    this.size;
    this.image;
    this.pos;
}

function LandTile() {
    this.buildingOnTile;
    this.pos;
}

function Position(x, y) {
    this.x = x;
    this.y = y;
}

function EstateViewer() {
    var NUM_TILES_IN_ACRE = 8;
    var NUM_TILES_IN_ACRE_ROW = 4;
    var NUM_TILES_IN_ACRE_COL = 2;
    var NUM_TIMES_MORE_COLS_THAN_ROWS = 2;
    
    var canvas;
    var drawSurface;
    var tableMetaData;
    var estate = new Estate();

    this.init = function (canvasIDToDrawTo, tableMetaDataInput) {
        canvas = document.getElementById(canvasIDToDrawTo);
        drawSurface = canvas.getContext("2d");
        tableMetaData = tableMetaDataInput;

        getEstateDataFromDOM();
        convertEstateDataToDrawData();
        setUpWindowForAnimations();
        animate();
    }

    var getEstateDataFromDOM = function () {
        var elements = document.getElementById(tableMetaData.tableIDWithEstateData).childNodes;
        var tableRows = elements[1].getElementsByTagName('tr');
        var currentAcreName = "";
        var acres = [];
        var acre;

        for (var a = 1; a < tableRows.length; a++) {
            var cellItems = tableRows[a].getElementsByTagName('td');

            // If first building on Acre
            if (currentAcreName != cellItems[tableMetaData.colArceID].innerHTML) {
                currentAcreName = cellItems[tableMetaData.colArceID].innerHTML;
                acre = new Acre();
                acre.name = currentAcreName;
                acre.landTileImage = new Image();
                acre.landTileImage.src = cellItems[tableMetaData.colLandTilePic].childNodes[1].src;
                acre.buildings = [];
            }

            // If building has pic
            if (cellItems[tableMetaData.colBuildingSize].innerHTML != 0) {
                var building = new Building();
                building.size = cellItems[tableMetaData.colBuildingSize].innerHTML;
                building.name = cellItems[tableMetaData.colBuildingName].innerHTML;
                building.image = new Image();
                building.image.src = cellItems[tableMetaData.colBuildingPic].childNodes[1].src;

                if (building.size != 0) {
                    acre.buildings.push(building);
                }
            }

            // If last building on Acre
            if (a == tableRows.length - 1
                || currentAcreName != tableRows[a + 1].getElementsByTagName('td')[tableMetaData.colArceID].innerHTML) {

                acres.push(acre);
            }
        }

        estate.acreList = acres;
    }

    var convertEstateDataToDrawData = function () {
        calculateBuildingPositionsForAcres();
        createAcreMatrixFromAcreList();
    }

    var calculateBuildingPositionsForAcres = function () {
       // for () {
       ///////////////////////////////////////////////////////////////////////////////////////////////     
       // }
    }

    var createAcreMatrixFromAcreList = function () {
        estate.numOfAcreRows = Math.ceil(Math.sqrt(estate.acreList.length / NUM_TIMES_MORE_COLS_THAN_ROWS));
        estate.numOfAcreCols = Math.ceil(estate.acreList.length / estate.numOfAcreRows);

        estate.acreMatrix = [];
        for (var x = 0; x < estate.numOfAcreCols; x++) {
            estate.acreMatrix.push(new Array(estate.numOfAcreRows));
        }

        for (var a = 0; a < estate.acreList.length; a++) {
            var xPos = a % estate.numOfAcreCols;
            var yPos = Math.floor(a / estate.numOfAcreCols);
            estate.acreList[a].pos = new Position(xPos, yPos);
            estate.acreMatrix[xPos][yPos] = estate.acreList[a];
        }
    }

    var setUpWindowForAnimations = function() {
        window.requestAnimFrame = (function (callback) {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame 
                || window.mozRequestAnimationFrame || window.oRequestAnimationFrame 
                || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();
    }

    var animate = function () {
        // update

        // clear
        drawSurface.fillStyle = "lightgrey";
        drawSurface.fillRect(0, 0, canvas.width, canvas.height);

        // draw stuff
        drawEstate();

        // request new frame
        requestAnimFrame(function () {
            animate();
        });
    }

    var drawEstate = function() {
        for (var aX = estate.acreMatrix.length -1; aX > -1; aX--) {
            for (var aY = 0; aY < estate.acreMatrix[aX].length; aY++) {
                if (estate.acreMatrix[aX][aY] != null) {
                    drawLandTiles(estate.acreMatrix[aX][aY]);
                    drawBuildings(estate.acreMatrix[aX][aY]);
                }
            }
        }
    }

    var drawLandTiles = function(acre) {
        var halfImageWidth = acre.landTileImage.width / 2;
        var halfImageHeight = acre.landTileImage.height / 2;
        var acreOffsetX = acre.pos.x * NUM_TILES_IN_ACRE_COL;
        var acreOffsetY = acre.pos.y * NUM_TILES_IN_ACRE_ROW;

        for (var tX = NUM_TILES_IN_ACRE_COL -1; tX > -1; tX--) {
            for (var tY = 0; tY < NUM_TILES_IN_ACRE_ROW; tY++) {
                var drawPosX = (tX + tY + acreOffsetX + acreOffsetY) * halfImageWidth;
                var drawPosY = 300 + (tY - tX - acreOffsetX + acreOffsetY) * halfImageHeight;
                drawSurface.drawImage(acre.landTileImage, drawPosX, drawPosY);
            }
        }
    }

    var drawBuildings = function (acre) {
        ///////////////////////////////////////////////////////////////////////////////////////////////
    }
}

/*********************************************
/              USEFUL FUNCTIONS
*********************************************/

// Returns relative mouse position for canvas events
var getMousePos = function(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}