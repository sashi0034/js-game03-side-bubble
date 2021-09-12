var canvas;
var context;
var gameLoopTimer;
var curPosX = 0;
var curPosY = 0;
var mouseState = -1;
var hndl;

var gameState=0;
var gameScore=0;

const KEY_USE = ['f','j'];
var isKeyDown = {};

const GAME_PLAYING=0;
const GAME_OVER=1;

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416; 
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;

const COL_FIRE = 1 << 0;


//var socket = new WebSocket('ws://127.0.0.1:5002');
var socket = new WebSocket('ws://49.212.155.232:5002');
var isSocketConnect = false;



window.onload = function() {
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        Sprite.init();
        hndl = new Handler();

        gameLoopTimer = setInterval( function(){},16);
        SceneChage.toTitle();
        
        document.onmousemove = onMouseMove;   // マウス移動ハンドラ
        document.onmouseup = onMouseUp;       // マウスアップハンドラ
        document.onmousedown = onMouseDown;   // マウスダウンハンドラ

        onKeyInit();
        document.addEventListener("keypress", onKeyDown); //キーボード入力
        document.addEventListener("keyup", onKeyUp);


        }
}




// 接続
socket.addEventListener('open',function(e){
    isSocketConnect=true;
    console.log('Socket connection succeeded');
});

socket.addEventListener('message',function(e){
    let d=e.data+"";
    console.log("received: "+d);
    let dat=d.split(',');

    let s=`<div class="center">[ SCORE RANKING ]<br></div>`;
    for (let i=0; i<10; i++)
    {
        let n=(i+1)+"";
        s+=`<span class="rankorder">${n.padStart(2, '0')}</span> <span class="score-number">${dat[i]}</span><br>`
    }
    let par = document.getElementById("scores");
    par.innerHTML = s;

});


function onMouseMove( e ) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    let pos = clientToCanvas( canvas, curPosX, curPosY );
    curPosX = pos.x;
    curPosY = pos.y;
}

function onKeyInit(e) {
    for (let i=0; i<KEY_USE.length; i++)
    {
        isKeyDown[KEY_USE[i]] = false;
    }
}

function onKeyDown( e ) {
    //console.log(e.key);
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = true;
        }
    }
}

function onKeyUp ( e ){
    for (let i=0; i<KEY_USE.length; i++)
    {
        let c = KEY_USE[i];
        if (e.key === c || e.key === c.toUpperCase())
        {
            isKeyDown[c] = false;
        }
    }
}



function onMouseKey( e ) {
    mouseState = -1;
}


function onMouseDown( e ) {
    mouseState = e.button;
}

function onMouseUp( e ) {
    mouseState = -1;
}


function clientToCanvas(canvas, clientX, clientY) {
    let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    let cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    let ret = {
        x: cx,
        y: cy
    };
    return ret;
}




class Handler
{
    constructor()
    {
        this.back = Graph.loadGraph("./images/backDeepSea--416x240.png");
        this.ryugujo = Graph.loadGraph("./images/ryugujo--64x48.png");
        this.isogin = Graph.loadGraph("./images/isogin--16.png");
        this.turtle =  Graph.loadGraph("./images/naetuBW--32.png");
        this.bakugon = Graph.loadGraph("./images/bakugonR--32.png");
        this.shots = Graph.loadGraph("./images/ballShots--16.png");
        this.explode = Graph.loadGraph("./images/explode--32.png");
        this.heart= Graph.loadGraph("./images/heart--16.png");
        this.star=Graph.loadGraph("./images/stars--24.png");
        this.posterTurtleOk=Graph.loadGraph("./images/posterTurtleOk--64x48.png");
    }
}



class SceneChage
{
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.set();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.set();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}




