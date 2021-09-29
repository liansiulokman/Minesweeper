
var time = 0;
var rows = 9;
var columns = 9;
var totalMines = 10;
var mines;
var clearCount = 0; // Number of revealed tiles
var flagCount = 0;
var minesDetected;
var masterGrid;
var gameIsEnded = false;
var timer;

const directions = [
    [-1,-1],
    [-1,0],
    [-1,1],
    [0,-1],
    [0,1],
    [1,-1],
    [1,0],
    [1,+1]
];

function buildGrid() {

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    // Build DOM Grid
    var tile;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            tile = createTile(x,y);
            grid.appendChild(tile);
        }
    }
    
    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    
    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";
}

function createTile(x,y) {
    var tile = document.createElement("div");
    tile.id = y + "," + x; 

    tile.classList.add("tile");
    tile.classList.add("hidden");
    
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks
    tile.addEventListener("mousedown", handleHold ); // All Clicks

    return tile;
}

function handleHold(event){
    const smiley = document.getElementById("smiley");
    smiley.classList.add("face_limbo");
}

function startGame() {
    const smiley = document.getElementById("smiley");
    if(gameIsEnded){
        smiley.classList.remove("face_lose");
        smiley.classList.remove("face_win");
    }
    resetTimer();
    buildGrid();
    clearCount = 0;
    flagCount = 0;
    minesDetected = new Set();
    gameIsEnded = false;
    updateMinesCount();
}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

function handleTileClick(event) {
    const smiley = document.getElementById("smiley");
    smiley.classList.remove("face_limbo");
    if(gameIsEnded) return;
    // Left Click
    if (event.which === 1) {
        //TODO reveal the tile
        if(!event.target.classList.contains("flag") && event.target.classList.contains("hidden")) reveal(event.target);
    }
    // Middle Click
    else if (event.which === 2) {
        //TODO try to reveal adjacent tiles
        if(!event.target.classList.contains("flag")) {
            if(validate(event.target)){
                revealAdj(event.target.id);
            }
        }
    }
    // Right Click
    else if (event.which === 3) {
        //TODO toggle a tile flag
        if(event.target.classList.contains("hidden") || event.target.classList.contains("flag")) switchFlag(event.target);
    }
}

function validate(element){
    let num = null;
    element.classList.forEach(c=>{
        if(c.indexOf("_")>-1) num = parseInt(c.substring(c.indexOf("_")+1));
    });
    if(num){
        [x,y] = element.id.split(",");
        let adjFlagsCount = 0;
        for(let [dx,dy] of directions){
            const newX = parseInt(x)+dx;
            const newY = parseInt(y)+dy;
            if(newX>=0 && newX<rows && newY>=0 && newY<columns){
                const adjElement = document.getElementById(newX+","+newY);
                if(adjElement.classList.contains("flag")) adjFlagsCount++;
            }
            if(adjFlagsCount==num) return true;
        }
    }
    return false;
}

function switchFlag(element){
    if(element.classList.contains("flag")){
        element.classList.remove("flag");
        flagCount--;
    }
    else{
        element.classList.add("flag");
        flagCount++;
    }
    updateMinesCount();
}

function hitMine(element){
    element.classList.remove("hidden");
    element.classList.add("mine_hit");
    revealAllMines(element.id);
    endGame(false);
}

function reveal(element){
    if(clearCount==0) {
        createMines(element.id);
        startTimer();
    }
    [x,y] = element.id.split(",");
    const tileValue = masterGrid[x][y];
    switch(tileValue){
        case -1:
            hitMine(element);
            return;
        case 0:
            if(element.classList.contains("hidden")) clearCount++;
            element.classList.remove("hidden");
            revealAdj(element.id);
            break;
        default:
            if(element.classList.contains("hidden")) clearCount++;
            const newClass = "tile_" +tileValue;
            element.classList.remove("hidden");
            element.classList.add(newClass);
            detectMines(element.id);
            break;

    }
    updateMinesCount();
}

