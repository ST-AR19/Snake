var sw = 20, // 方块的宽
    sh = 20, // 方块的高
    tr = 35, // 行数
    td = 45; // 列数

var snake = null, 
    fruitList = [],
    drugList = [],
    snackList = [],
    meatList = [],
    game = null;

//食物数量
var fruitNum = 10,
    drugNum = 5,
    snackNum = 7, 
    meatNum = 10;

//音乐 
const Music = document.querySelector("#bg-music");

//计时器
var hitTimer = null,
    startTime = 0,
    lastEatTime = 0,
    endTime = 0,
    dieCountDown = null;

//标志的声明
var lastHitTime = 0,
    include = true,

    positiveNum = 0,
    contPositiveNum = 0,
    junkNum = 0,
    medicalNum = 0,
    lastFood = 0,

    snackbuff = false, //buff1
    eatbuff = false, //buff2
    selfCollied = false,
    hitbuff = false; //撞墙

function Square(x, y, classname) {
    // 进行坐标 转换成像素坐标
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;
    this.viewContent = document.createElement('div'); 
    this.viewContent.className = this.class;
    this.parent = document.getElementById('snakeWrap'); 
}
Square.prototype.create = function () {
    this.viewContent.style.position = 'absolute'; // 创建方块DOM
    this.viewContent.style.width = sw + 'px';
    this.viewContent.style.height = sh + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';
    this.parent.appendChild(this.viewContent); // 将小方块添加到页面当中
};

Square.prototype.remove = function () {
    this.parent.removeChild(this.viewContent);
};

// 蛇

function Snake() {
    this.head = null; // 存一下蛇头的信息
    this.tail = null; // 存一下蛇尾的信息
    this.pos = []; // 存储蛇身上的每一个方块的位置   二维数组
    this.directionNum = {
        left: { x: -1, y: 0, rotate: 180 },
        right: { x: 1, y: 0, rotate: 0 },
        up: { x: 0, y: -1, rotate: -90 },
        down: { x: 0, y: 1, rotate: 90 }
    }; //存储蛇走的方向  用一个对象来表示
}

Snake.prototype.init = function () {
    // 初始化
    // 创建蛇头
    var snakeHead = new Square(2, 0, 'snakeHead');
    snakeHead.create();
    this.head = snakeHead; 
    this.pos.push([2, 0]); 

    // 创建蛇的身体
    var snakeBody1 = new Square(1, 0, 'snakeBody');
    snakeBody1.create();
    this.pos.push([1, 0]); 

    var snakeBody2 = new Square(0, 0, 'snakeBody');
    snakeBody2.create();
    this.pos.push([0, 0]); 
    this.tail = snakeBody2; //存储蛇尾信息

    // 形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    this.direction = this.directionNum.right; // 默认让蛇往右走
};

// 这个方法用来获取蛇头的下一个位置对应的元素  
Snake.prototype.getNextPos = function () {
    var nextPos = [
        // 蛇头要走的下一个点的坐标
        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ];

    // 下一个点是自己，代表撞到了自己，游戏结束
    this.pos.forEach(function (value) {
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            selfCollied = true; 
        }
    });
    if (selfCollied) {
        console.log("die from myself");
        this.strategies.die.call(this);
        return;
    }

    // 下一个点是墙，代表撞到了围墙，游戏结束
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        const now = new Date().getTime();
        if (now - lastHitTime <= 3000){
            this.strategies.die.call(this);
        }else{
            lastHitTime = now;
            this.strategies.hit.call(this);
        }
        return;
    }

    //食物

    //水果
    if (fruitList) {
        for (var i = 0; i < fruitList.length; i++) {
            if (fruitList[i].pos[0] == nextPos[0] && fruitList[i].pos[1] == nextPos[1]) {
                lastFood = 1;
                this.strategies.eat.call(this);
                this.strategies.eatPositiveFood.call(this);
                return;
            }
        }
    }
    //药物
    if (drugList) {
        for (var i = 0; i < drugList.length; i++) {
            if (drugList[i].pos[0] == nextPos[0] && drugList[i].pos[1] == nextPos[1]) {
                lastFood = 4;
                this.strategies.move.call(this, false);
                this.strategies.eat.call(this);
                this.strategies.eatDrug.call(this);
                if(medicalNum >= 2){
                    this.strategies.die.call(this);
                }
                return;
            }
        }
    }
    //肉
    if (meatList) {
        for (var i = 0; i < meatList.length; i++) {
            if (meatList[i].pos[0] == nextPos[0] && meatList[i].pos[1] == nextPos[1]) {
                lastFood = 2;
                this.strategies.eat.call(this);
                this.strategies.eatPositiveFood.call(this);
                return;
            }
        }
    }   
    //零食
    if (snackList) {
        for (var i = 0; i < snackList.length; i++) {
            if (snackList[i].pos[0] == nextPos[0] && snackList[i].pos[1] == nextPos[1]) {
                lastFood =3;
                this.strategies.move.call(this, false);
                this.strategies.eat.call(this);
                this.strategies.eatJunkFood.call(this);
                return;
            }
        }
    }

    // 空
    this.strategies.move.call(this);

};