//タイトル
class Title
{
    static set()
    {
        new BackGround();
        new TitleUi();
        scoresWrite();
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();    
        if (isKeyDown.f && isKeyDown.j) 
        {
            Sprite.clear();
            Sound.playSoundFile("./sounds/startPush.mp3");
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
    }
    drawing(x,y)
    {
        UiTexts.baseText();
        Useful.drawStringEdged(144*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "Please push  [ F ] + [ J ]");
    }
}


//ページ内にスコアランキングを表示する
function scoresWrite()
{
    if (isSocketConnect)socket.send(gameScore);
}





//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=1;

    static set()
    {

        new Player();
        FireBall.set();
        Isogin.set();
        Heart.set();
        new TurtleGenerator();
        new UiTexts();
        new BackGround();
        Poster.set();
        new Cardinal();
        gameState = GAME_PLAYING;
        gameScore=0;
        Main.count=0;
        Main.finishCount=0;
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GAME_PLAYING:
                {
                    gameScore++;
                    break;
                }
            case GAME_OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        Sprite.clear();
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }


}







class Player
{
    static leftX=ROUGH_WIDTH/2-56;
    static rightX = ROUGH_WIDTH/2+56-16; 
    static life

    constructor()
    {
        let sp = Sprite.set();
        this.x=ROUGH_WIDTH/2-16;
        this.y=ROUGH_HEIGHT/2-16;
        this.count=0;
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);

        Player.life=3;
    }
    
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        if (Player.life<=0) 
        {
            if (gameState==GAME_PLAYING) Sound.playSoundFile("./sounds/finished.mp3");
            gameState=GAME_OVER;
        }
        cls.count++;

    }




    static getX(mode)
    {
        switch(mode)
        {
            case 0:return Player.leftX;
            case 1:return Player.rightX;
        }
    }


}


class Effect
{
    static Explosion = class
    {
        constructor(x, y,type)
        {
            this.x=x;
            this.y=y;
            this.count=0;
            this.type=type;

            let sp=Sprite.set(hndl.explode, 0, 0, 32, 32);
            Sprite.offset(sp, x, y, -1000);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);

            let temp=5;
            {
                let c=parseInt((cls.count%(temp*6))/temp);
                Sprite.image(sp,hndl.explode, c*32, cls.type*32, 32, 32);    
            }
            cls.count++;
            if (cls.count>(temp*6))
            {
                Sprite.clear(sp);
            }
        }
        static diffuse(x,y,type)
        {
            new Effect.Explosion(x-16,y-16,type);
            new Effect.Explosion(x+16,y-16,type);
            new Effect.Explosion(x-16,y+16,type);
            new Effect.Explosion(x+16,y+16,type);
        }
    }

    static Star=class
    {
            constructor(type, x,y,vx,vy)
            {
                this.count = 0;
                this.x=x;
                this.y=y;
                this.vx=vx; 
                this.vy=vy;
                let sp = Sprite.set(hndl.star,type*24,0,24,24);
                Sprite.offset(sp, x,y,-500);
                Sprite.belong(sp, this);
                Sprite.update(sp, this.update); 
            }
            update()
            {
                let sp=Sprite.callIndex;
                let cls=Sprite.belong(sp);
                
                cls.x+=cls.vx;
                cls.y+=cls.vy;
                cls.vy -= 0.1;
                Sprite.offset(sp, cls.x, cls.y);
                cls.count++;
                if (cls.count>180) {Sprite.clear(sp);return;}
            }
            static set(x, y, type)
            {
                for (let i=-3; i<=3; i++)
                {
                    let ang=(-90+i*30)/180*Math.PI;
                    let vx=Math.cos(ang)*2;
                    let vy=Math.sin(ang)*2;

                    new Effect.Star((type==0) ? Math.abs(i%2) : 2,x,y,vx,vy);
                }
            }
        
    }
}




