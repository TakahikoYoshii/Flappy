/**
 * Created by yoshii on 15/02/20.
 * # tmlib.js games
 * Flappy Bird風のゲームです。.
 * http://
 */

var SCREEN_WIDTH = 680;              // スクリーン幅
var SCREEN_HEIGHT = 960;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分
var FPS = 60;// fps を設定する(updateする速さ)

//
var GROUND_HEIGHT = 160;
var BOX_WIDTH = 92;
var BOX_HEIGHT = 120;
var SPACE_WIDTH = 150;
var SPACE_HEIGHT = 200;
var PIPE_WIDTH = 200;
var PIPE_HEIGHT = SCREEN_HEIGHT - GROUND_HEIGHT - SPACE_HEIGHT;
var PIPE_NUM = 5;
var START_X = SCREEN_WIDTH + PIPE_WIDTH / 2;
var SCROLL_SPEAD = 2;
var SCORE = 0;
var ASSETS = {
    "player": "image/player.png",
    "player_off": "image/player_off.png",
    "bg": "image/bg.jpg",
    "ground": "image/ground.jpg",
    "pipe": "image/pipe.png",
    "PIPE": "image/pipe.png"
};

// ラベルのリスト
var UI_DATA = {
    LABELS: {
        children: [
            {
                type: "Label",
                name: "limitTimeLabel",
                x: 50,
                y: 50,
                fillStyle: "black",
                text: " ",
                fontSize: 40,
                align: "left"
            }
        ]
    }
};

// main
tm.main(function () {
    // キャンバスアプリケーションを生成
    var app = tm.display.CanvasApp("#world");

    // リサイズ
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);
    // ウィンドウにフィットさせる
    app.fitWindow();
    app.fps = FPS;                  // fps を設定する

    // ローダーで画像を読み込む
    var loading = loadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    });

    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function () {
        // メインシーンに入れ替える
        var scene = mainScene();
        app.replaceScene(scene);
    };
    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

// シーンを定義
// Loading シーン
tm.define("loadingScene", {
    superClass: "tm.app.Scene",

    init: function (param) {
        this.superInit();
//        var Loader = tm.asset.Loader();
//        Loader._load("player", "image/player.png", "png");

        param = {}.$extend({
            width: 680,
            height: 960
        }, param);

        this.bg = tm.display.Shape(param.width, param.height).addChildTo(this);
        this.bg.canvas.clearColor("#000000");
        this.bg.setOrigin(0, 0);

        var loadLabel = tm.display.Label("Loading");
        loadLabel.x = param.width / 2;
        loadLabel.y = param.height / 2;
        loadLabel.width = param.width;
        loadLabel.align = "center";
        loadLabel.baseline = "middle";
        loadLabel.fontSize = 64;
        loadLabel.setFillStyle("#FFFFFF");
        loadLabel.counter = 0;
        loadLabel.update = function (app) {
            if (app.frame % 30 === 0) {
                this.text += ".";
                this.counter += 1;
                if (this.counter > 3) {
                    this.counter = 0;
                    this.text = "Loading";
                }
            }
        };
        loadLabel.addChildTo(this.bg);

        var touchMeLabel = tm.display.Label("touch me!").addChildTo(this);
        touchMeLabel.setPosition(SCREEN_CENTER_X, 180);

        this.bg.tweener.clear().fadeIn(100).call(function () {
            if (param.assets) {
                var loader = tm.asset.Loader();

                loader.onload = function () {

                    // デフォルトでいくつか生成しておく
                    (10).times(function () {
                        var circle = icon("player");
                        circle.x = Math.rand(0, SCREEN_WIDTH);
                        circle.y = Math.rand(0, SCREEN_HEIGHT);
                        this.addChild(circle);
                    }, this);

                    this.bg.tweener.clear().wait(5000).fadeOut(300).call(function () {
                        if (param.nextScene) {
                            this.app.replaceScene(param.nextScene());
                        }
                        var e = tm.event.Event("load");
                        this.fire(e);
                    }.bind(this));

                }.bind(this);

                loader.onprogress = function (e) {
                    var event = tm.event.Event("progress");
                    event.progress = e.progress;
                    this.fire(event);
                }.bind(this);

                loader.load(param.assets);
            }
        }.bind(this));
    },

    update: function (app) {
        // タッチ時にサークルを生成
        if (app.pointing.getPointing() == true) {
            var circle = icon("player");
            circle.x = app.pointing.x;
            circle.y = app.pointing.y;
            this.addChild(circle);
        }
    }
});

