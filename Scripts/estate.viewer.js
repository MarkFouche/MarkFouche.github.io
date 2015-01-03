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

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function EstateViewer() {
    var NUM_TILES_IN_ACRE = 8;
    var NUM_TILES_IN_ACRE_ROW = 4;
    var NUM_TILES_IN_ACRE_COL = 2;
    var NUM_TIMES_MORE_COLS_THAN_ROWS = 2;
    var TILE_IMAGE_WIDTH = 200;
    var TILE_IMAGE_HEIGHT = 100;
    
    var tableMetaData;
    var estate = new Estate();
    var canvas;
    var drawSurface;
    var canvasImageTranslate = new Point(0, 0);
    var canvasImageScale = .5;

    this.init = function (canvasIDToDrawTo, tableMetaDataInput) {
        canvas = document.getElementById(canvasIDToDrawTo);
        canvas.width = window.screen.availWidth;
        canvas.height = window.screen.availHeight;
        drawSurface = canvas.getContext("2d");
        tableMetaData = tableMetaDataInput;

        getEstateDataFromDOM();
        calculateAndSortBuildingPositionsForAcres();
        createAcreMatrixFromAcreList();
        setUpMobileGestureInteractions();
        centerEstateOnCanvasAroundPoint(new Point(canvas.width / 2, canvas.height / 2));
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

    var calculateAndSortBuildingPositionsForAcres = function () {
        for (var a = 0; a < estate.acreList.length; a++) {
            var buildings = [];
            var currentPos = new Point(0, 0);

            for (var b = 0; b < estate.acreList[a].buildings.length; b++) {
                if (estate.acreList[a].buildings[b].size == 1) {
                    estate.acreList[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    buildings.push(estate.acreList[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acreList[a].buildings.length; b++) {
                if (estate.acreList[a].buildings[b].size == 0.5) {
                    estate.acreList[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    currentPos.y += 2;
                    buildings.push(estate.acreList[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acreList[a].buildings.length; b++) {
                if (estate.acreList[a].buildings[b].size == 0.25) {
                    estate.acreList[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    currentPos.y += 1;
                    buildings.push(estate.acreList[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acreList[a].buildings.length; b++) {
                if (estate.acreList[a].buildings[b].size == 0.125) {
                    estate.acreList[a].buildings[b].pos = new Point((currentPos.x + 1) % 2, currentPos.y);
                    currentPos.x++;
                    if (currentPos.x > 1) {
                        currentPos.x = 0;
                        currentPos.y++;
                    }
                    buildings.push(estate.acreList[a].buildings[b]);
                }
            }

            estate.acreList[a].buildings = buildings;
        }
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
            estate.acreList[a].pos = new Point(xPos, yPos);
            estate.acreMatrix[xPos][yPos] = estate.acreList[a];
        }
    }

    // Uses hammer.js for mobile gestures
    var setUpMobileGestureInteractions = function () {
        var mc = new Hammer(canvas);
        var panPrevPos = new Point(0, 0);

        mc.on("panstart", function (ev) {
            panPrevPos.x = event.x;
            panPrevPos.y = event.y;
        });

        mc.on("panmove", function (ev) {
            canvasImageTranslate.x += event.x - panPrevPos.x;
            canvasImageTranslate.y += event.y - panPrevPos.y;
            panPrevPos.x = event.x;
            panPrevPos.y = event.y;
        });

        mc.on("pinchmove", function (ev) {
            canvasImageScale = canvasImageScale * ev.scale;
        });

        mc.on("doubletap", function (ev) {
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.msRequestFullscreen) {
                canvas.msRequestFullscreen();
            } else if (canvas.mozRequestFullScreen) {
                canvas.mozRequestFullScreen();
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
            }
        });
    }

    var centerEstateOnCanvasAroundPoint = function (pos) {
        var numColTiles = estate.numOfAcreCols * NUM_TILES_IN_ACRE_COL;
        var numRowTiles = estate.numOfAcreRows * NUM_TILES_IN_ACRE_ROW;
        var totalEstateImageWidth = (numColTiles + numRowTiles) * TILE_IMAGE_WIDTH / 2 * canvasImageScale;
        var totalEstateImageHeight = (numColTiles + numRowTiles) * TILE_IMAGE_HEIGHT / 2 * canvasImageScale;
        var estateYOffset = numColTiles * TILE_IMAGE_HEIGHT / 2 * canvasImageScale;
        var imageXOffset = pos.x - totalEstateImageWidth / 2;
        var imageYOffset = estateYOffset + pos.y - totalEstateImageHeight / 2;

        canvasImageTranslate.x = imageXOffset;
        canvasImageTranslate.y = imageYOffset;
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
        drawSurface.setTransform(1, 0, 0, 1, 0, 0);
        drawSurface.fillStyle = "lightgrey";
        drawSurface.fillRect(0, 0, drawSurface.canvas.width, drawSurface.canvas.height);
        drawSurface.translate(canvasImageTranslate.x, canvasImageTranslate.y);
        drawSurface.scale(canvasImageScale, canvasImageScale);

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
        var acreOffsetX = acre.pos.x * NUM_TILES_IN_ACRE_COL;
        var acreOffsetY = acre.pos.y * NUM_TILES_IN_ACRE_ROW;

        for (var tX = NUM_TILES_IN_ACRE_COL -1; tX > -1; tX--) {
            for (var tY = 0; tY < NUM_TILES_IN_ACRE_ROW; tY++) {
                var drawPosX = (tX + tY + acreOffsetX + acreOffsetY) * TILE_IMAGE_WIDTH / 2;
                var drawPosY = (tY - tX - acreOffsetX + acreOffsetY) * TILE_IMAGE_HEIGHT / 2;
                drawSurface.drawImage(acre.landTileImage, drawPosX, drawPosY);
            }
        }
    }

    var drawBuildings = function (acre) {
        var acreOffsetX = acre.pos.x * NUM_TILES_IN_ACRE_COL;
        var acreOffsetY = acre.pos.y * NUM_TILES_IN_ACRE_ROW;

        for (var b = 0; b < acre.buildings.length; b++) {
            var buildingYOffset = (acre.buildings[b].size == 0.125) ? 2 : 3;
            var xOffset = acre.buildings[b].pos.x + acre.buildings[b].pos.y + acreOffsetX + acreOffsetY; 
            var yOffset = acre.buildings[b].pos.y - acre.buildings[b].pos.x - acreOffsetX + acreOffsetY - buildingYOffset;               
            var drawPosX = xOffset * TILE_IMAGE_WIDTH / 2;
            var drawPosY = yOffset * TILE_IMAGE_HEIGHT / 2;
            drawSurface.drawImage(acre.buildings[b].image, drawPosX, drawPosY);
        }
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