class Heart
{
    constructor(x, y, n)
    {
        this.number = n;
        let sp = Sprite.set(hndl.heart,0,0,16,16);
        Sprite.offset(sp, x,y, -1500);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        if (cls.number<=Player.life)
        {
            Sprite.image(sp, hndl.heart,0,0,16,16);
        }
        else
        {
            Sprite.image(sp, hndl.heart,16,0,16,16);
        }
    }
    static set()
    {
        for (let x=0; x<3; x++)
        {
            new Heart(ROUGH_WIDTH/2-8-16+x*16, 48,x+1);
        }

    }
}














class UiTexts
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
        //console.log(Sprite.sprite[sp],sp);

    }
    drawing(x, y)
    {
        UiTexts.baseText();
        
        //Useful.drawStringEdged(0, 48*2, curPosX + ", " + curPosY + "(" + mouseState + ")");
        //Useful.drawStringEdged(0, 48*4, Sprite.usedRate());
        
        if (gameState==GAME_OVER)
        {
            Useful.drawStringEdged(160*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "G A M E  O V E R");
        }
    }
    static baseText()
    {
        Useful.drawStringEdged(0, 48*0, `Score: ${gameScore}`);
        {
            let t=`Level: ${Main.level}`
            if (Main.level>=8) t="Level: ∞"
            Useful.drawStringEdged(360*ROUGH_SCALE,0,t);
        }
    }

}


class BackGround
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this)
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0,0,4096);

        new Ryugujo();
    }
    drawing(x0, y0)
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        Graph.drawGraph(0,0,0,0,416,240,hndl.back, 3);
    }
}
class Ryugujo
{
    static count=0;
    static x;
    static y;
    constructor()
    {
        let sp=Sprite.set(hndl.ryugujo, 0, 0, 64, 48);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls = Sprite.belong(sp);
        let dy = Math.cos(Ryugujo.count/180*Math.PI)*24;
        Ryugujo.x=ROUGH_WIDTH/2-32;
        Ryugujo.y=ROUGH_HEIGHT/2-24+dy;
        Sprite.offset(sp, Ryugujo.x, Ryugujo.y);
        Ryugujo.count++;
    }
}

class Poster
{
    static TurtleOk = class
    {
        constructor()
        {
            this.count = 0;
            let sp = Sprite.set(hndl.posterTurtleOk,0,0,64,48);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update); 
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);
            Sprite.offset(sp, Ryugujo.x,Ryugujo.y+48-(cls.count%4), -100);
            if (Main.count%12==0) cls.count++;
        }
    }
    
    static set()
    {
        new Poster.TurtleOk();
    }
}




//ファイヤーボール
class FireBall
{
    constructor(side, y)
    {
        this.count = 0;
        this.x = Player.getX(side);
        this.y = y;
        this.side = side;
        let sp = Sprite.set();
        Sprite.offset(sp, this.x, this.y, -100);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }

    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        {
            let dy = (cls.count%8)*4;
            let y = cls.y-dy
            Sprite.offset(sp, cls.x, y);
        }
        if ((cls.side===0 && isKeyDown.f) || (cls.side===1 && isKeyDown.j))
        {
        let c = parseInt(((cls.count+sp*6)%90)/30,10)
        Sprite.image(sp, hndl.shots, c*16, 48, 16, 16);
        }
        else 
        {
            Sprite.image(sp, -1);
        }
        cls.count++;
    }

    static set()
    {
        for (let y=ROUGH_HEIGHT-32; y>0; y-=32)
        {
            new FireBall(0, y);
            new FireBall(1, y);
        }
        
    }
}





class Templa
{
    constructor()
    {
        this.count = 0;
        let sp = Sprite.set(-1,0,0,16,16);
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
    }
}




//磯巾着
class Isogin
{
    constructor(x)
    {
        this.count = 0;
        let sp = Sprite.set(hndl.isogin);
        Sprite.offset(sp, x, ROUGH_HEIGHT-16*1.5, 0);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        {
            let c=parseInt((cls.count%80)/20,10);
            Sprite.image(sp,hndl.isogin, c*16, 0, 16, 16);
        }
        cls.count++;
    }
    static set()
    {
        new Isogin(Player.getX(0));
        new Isogin(Player.getX(1));
    }
}