// メインシーン
tm.define("mainScene", {
    superClass: "tm.app.Scene",

    dy: 0,
    counter: 0,
    lives: true,
    move: false,

    init: function () {
        this.superInit();

        // 背景
        this.bg = new Array(PIPE_NUM);
        for (var b = 0; b < 3; b++) {
            this.bg[b] = bg("bg").addChildTo(this);
        }
        this.bg[1].setPosition(1290, 400);
        this.bg[0].setPosition(0, 400);

        // assets で指定したキーを指定することで画像を表示
        this.player = player("player").addChildTo(this);
        this.player.setPosition(SCREEN_CENTER_X * 3 / 5, 757).setScale(-0.7, 0.7);

        // pipe
        this.downPipe = new Array(PIPE_NUM);
        for (var i = 0; i < PIPE_NUM; i++) {
            this.downPipe[i] = downPipe("pipe", SCREEN_CENTER_Y).addChildTo(this);
        }

        // PIPE
        this.PIPE = new Array(PIPE_NUM);
        for (var k = 0; k < PIPE_NUM; k++) {
            this.PIPE[k] = pipe("PIPE", SCREEN_CENTER_Y).addChildTo(this);
        }

        // 地面表示
        this.ground = ground("ground", SCREEN_CENTER_X, SCREEN_HEIGHT + 400 - GROUND_HEIGHT).addChildTo(this);
        this.ground.setScale(1, 1);

        // ラベル表示
        this.fromJSON(UI_DATA.LABELS);
    },

    update: function (app) {
        // キーボード
        var key = app.keyboard;
        // マウスクリック
        var pointing = app.mouse;

        // 左矢印キーを押しているかを判定
        if (key.getKey("left")) {
            // 移動
            this.player.x -= 8;
            // 向き調整
            this.player.scaleX = 0.8;
        }
        // 右矢印キーを押しているかを判定
        if (key.getKey("right")) {
            // 移動
            this.player.x += 8;
            // 向き調整
            this.player.scaleX = -0.8;
        }

        // タッチしているかを判定
        if (key.getKey("up") || app.pointing.getPointing() == true) {
            if (this.lives) {
                this.move = true;
                this.bg[0].move = true;
                this.bg[1].move = true;
                this.bg[2].move = true;
            }
            if (this.move) {
                if (this.player.y > 0) this.dy = -5;
            }
        }

        if (this.move) {
            // カウンターインクリメント
            this.counter++;
            SCORE++;
            this.limitTimeLabel.text = "SCORE:" + SCORE;

            // キャラ上下
            this.player.y += this.dy;

            // 上昇と下降で傾き変更
            if (this.dy < 1) {
                this.player.rotation = -30;
            } else if (this.dy > 1) {
                this.player.rotation = 30;
            } else {
                this.player.rotation = 0;
            }

            // パイプを設置する
            var w = (PIPE_WIDTH + SPACE_WIDTH) / SCROLL_SPEAD;
            for (var m = 0; m < PIPE_NUM; m++) {
                var pt = (this.counter - w * m) % (w * PIPE_NUM);
                if (pt === 0) {
                    var py = SPACE_HEIGHT + (PIPE_HEIGHT - SPACE_HEIGHT) * Math.random();
                    this.downPipe[m].reset(py).play();
                    this.PIPE[m].reset(py).play();
                }
            }

            // 上のパイプを設置する
            var c = (PIPE_WIDTH + SPACE_WIDTH) / SCROLL_SPEAD;
            for (var n = 0; n < PIPE_NUM; n++) {
                var ct = (this.counter - c * n) % (c * PIPE_NUM);
                if (ct === 0) {
                    var cy = SPACE_HEIGHT + (PIPE_HEIGHT - SPACE_HEIGHT) * Math.random();
                    this.downPipe[n].reset(cy).play();
                    this.PIPE[n].reset(cy).play();
                }
            }
        }

        // 当り判定
        for (var j = 0; j < PIPE_NUM; j++) {
            var dp = this.downPipe[j];
            if (this.player.isHitElementRect(dp)) {
                this.stop();
                this.lives = false;
            }
        }

        // 当り判定
        for (var l = 0; l < PIPE_NUM; l++) {
            var cl = this.PIPE[l];
            if (this.player.isHitElementRect(cl)) {
                this.stop();
                this.lives = false;
            }
        }

        // 落ちた判定
        if (this.player.y > SCREEN_HEIGHT - GROUND_HEIGHT) {
            this.stop();
            this.lives = false;
        } else {
            this.dy += 0.2;
        }

    },

    // stop
    stop: function (app) {
        this.move = false;
        this.lives = false;
        this.player.stop();
        this.ground.stop();
        for (var bs = 0; bs < 3; bs++) {
            this.bg[bs].stop();
        }
        for (var pipe = 0; pipe < 5; pipe++) {
            this.downPipe[pipe].stop();
            this.PIPE[pipe].stop();
        }
        //リトライ
        tm.ui.FlatButton({
            width: 360,
            height: 180,
            text: "RETRY",
            bgColor: "#ff8c00",
            fontSize: 40
	        }).setFillStyle("#ff8c00").addChildTo(this).on("pointingend", function (e) {
            SCORE = 0;
            e.app.fps = FPS;
            e.app.replaceScene(mainScene());
        }).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
    }
});