function detectMines(id){
    [x,y] = id.split(",");
    for(let [dx,dy] of directions){
        const newX = parseInt(x)+dx;
        const newY = parseInt(y)+dy;
        if(newX>=0 && newX<rows && newY>=0 && newY<columns && masterGrid[newX][newY]==-1) minesDetected.add(newX+","+newY);
    }
}

function revealAdj(id){
    [x,y] = id.split(",");
    const revealList = [];
    for(let [dx,dy] of directions){
        const newX = parseInt(x)+dx;
        const newY = parseInt(y)+dy;
        if(newX>=0 && newX<rows && newY>=0 && newY<columns){//valid tile
            const adjTile = document.getElementById(newX+","+newY);
            if(masterGrid[newX][newY]==-1) minesDetected.add(newX+","+newY);
            if(adjTile.classList.contains("hidden") && !adjTile.classList.contains("flag")) revealList.push(adjTile);
        }
    }
    revealList.forEach(next=>reveal(next));
}


function revealAllMines(id){
    mines.forEach(mineId=>{
        if(mineId!=id){
            const tile = document.getElementById(mineId);
            tile.classList.remove("hidden");
            if(tile.classList.contains("flag")) tile.classList.add("mine_marked");
            else tile.classList.add("mine");
        }
    });
}


function updateMinesCount(){
    const flag = document.getElementById("flagCount");
    flag.textContent = totalMines - flagCount;
    if(clearCount>=rows*columns-totalMines) setTimeout(endGame(true), 1000); //delay a little to show the last step
}

function endGame(isWin){
    const smiley = document.getElementById("smiley");
    gameIsEnded = true;
    if(isWin){
        const time = document.getElementById("timer").innerHTML;
        alert("Congratulations! You won and your score (time used) is " + time + "s.");
        smiley.classList.add("face_win");
    }
    else{
        alert("You lose! You just revealed a mine!");
        smiley.classList.add("face_lose");
    }
    resetTimer()
}

function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;
    //TODO implement me
    switch(difficulty){
        case 0:
            rows = columns = 9;
            totalMines = 10;
            break;
        case 1:
            rows = columns = 16;
            totalMines = 40;
            break;
        case 2:
            rows = 16;
            columns = 30;
            totalMines = 99;
            break;
    }
    updateMinesCount();
    if(!gameIsEnded) startGame();
}

function createMines(id){
    const coordinates = id.split(",");
    mines = new Set();
    const maxX = rows-1;
    const maxY = columns-1;
    const coords = [[parseInt(coordinates[0]),parseInt(coordinates[1])]]; // storing the coordinates (the first-clicked tile and its 8 adj tiles) that should not be a mine
    for(let [dx,dy] of directions){
        const x = dx + parseInt(coordinates[0]);
        const y = dy + parseInt(coordinates[1]);
        coords.push([x,y]);
    }
    while(mines.size<totalMines){
        const newX = getRandomCoordinate(0,maxX).toString();
        const newY = getRandomCoordinate(0,maxY).toString();
        if(!(coords.find(item=>item[0]==newX && item[1]==newY))) mines.add(newX + "," + newY);
    }
    generateMasterGrid();
}

function generateMasterGrid(){
    masterGrid = Array.from(Array(rows), () => new Array(columns));
    for(let x=0;x<rows;x++){
        for(let y=0;y<columns;y++){
            const tempID = x+","+y;
            if(mines.has(tempID)) masterGrid[x][y] = -1;
            else{
                masterGrid[x][y] = getAdjCount(x,y);
            }
        }
    }
}

function getAdjCount(x,y){
    let mineCount = 0;
    for(let [dx,dy] of directions){
        const newX = x+dx;
        const newY = y+dy;
        if(mines.has(newX+","+newY)) mineCount++;
    }
    return mineCount;
}

function startTimer() {
    timeValue = 0;
    timer = window.setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    timeValue++;
    if(!gameIsEnded) updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}

function getRandomCoordinate(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

function resetGame(){
    location.reload();
}

function resetTimer(){
    clearInterval(timer);
    document.getElementById("timer").innerHTML = 0;
}