class Turtle
{
    constructor(side, type,vel)
    {
        this.x=0;
        this.y = ROUGH_HEIGHT/2-16;
        this.count = 0;
        this.side=side;
        this.type = type;
        this.vel=vel;
        
        let sp = Sprite.set();
        let cls=this;
        if (side==0) cls.x=-32;
        if (side==1) cls.x=ROUGH_WIDTH;
        Sprite.offset(sp, 0,0, 0);
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        if (cls.side==0) {
            cls.x+=cls.vel;
        }else{
            cls.x-=cls.vel;
        }


        {
            let cx = Player.getX(cls.side);
            let ps = isKeyDown[(cls.side==0) ? 'f' : 'j'];
            if (ps && Useful.between(cls.x+16, cx-4, cx+4+16))
            {//バブルと接触
                Effect.Explosion.diffuse(cls.x, cls.y, cls.type);
                Sprite.clear(sp);
                if (cls.type==0) 
                {
                    Sound.playSoundFile("./sounds/missed.mp3");
                    Player.life--;
                }else{
                    Sound.playSoundFile("./sounds/explode.mp3");
                }
                return;
            }
        }





        if (Useful.between(cls.x, ROUGH_WIDTH/2-16-8, ROUGH_WIDTH/2-16+8))
        {//竜宮城接触
            Sprite.clear(sp);
            Effect.Star.set(Ryugujo.x+(64-24)/2, Ryugujo.y,cls.type);
            if (cls.type==1)
            {//ダメージ
                Sound.playSoundFile("./sounds/missed.mp3");
                Player.life--;
            }else{
                Sound.playSoundFile("./sounds/obtain.mp3");
            }
            return;
        }

        Sprite.offset(sp, cls.x, cls.y)

        {
            let c=parseInt((cls.count%60)/15,10);
            Sprite.image(sp,hndl.turtle, (c+(1-cls.side)*4)*32, cls.type*32, 32,32);
        }
        cls.count++;
    }
}


class TurtleGenerator
{
    static sleep;
    static beforeLevel;
    constructor()
    {
        let sp = Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update); 
        
        TurtleGenerator.beforeLevel=0;
        TurtleGenerator.sleep=0;
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        if (Main.level!=TurtleGenerator.beforeLevel)
        {
            TurtleGenerator.sleep=120;
        }

        if (TurtleGenerator.sleep<=0)
        {
            switch (Main.level)
            {
                case 1:
                    {
                        if (Main.count%150==0) new Turtle(Useful.rand(2),Useful.rand(2),1.0);
                        break;
                    }
                case 2:
                    {
                        if (Main.count%75==0) new Turtle(Useful.rand(2),Useful.rand(2),1.1);
                        break;
                    }
                case 3:
                    {
                        if (Main.count%60==0) new Turtle(Useful.rand(2),Useful.rand(2),1.5);
                        break;
                    }
                case 4:
                    {
                        if (Main.count%45==0) new Turtle(Useful.rand(2),Useful.rand(2),1.8);
                        break;
                    }
                case 5:
                    {
                        if (Main.count%30==0) new Turtle(Useful.rand(2),Useful.rand(2),2.1);
                        break;
                    }
                case 6:
                    {
                        if (Main.count%25==0) new Turtle(Useful.rand(2),Useful.rand(2),2.8);
                        break;
                    }
                case 7:
                    {
                        if (Main.count%20==0) new Turtle(Useful.rand(2),Useful.rand(2),3.5);
                        break;
                    }
                case 8:
                    {
                        if (Main.count%15==0) new Turtle(Useful.rand(2),Useful.rand(2),3.9);
                        break;
                    }

                }
        }
        else
        {
            TurtleGenerator.sleep--;
        }
       TurtleGenerator.beforeLevel=Main.level;
    }
}