// 处理碰撞后的事件
Snake.prototype.strategies = {
    move: function (format) { // 这个参数用来决定要不要删除蛇尾    当传了操作（true）后为吃
        // 创建一个新的身体（在旧蛇头的位置）
        var newBody = new Square(this.head.x / sw, this.head.y / sh, 'snakeBody');
        // 更新链表的关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        this.head.remove(); // 把旧蛇头从原来的位置删除
        newBody.create();

        // 创建一个新的蛇头,在（nextPos 位置创建）
        var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, 'snakeHead');
        // 更新链表的关系
        newHead.last = null;
        newHead.next = newBody;
        newHead.next.last = newHead;
        newHead.viewContent.style.transform = 'rotate(' + this.direction.rotate + 'deg)';

        newHead.create();
        // 蛇身上的每一个坐标进行更新
        this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y]);
        this.head = newHead; 

        // 删除蛇尾 通过判断是否吃food，如果吃了food，就不删除，若是没有吃，就删除

        if (!format) { //如果format 的值为false  表示需要删除（除了吃之外的操作）
            this.tail.remove();
            this.tail = this.tail.last;
            this.tail.next = null;
            this.pos.pop();
        }else{
            game.score++;
            document.getElementById("score").innerHTML=game.score;
        }
    },
    hit: function () {
        hitbuff = true;
        clearInterval(snakeInterval);
        clearTimeout(hitTimer);
        intervalTime = intervalTime * 3;
        hitTimer = setTimeout(() => {
            hitbuff = false;
            intervalTime = intervalTime / 3;
            clearInterval(snakeInterval);
            snakeInterval = setInterval(() => this.getNextPos(), intervalTime)
        },20000);
        snakeInterval = setInterval(function () {
            snake.getNextPos();
        }, intervalTime)
    },
    eatJunkFood: function () {
        junkNum ++;
        medicalNum = 0;
        positiveNum = 0;
        snackbuff = true;
        document.getElementById("buff1").innerHTML=snackbuff;
        if(snackbuff){
            var tempS = junkNum;
            console.log("Jsnack");
            if(tempS == 1){
                this.strategies.move.call(this,true);
            }else if(tempS%3 == 0){
                while(tempS%3){
                    this.strategies.move.call(this,true);
                }
            }else{
                this.strategies.move.call(this,false);
            }
        }
    },
    eatDrug: function () {
        medicalNum ++;
        junkNum = 0;
        if(hitbuff){
            removeHitBuff();
        }
        eatbuff = false;
        document.getElementById("buff2").innerHTML=eatbuff;
        snackbuff = false;
        document.getElementById("buff1").innerHTML=snackbuff;
    },
    eatPositiveFood: function () {
        positiveNum++;
        junkNum = 0;
        medicalNum = 0;
        if(lastFood == 1||lastFood == 2){
            contPositiveNum ++;
        }else{
            contPositiveNum = 0;
        }
        if(positiveNum == 3 && hitbuff){
            this.add.removeHitBuff.call(this);
        }
        if( contPositiveNum >= 4 && eatbuff){
            eatbuff = false
            document.getElementById("buff2").innerHTML=eatbuff;
        }

        if(snackbuff){
            var tempS = positiveNum;
            console.log("Psnack");
            if(tempS == 1){
                this.strategies.move.call(this,true);
            }else if(tempS%3 == 0){
                while(tempS%3){
                    this.strategies.move.call(this,true);
                }
            }else{
                this.strategies.move.call(this,false);
            }
        }else if(eatbuff){
            if(contPositiveNum == 2){
                this.strategies.move.call(this,true);
            }else{
                console.log("Peat");
                console.log(contPositiveNum);
                this.strategies.move.call(this,false);
            }
        }else{
            console.log("Pnormal");
            var temp = positiveNum/6;
            temp = parseInt(temp);
            this.strategies.move.call(this, true);
            while(temp--){
                this.strategies.move.call(this, true);
                clearInterval(snakeInterval);
                intervalTime = intervalTime * 0.8;
                snakeInterval = setInterval(function () {
                    snake.getNextPos();
                },intervalTime);
            }
        }
    },
    eat: function () {
        console.log("lastFood:",lastFood);
        console.log("positiveNum",positiveNum);
        console.log("junkNum",junkNum);
        console.log("medcialNum",medicalNum);
        var self = this
        createFood();
        clearInterval(foodInterval);
        foodInterval = setInterval(function () {
            createFood();
        },3000);
        var temp = new Date().getTime();
        clearTimeout(dieCountDown);
        if(temp-lastEatTime>5000){ 
            dieCountDown = setTimeout(function () {
                self.strategies.die.call();
            },5000);
            eatbuff=true;
            document.getElementById("buff2").innerHTML=eatbuff;
        }
        lastEatTime = temp;
    },
    die: function () {
        game.over();
    }
}
//补充函数
Snake.prototype.add = {
    removeHitBuff: function() {
        hitbuff = false;
        clearInterval(snakeInterval);
        clearTimeout(hitTimer);
        intervalTime = intervalTime / 3;
        snakeInterval = setInterval(function () {
            snake.getNextPos();
        },intervalTime);
    }
}