/*
 * icon genchan
 */
tm.define("icon", {
    superClass: "tm.display.Sprite",

    init: function (image) {
        this.superInit(image, 100, 100);
        this.fitImage();

        this.v = tm.geom.Vector2(0, 0);
    },
    update: function (app) {
        // 下向きに移動
        this.v.y += 0.25;
        this.position.add(this.v);

        // 床にぶつかったら跳ねる
        var bottom = app.canvas.height - this.height / 2;
        if (this.y > bottom) {
            this.y = bottom;
            this.v.y *= -0.99;
        }
    }
});

/*
 * bg
 */
tm.define("bg", {
    superClass: "tm.display.Sprite",

    move: false,

    init: function (image) {
        this.superInit(image);
        this.fitImage();
        this.setPosition(2580, 400);

        this.v = tm.geom.Vector2(0, 0);
    },
    update: function (app) {
        if (this.move) {
            // 下向きに移動
            this.v.x -= SCROLL_SPEAD / 6000;
            this.position.add(this.v);
        }
        if (this.x < -1280) {
            this.setPosition(2580, 400);
        }
    },

    stop: function () {
        this.move = false;
    }
});

/*
 * player box
 */
tm.define("player", {
    superClass: "tm.display.Sprite",

    live: true,
    counter: 0,

    init: function (image) {
        this.superInit(image);
        this.fitImage();
        this.setBoundingType("rect");
    },

    update: function (app) {
        this.counter++;

        if (this.live) {
            var f = this.counter % 8;

            switch (f) {
                case 0:
                    this.rotation += this.rotation < 0 ? 5 : -5;
                    break;
                case 1:
                    app.fps += 0.01;
                    break;
                default:
                    break;
            }
        } else {
            this.rotation = 80;

            if (760 < this.y) {
                this.y = 760;
            }
        }
    },

    play: function () {
        this.live = true;
        return this;
    },

    stop: function () {
        if (this.live) {
            this.setImage('player_off');
        }
        this.live = false;
        return this;
    }

});

/*
 * ground
 */
tm.define("ground", {
    superClass: "tm.display.Sprite",

    posX: 0,
    posY: 0,
    dx: 0,

    move: false,

    init: function (image, x, y) {
        this.posX = x;
        this.posY = y;

        this.superInit(image);
        this.setPosition(this.posX, this.posY);

        this.move = true;
    },

    update: function () {
        if (this.move) {
            this.dx -= 2;
            if (this.dx < -100) this.dx = 0;
            this.setPosition(this.posX + this.dx, this.posY);
        }
    },

    stop: function () {
        this.move = false;
    },
    play: function () {
        this.move = true;
    }
});

/*
 * down pipe
 */
tm.define("downPipe", {
    superClass: "tm.display.Sprite",

    posX: START_X,
    posY: SCREEN_CENTER_Y,
    dx: SCROLL_SPEAD,

    move: false,

    init: function (image, y) {
        this.posY = y + (PIPE_HEIGHT + SPACE_HEIGHT) / 2;
        this.setBoundingType("rect");

        this.superInit(image);
        this.setPosition(this.posX, this.posY).setScale(1.0, 1.1);

    },

    update: function () {
        if (this.move && (this.posX > -PIPE_WIDTH / 2)) {
            this.posX -= SCROLL_SPEAD;
            this.setPosition(this.posX, this.posY);
        }
    },

    reset: function (y) {
        this.posX = START_X;
        this.posY = y + (PIPE_HEIGHT + SPACE_HEIGHT) / 2;

        this.setPosition(this.posX, this.posY);

        return this;
    },

    stop: function () {
        this.move = false;
    },

    play: function () {
        this.move = true;
    }
});

/*
 * PIPE
 */
tm.define("pipe", {
    superClass: "tm.display.Sprite",

    posX: START_X,
    posY: SCREEN_CENTER_Y,
    dx: SCROLL_SPEAD,

    move: false,

    init: function (image, y) {
        this.posY = y - (PIPE_HEIGHT + SPACE_HEIGHT) / 2;
        this.setBoundingType("rect");

        this.superInit(image);
        this.setPosition(this.posX, this.posY).setScale(1.0, -1.1);

    },

    update: function () {
        if (this.move && (this.posX > -PIPE_WIDTH / 2)) {
            this.posX -= SCROLL_SPEAD;
            this.setPosition(this.posX, this.posY);
        }
    },

    reset: function (y) {
        this.posX = START_X;
        this.posY = y - (PIPE_HEIGHT + SPACE_HEIGHT) / 2;

        this.setPosition(this.posX, this.posY);

        return this;
    },

    stop: function () {
        this.move = false;
    },

    play: function () {
        this.move = true;
    }
});