class Cardinal
{
    constructor()
    {
        Main.level=1;

        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        {
            let c= Main.count;
            const sec=60;
            if (c>=15*sec) Main.level = 2;
            if (c>=30*sec) Main.level = 3;
            if (c>=45*sec) Main.level = 4;
            if (c>=60*sec) Main.level = 5;
            if (c>=75*sec) Main.level = 6;
            if (c>=105*sec) Main.level = 7;
            if (c>=150*sec) Main.level = 8;
        }
    }
}

















//お役立ちクラス
class Useful
{
    static drawStringInit()
    {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5"
    }

    static drawStringEdged(x, y, text, inColor="#ffffff")
    {
        y+=48;
        context.strokeText(text, x, y);
        context.fillStyle = "#ffffff"
        context.fillText(text, x, y);

    }

    static rand(n)
    {
        return parseInt(Math.random()*n,10);
    }
    static rand2(min, max)
    {
        return min+this.rand(max-min);
    }
    static between(n, min, max)
    {
        return (min<=n && n <= max);
    }
    static isString(obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };

}









class SpriteCompornent
{
    constructor()
    {
        this.used=false;
        this.x = 0;
        this.y = 0;
        this.image = -1;
        this.u = 0;
        this.v=0;
        this.width = 0;
        this.height=0;
        this.reverse=false;
        this.mask=false;
        this.link=-1;
        
        this.colliderX=0;
        this.colliderY=0;
        this.colliderWidth=0;
        this.colliderHeight=0;
    
        this.belong = undefined;

        this.update = function(){};
        this.drawing = Sprite.Drawing.rough;
    }    

}





class Sprite
{
    static SPRITE_MAX = 512;
    static sprite;
    static sprite_Z = []

    static nextNum=0;
    static roughScale = 3;

    static callIndex;

    static init()
    {
        this.sprite = new Array(this.SPRITE_MAX);
        this.sprite_Z = [];
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            this.sprite[i] = new SpriteCompornent();
            this.sprite_Z.push([i, 0]);
        }