snake = new Snake();

// 创建食物

//判断是否重合
function judgePos(x,y) {
    include = false;
    // 判断是否在蛇身上
    for (var i = 0; i < snake.pos.length; i++) {
        var pos = snake.pos[i];
        if (pos[0] === x && pos[1] === y) {
            include = true;
            break;
        }
    }
    // 判断是否与别的食物坐标重合
    for (var j = 0; j < fruitList.length; j++) {
        var fruit = fruitList[j];
        if (fruit.pos[0] === x && fruit.pos[1] === y) {
            include = true;
            break;
        }
    }
    for (var j = 0; j < drugList.length; j++) {
        var drug = drugList[j];
        if (drug.pos[0] === x && drug.pos[1] === y) {
            include = true;
            break;
        }
    }
    for (var j = 0; j < meatList.length; j++) {
        var meat = meatList[j];
        if (meat.pos[0] === x && meat.pos[1] === y) {
            include = true;
            break;
        }
    }
    for (var j = 0; j < snackList.length; j++) {
        var snack = snackList[j];
        if (snack.pos[0] === x && snack.pos[1] === y) {
            include = true;
            break;
        }
    }
}
function initFood() {
    fruitList.length = 0;
    drugList.length = 0; 
    snackList.length = 0;
    meatList.length = 0;
}
function createFood() {
    //初始化
    initFood();
    //随机食物

    //水果
    while (fruitList.length < fruitNum) {
        var x = Math.round(Math.random() * (td - 1));
        var y = Math.round(Math.random() * (tr - 1)); 
        judgePos(x,y);
        if (!include) {
            var newfruit = new Square(x, y, 'fruit');
            newfruit.pos = [x, y];
            fruitList.push(newfruit);
        }
    }
    //药物
    while (drugList.length < drugNum) {
        var x = Math.round(Math.random() * (td - 1));
        var y = Math.round(Math.random() * (tr - 1)); 
        judgePos(x,y);
        if (!include) {
            var newdrug = new Square(x, y, 'drug');
            newdrug.pos = [x, y];
            drugList.push(newdrug);
        }
    }
    //零食
    while (snackList.length < snackNum) {
        var x = Math.round(Math.random() * (td - 1));
        var y = Math.round(Math.random() * (tr - 1)); 
        judgePos(x,y);
        if (!include) {
            var newsnack = new Square(x, y, 'snack');
            newsnack.pos = [x, y];
            snackList.push(newsnack);
        }
    }
    //肉
    while (meatList.length < meatNum) {
        var x = Math.round(Math.random() * (td - 1));
        var y = Math.round(Math.random() * (tr - 1)); 
        judgePos(x,y);
        if (!include) {
            var newmeat = new Square(x, y, 'meat');
            newmeat.pos = [x, y];
            meatList.push(newmeat);
        }
    }

  // 将所有食物连接，如果DOM元素存在，则修改展示坐标，不存在则创建新的DOM元素
    //水果
    var fruitDoms = document.querySelectorAll('.fruit');
    for (var k = 0; k < fruitList.length; k++) {
        var fruit = fruitList[k];
        if (k < fruitDoms.length) {
            fruitDoms[k].style.left = fruit.pos[0] * sw + 'px';
            fruitDoms[k].style.top = fruit.pos[1] * sh + 'px';
        } else {
            fruit.create();
        }
    }
    //药物
    var drugDoms = document.querySelectorAll('.drug');
    for (var k = 0; k < drugList.length; k++) {
        var drug = drugList[k];
        if (k < drugDoms.length) {
            drugDoms[k].style.left = drug.pos[0] * sw + 'px';
            drugDoms[k].style.top = drug.pos[1] * sh + 'px';
        } else {
            drug.create();
        }
    }
    //肉    
    var meatDoms = document.querySelectorAll('.meat');
    for (var k = 0; k < meatList.length; k++) {
        var meat = meatList[k];
        if (k < meatDoms.length) {
            meatDoms[k].style.left = meat.pos[0] * sw + 'px';
            meatDoms[k].style.top = meat.pos[1] * sh + 'px';
        } else {
            meat.create();
        }
    }
    //零食
    var snackDoms = document.querySelectorAll('.snack');
    for (var k = 0; k < snackList.length; k++) {
        var snack = snackList[k];
        if (k < snackDoms.length) {
            snackDoms[k].style.left = snack.pos[0] * sw + 'px';
            snackDoms[k].style.top = snack.pos[1] * sh + 'px';
        } else {
            snack.create();
        }
    }
}

