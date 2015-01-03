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
    this.acres;
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
    this.numOfRowTiles;
    this.numOfColTiles;
    this.image;
    this.pos;
    this.drawPos;
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
    var BUILDING_IMAGE_TOP_BUFFER = 200;
    var SMALLEST_BUILDING_IMAGE_TOP_BUFFER = 100;
    var DEFAULT_ZOOM_LEVEL = 3;
    
    var tableMetaData;
    var divIDForLeafletViewer;
    var estate = new Estate();
    var estateImage = new Image();
    var leafletMapViewer;

    this.init = function (divIDToDrawEstate, tableMetaDataInput) {
        divIDForLeafletViewer = divIDToDrawEstate;
        tableMetaData = tableMetaDataInput;

        getEstateDataFromDOM();
        calculateAcrePositions();
        calculateAndSortBuildingPositions();
        calculateBuildingDrawPositions();
        createEstateImage();
        createLeafletMapViewerForEstateImage();
        createNamePopupsForBuildings();
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

        estate.acres = acres;
    }

    var calculateAcrePositions = function () {
        estate.numOfAcreRows = Math.ceil(Math.sqrt(estate.acres.length / NUM_TIMES_MORE_COLS_THAN_ROWS));
        estate.numOfAcreCols = Math.ceil(estate.acres.length / estate.numOfAcreRows);

        for (var a = 0; a < estate.acres.length; a++) {
            var xPos = a % estate.numOfAcreCols;
            var yPos = Math.floor(a / estate.numOfAcreCols);
            estate.acres[a].pos = new Point(xPos, yPos);
        }
    }

    var calculateAndSortBuildingPositions = function () {
        for (var a = 0; a < estate.acres.length; a++) {
            var buildings = [];
            var currentPos = new Point(0, 0);

            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                if (estate.acres[a].buildings[b].size == 1) {
                    estate.acres[a].buildings[b].numOfRowTiles = 4;
                    estate.acres[a].buildings[b].numOfColTiles = 2;
                    estate.acres[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    buildings.push(estate.acres[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                if (estate.acres[a].buildings[b].size == 0.5) {
                    estate.acres[a].buildings[b].numOfRowTiles = 2;
                    estate.acres[a].buildings[b].numOfColTiles = 2;
                    estate.acres[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    currentPos.y += 2;
                    buildings.push(estate.acres[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                if (estate.acres[a].buildings[b].size == 0.25) {
                    estate.acres[a].buildings[b].numOfRowTiles = 1;
                    estate.acres[a].buildings[b].numOfColTiles = 2;
                    estate.acres[a].buildings[b].pos = new Point(currentPos.x, currentPos.y);
                    currentPos.y += 1;
                    buildings.push(estate.acres[a].buildings[b]);
                }
            }

            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                if (estate.acres[a].buildings[b].size == 0.125) {
                    estate.acres[a].buildings[b].numOfRowTiles = 1;
                    estate.acres[a].buildings[b].numOfColTiles = 1;
                    estate.acres[a].buildings[b].pos = new Point((currentPos.x + 1) % 2, currentPos.y);
                    currentPos.x++;
                    if (currentPos.x > 1) {
                        currentPos.x = 0;
                        currentPos.y++;
                    }
                    buildings.push(estate.acres[a].buildings[b]);
                }
            }

            estate.acres[a].buildings = buildings;
        }
    }

    var calculateBuildingDrawPositions = function () {
        for (var a = 0; a < estate.acres.length; a++) {
            var acreOffsetX = estate.acres[a].pos.x * NUM_TILES_IN_ACRE_COL;
            var acreOffsetY = estate.acres[a].pos.y * NUM_TILES_IN_ACRE_ROW;
            var estateOffsetY = estate.numOfAcreCols * NUM_TILES_IN_ACRE_COL;

            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                var building = estate.acres[a].buildings[b];
                var buildingYOffset = (building.size == 0.125) ? 0 : -1;
                
                var xOffset = building.pos.x + building.pos.y + acreOffsetX + acreOffsetY;
                var yOffset = estateOffsetY + building.pos.y - building.pos.x - acreOffsetX + acreOffsetY + buildingYOffset;
                var drawPosX = xOffset * TILE_IMAGE_WIDTH / 2;
                var drawPosY = yOffset * TILE_IMAGE_HEIGHT / 2;

                building.drawPos = new Point(drawPosX, drawPosY);
                estate.acres[a].buildings[b] = building;
            }
        }
    }

    var createEstateImage = function () {
        var canvas = document.createElement('canvas');
        var drawSurface = canvas.getContext('2d');

        setCanvasSizeToCurrentEstateSize(canvas);
        drawEstate(drawSurface);
        
        estateImage.src = canvas.toDataURL();
    }

    var setCanvasSizeToCurrentEstateSize = function (canvas) {
        var numOfColTiles = estate.numOfAcreCols * NUM_TILES_IN_ACRE_COL;
        var numOfRowTiles = estate.numOfAcreRows * NUM_TILES_IN_ACRE_ROW;

        canvas.width = (numOfColTiles + numOfRowTiles - 1) * TILE_IMAGE_WIDTH / 2;
        canvas.height = (numOfColTiles + numOfRowTiles - 1) * TILE_IMAGE_HEIGHT / 2;
        canvas.height += BUILDING_IMAGE_TOP_BUFFER;
    }

    var drawEstate = function(drawSurface) {
        for (var aX = estate.numOfAcreCols -1; aX > -1; aX--) {
            for (var aY = 0; aY < estate.numOfAcreRows; aY++) {
                var listPos = aX + aY * estate.numOfAcreCols;
                if (estate.acres[listPos] != null) {
                    drawLandTiles(estate.acres[listPos], drawSurface);
                    drawBuildings(estate.acres[listPos], drawSurface);
                }
            }
        }
    }

    var drawLandTiles = function (acre, drawSurface) {
        var acreOffsetX = acre.pos.x * NUM_TILES_IN_ACRE_COL;
        var acreOffsetY = acre.pos.y * NUM_TILES_IN_ACRE_ROW;
        var estateOffsetY = estate.numOfAcreCols * NUM_TILES_IN_ACRE_COL;

        for (var tX = NUM_TILES_IN_ACRE_COL - 1; tX > -1; tX--) {
            for (var tY = 0; tY < NUM_TILES_IN_ACRE_ROW; tY++) {
                var drawPosX = (tX + tY + acreOffsetX + acreOffsetY) * TILE_IMAGE_WIDTH / 2;
                var drawPosY = (estateOffsetY + tY - tX - acreOffsetX + acreOffsetY -2) * TILE_IMAGE_HEIGHT / 2;
                drawPosY += BUILDING_IMAGE_TOP_BUFFER; 
                drawSurface.drawImage(acre.landTileImage, drawPosX, drawPosY);
            }
        }
    }

    var drawBuildings = function (acre, drawSurface) {
        for (var b = 0; b < acre.buildings.length; b++) {
            drawSurface.drawImage(acre.buildings[b].image, 
                acre.buildings[b].drawPos.x, 
                acre.buildings[b].drawPos.y);
        }
    }

    var createLeafletMapViewerForEstateImage = function () {

        // create the image map
        leafletMapViewer = L.map(divIDForLeafletViewer, {
            minZoom: 1,
            maxZoom: 4,
            zoom: DEFAULT_ZOOM_LEVEL,
            crs: L.CRS.Simple,
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: 'topleft'
            }
        });

        // dimensions of the image
        var w = estateImage.width,
            h = estateImage.height,
            url = estateImage.src;

        // center image
        leafletMapViewer.setView(leafletMapViewer.unproject([
                estateImage.width / 2,
                estateImage.height / 2], 
                DEFAULT_ZOOM_LEVEL),
            DEFAULT_ZOOM_LEVEL);

        // calculate the edges of the image, in coordinate space
        var southWest = leafletMapViewer.unproject([0, h], DEFAULT_ZOOM_LEVEL);
        var northEast = leafletMapViewer.unproject([w, 0], DEFAULT_ZOOM_LEVEL);
        var bounds = new L.LatLngBounds(southWest, northEast);

        // add the image overlay, so that it covers the entire map
        L.imageOverlay(url, bounds).addTo(leafletMapViewer);

        // tell leaflet that the map is exactly as big as the image
        leafletMapViewer.setMaxBounds(bounds);
    }

    var createNamePopupsForBuildings = function () {
        for (var a = 0; a < estate.acres.length; a++) {
            for (var b = 0; b < estate.acres[a].buildings.length; b++) {
                var building = estate.acres[a].buildings[b];
                var yOffset = SMALLEST_BUILDING_IMAGE_TOP_BUFFER;

                var xPos1 = building.drawPos.x;
                var xPos2 = building.drawPos.x + building.numOfColTiles * TILE_IMAGE_WIDTH / 2;
                var xPos3 = building.drawPos.x + (building.numOfRowTiles + building.numOfColTiles) * TILE_IMAGE_WIDTH / 2;
                var xPos4 = building.drawPos.x + building.numOfRowTiles * TILE_IMAGE_WIDTH / 2;

                var yPos1 = yOffset + building.drawPos.y + building.numOfColTiles * TILE_IMAGE_HEIGHT / 2;
                var yPos2 = yOffset + building.drawPos.y;
                var yPos3 = yOffset + building.drawPos.y + building.numOfRowTiles * TILE_IMAGE_HEIGHT / 2;
                var yPos4 = yOffset + building.drawPos.y + (building.numOfRowTiles + building.numOfColTiles) * TILE_IMAGE_HEIGHT / 2;

                var polygon = L.polygon([
                    leafletMapViewer.unproject([xPos1, yPos1], DEFAULT_ZOOM_LEVEL),
                    leafletMapViewer.unproject([xPos2, yPos2], DEFAULT_ZOOM_LEVEL),
                    leafletMapViewer.unproject([xPos3, yPos3], DEFAULT_ZOOM_LEVEL),
                    leafletMapViewer.unproject([xPos4, yPos4], DEFAULT_ZOOM_LEVEL), ],
                    { opacity: 0, fillOpacity: 0 }
                ).addTo(leafletMapViewer).bindPopup(building.name);
            }
        }
    }
}