        console.log("Sprite init succeeded");
    }

    static set(imageHndl=-1, u=0, v=0, w=16, h=16)
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            let sp=(this.nextNum+i) % this.SPRITE_MAX;

            if(this.sprite[sp].used==false)
            {
                this.sprite[sp] = new SpriteCompornent();
                this.sprite_Z[sp][1]=0;
                this.sprite[sp].used=true;
                this.sprite[sp].image = imageHndl;
                this.sprite[sp].u = u;
                this.sprite[sp].v = v;
                this.sprite[sp].width=w;
                this.sprite[sp].height=h;

                this.sprite[sp].colliderWidth=w;
                this.sprite[sp].colliderHeight=h;

                this.nextNum=sp+1;
                return sp;
            }
        }

        return -1;
    }

    static reverse(sp, rev=true)
    {
        this.sprite[sp].reverse = rev;
    }
    static image(sp, imageHndl=undefined, u=undefined, v=undefined, w=undefined, h=undefined)
    {
        if (imageHndl!==undefined) this.sprite[sp].image = imageHndl;
        if (u!==undefined) this.sprite[sp].u = u;
        if (v!==undefined) this.sprite[sp].v = v;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
    }

    static offset(sp, x, y, z=undefined)
    {
        this.sprite[sp].x = x;
        this.sprite[sp].y = y;
        if (z!==undefined) 
        {
            this.sprite_Z[sp][1] = z;
        }
    }
    static screenXY(sp)
    {
        let x=this.sprite[sp].x + this.linkDifference_X(sp);
        let y=this.sprite[sp].y + this.linkDifference_Y(sp);
        return [x, y];
    }

    static belong(sp, cls=undefined)
    {
        if (cls==undefined) return this.sprite[sp].belong;
        this.sprite[sp].belong = cls;
    }

    static link(sp, link)
    {
        this.sprite[sp].link = link
    }

    static linkDifference_X(sp)
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].x + this.linkDifference_X(spli);
        }else{
            return 0
        }
    }
    static linkDifference_Y(sp)
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].y + this.linkDifference_Y(spli);
        }else{
            return 0
        }
    }
    static update(sp, func)
    {
        this.sprite[sp].update = func;
    }
    static DrawingProcess(sp,func)
    {
        this.sprite[sp].drawing = func;
    }
    static clear(sp=undefined)
    {
        if(sp!==undefined)
        {
            this.sprite[sp].used = false;
            this.nextNum = sp+1;
        }else{
            for(let i=0; i<this.SPRITE_MAX; i++)
            {
                this.sprite[i].used = false;
            }
        }
    }

    static collider(sp, x=undefined, y=undefined, w=undefined, h=undefined, mask=undefined)
    {
        if (x!==undefined) this.sprite[sp].x = x;
        if (y!==undefined) this.sprite[sp].y = y;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
        if (mask!==undefined) this.sprite[sp].mask = mask;
    }

    static hitRectangle(x, y, width, height, mask, min=0, max=this.SPRITE_MAX)
    {
        let x1=x, y1=y, w1=width, h1=height;
        //console.log(min+","+max);
        for(let i=min; i<max; i++)
        {
            if (this.sprite[i].used==true && (this.sprite[i].mask & mask)!=0)
            {
                let x2=this.sprite[i].x + this.linkDifference_X(i) + this.sprite[i].colliderX;
                let y2=this.sprite[i].y + this.linkDifference_Y(i) + this.sprite[i].colliderY;
                let w2=this.sprite[i].width;
                let h2=this.sprite[i].height;

                if ((Math.abs(x2-x1)<w1/2+w2/2)
                    &&
                    (Math.abs(y2-y1)<h1/2+h2/2))
                    {
                        return i;
                    }
            }
        }
    }



    static usedRate()
    {
        let c=0;
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (this.sprite[i].used) c+=1;
        }
        return c+" / "+this.SPRITE_MAX;
    }


    static allUpdate()
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if(this.sprite[i].used==true) {
                this.callIndex = i;
                this.sprite[i].update();
                //console.log(this.sprite[i]);   
            }
        }
    }

    static allDrawing()
    {
        let ol = this.sprite_Z.slice();
        ol.sort(function(a, b){return b[1]-a[1]});
        for (let i in ol)
        {
            let sp = ol[i][0];
            if(this.sprite[sp].used==true)
            {

                let x, y;
                if(this.sprite[sp].link!=-1)
                {
                    x=parseInt(this.sprite[sp].x + this.linkDifference_X(sp), 10);
                    y=parseInt(this.sprite[sp].y + this.linkDifference_X(sp), 10);
                }
                else
                {
                    x=parseInt(this.sprite[sp].x, 10)
                    y=parseInt(this.sprite[sp].y, 10)
                }
                x *= this.roughScale;
                y *= this.roughScale;
                this.callIndex = sp;
                this.sprite[sp].drawing(x, y);
            }

        }
    }

    static Drawing = class
    {
        static rough(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, Sprite.roughScale);
        }
        static detail(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, 1);
        }
        static draw(sp, x, y, scale)
        {
            if (Sprite.sprite[sp].image==-1) return;
            let spr=Sprite.sprite[sp];
            Graph.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale);
        }
    }


}


//グラフィック読み込み
class Graph
{
    static images_={}
    static imageIndex_=0;
    //画像読み込み
    static loadGraph(path)
    {
        let handler=this.imageIndex_;
        this.images_[handler] = new Image;
        this.images_[handler].src=path;
        this.imageIndex_++;
        return handler;
    }
    //描画
    static drawGraph(x, y, u, v, w, h, handle, scale)
    {
        context.drawImage(this.images_[handle], u, v, w, h, x, y, w*scale, h*scale);
    }
}


class Sound
{
    static playSoundFile(path, vol=0.5)
    {
        let music = new Audio(path);
        music.volume=vol;
        music.loop = false;
        music.play();
    }
}