// 创建游戏逻辑

function Game() {
    snakeInterval = 0;
    foodInterval = 0;
    lastHitTime = 0;
    intervalTime = 200;
    this.score = 0;
}

Game.prototype.init = function () {
    snake.init();
    createFood();
    document.onkeydown = function (ev) {
        ev.preventDefault();
        if(hitbuff){
            if (ev.which == 37 && snake.direction != snake.directionNum.left) { 
                snake.direction = snake.directionNum.right;
            } else if (ev.which == 38 && snake.direction != snake.directionNum.up) {
                snake.direction = snake.directionNum.down;
            } else if (ev.which == 39 && snake.direction != snake.directionNum.right) {
                snake.direction = snake.directionNum.left;
            } else if (ev.which == 40 && snake.direction != snake.directionNum.down) {
                snake.direction = snake.directionNum.up;
            }           
        }else{
            if (ev.which == 37 && snake.direction != snake.directionNum.right) { 
                snake.direction = snake.directionNum.left;
            } else if (ev.which == 38 && snake.direction != snake.directionNum.down) {
                snake.direction = snake.directionNum.up;
            } else if (ev.which == 39 && snake.direction != snake.directionNum.left) {
                snake.direction = snake.directionNum.right;
            } else if (ev.which == 40 && snake.direction != snake.directionNum.up) {
                snake.direction = snake.directionNum.down;
            }
        }
    }
    Music.play();
    this.start();
}
Game.prototype.start = function () { // 开始游戏
    snakeInterval = setInterval(function () {
        snake.getNextPos();
    }, intervalTime)
    foodInterval = setInterval(function () {
        createFood();
    },3000);
    var temp = new Date();
    lastEatTime = temp.getTime();
}
Game.prototype.pause = function () {
    clearInterval(snakeInterval);
    clearInterval(foodInterval);
    clearTimeout(dieCountDown);
}

Game.prototype.over = function () {
    hitbuff = false;
    eatbuff = false;
    document.getElementById("buff2").innerHTML=eatbuff;
    snackbuff = false;
    document.getElementById("buff1").innerHTML=snackbuff;
    selfCollied = false;
    intervalTime = 200;
    positiveNum = 0;
    junkNum = 0;
    medicalNum = 0;
    contPositiveNum = 0;
    clearInterval(snakeInterval);
    clearInterval(foodInterval);
    var temp = new Date();
    endTime = temp.getTime();
    console.log(endTime);
    updataMes();
    Music.pause();
    alert('你的得分为：' + this.score + '分');

    // 游戏回到最初始的状态
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';
    snake = new Snake();
    game = new Game();
    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}

// 开启游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
startBtn.onclick = function () {
    console.log(fruitNum);
    startBtn.parentNode.style.display = 'none';
    game.init();
    var temp = new Date()
    startTime = temp.getTime();
    console.log(startTime);
    lastEatTime = startTime;
    clearTimeout(dieCountDown);
};

// 暂停
var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function () {
    game.pause();
    pauseBtn.parentNode.style.display = 'block'
}

pauseBtn.onclick = function () {
    if(eatbuff){
        dieCountDown = setTimeout(function () {
            self.strategies.die.call();
        },5000);
    }
    game.start();
    pauseBtn.parentNode.style.display = 'none';
}
// rank
window.onload = function(){
    initMes();
};
var flag=false;//false表示当前用户是新用户,true为老用户
var currentName;

function clearStorage() {
        localStorage.clear();
        alert("记录已清除");
}

function displayRanking() {
    var ul=document.getElementById('ranking');
    var historyMessage=JSON.parse(localStorage.getItem("messageStorage"));
    var ranking=new Array();
    for(var i=0;i<historyMessage.length;i++) {
        var player=historyMessage[i];
        var nameHighScore={};
        var currentScore=player.score;
        var currentHighScore=currentScore[0];
        for(var j=0;j<currentScore.length;j++){
            if(currentHighScore<currentScore[j]){
                currentHighScore=currentScore[j];
            }
        }
        nameHighScore.name=player.name;
        nameHighScore.score=currentHighScore;
        ranking.push(nameHighScore); 
    }
    var k, m, tmp;
    for (k = 1; k < ranking.length; k++){
        tmp = ranking[k];
        m = k - 1;
        while (m>=0 && tmp.score <= ranking[m].score){
            var temp = ranking[m+1];
            ranking[m + 1] = ranking[m];
            if(tmp.score == ranking[m].score && tmp.spendTime > ranking[m].spendTime){
                ranking[m+1] = temp;
            }
            m--;
        }
        ranking[m + 1] = tmp;
    }
    if(ul.style.display === "none"){
        ul.style.display = "block";
        for(var f=ranking.length-1;f>0&&ranking.length-f<10;f--){
            var li=document.createElement('li');
            li.innerHTML="玩家："+ranking[f].name+"------最高分："+ranking[f].score;
            ul.appendChild(li);
        }
    }else{
        ul.style.display = "none";
        ul.innerHTML = "";
    }
}
function toggleHistory() {
    var historyList = document.getElementById("historyScore");
    if (historyList.style.display === "none") {
        historyList.style.display = "block";
        displayHistory();
    } else {
        historyList.style.display = "none";
        historyList.innerHTML = "";
    }
}
function displayHistory() {
    var historyMessage=JSON.parse(localStorage.getItem("messageStorage"));
    var ul=document.getElementById('historyScore');
    for(var i=0;i<historyMessage.length;i++) {
        console.log(historyMessage[i].name);
        if(historyMessage[i].name==currentName){
            var score=historyMessage[i].score;
            var spendTime=historyMessage[i].spendTime;
            var temp = 1;
            for(var j=score.length-1;j>0;j--){
                var li=document.createElement('li');
                li.innerHTML='前'+temp+'次分数：'+score[j]+' 用时：'+spendTime[j]+'s';
                temp++;
                ul.appendChild(li);
            }
            return;
        }
    }
}
function initMes(){
    var messageChild={
        name: "",
        score: [0],
        spendTime: []
    };
    var historyMessage=JSON.parse(localStorage.getItem("messageStorage"));
    currentName=prompt('请输入你的名字：','');
    if(currentName!=null && currentName!=''){
        document.getElementById('name').innerHTML=currentName;
    }
    if(historyMessage != null){
        for(var i=0;i<historyMessage.length;i++){
            if(historyMessage[i].name===currentName){
                flag=true; 
            }
        }
    }
    if(!flag){//新用户
        messageChild.name=currentName;
        messageChild.score=[0];
        messageChild.spendTime=[0];
        if(historyMessage==null){
            historyMessage=new Array();
        }
        historyMessage.push(messageChild);
        localStorage.setItem("messageStorage",JSON.stringify(historyMessage));
    }
}

function updataMes() {
    var historyMessage=JSON.parse(localStorage.getItem("messageStorage"));
    for(var i=0;i<historyMessage.length;i++){
        if(historyMessage[i].name==currentName){
            historyMessage[i].score.push(game.score);
            historyMessage[i].spendTime.push((endTime-startTime)/1000);
            if (historyMessage[i].score.length > 10) {
                historyMessage[i].score.splice(0, 1);
                historyMessage[i].spendTime.splice(0, 1);
            }
            localStorage.setItem("messageStorage",JSON.stringify(historyMessage));
            return;
        }
    }
}