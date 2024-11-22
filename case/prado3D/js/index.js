/**
 * Created by zhulinhai on 17/12/7.
 */
"use strict";

const SCALE_RATE = 0.3, OFFSET_Y = -45;
var camera, orbitControls, frontLeft, frontRight, backLeft, backRight, doorLeft, scene, renderer, torusObject, light, topLight, backLight, ambientLight;
var textureLoader, mtlLoader, material, hotspot;
var render_stats, controls;
var manager, onProgress, onError;
var isRunning = false, ground, lensFlare, tireTween;
var cameraPos = {posX:0, posY: 0,posZ: 150}; //{posX:-10, posY: 0,posZ: 0};//
var lookAtPos = {posX:0, posY: 0,posZ: 0}; //{posX:-10, posY: 0,posZ: 0};//
var textureCube;

function initScene() {

    scene = new THREE.Scene({reportSize: 10, fixedTimeStep: 1 / 60});
    scene.fog = new THREE.Fog(0xf1f1f1, 1, 1000);

    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('3dCanvas'), antialias:true, precision:"highp", alpha:true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;

    // 添加相机
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set(cameraPos.posY,cameraPos.posY,cameraPos.posZ);//相机位置
    camera.lookAt(0,0,0);

    manager = new THREE.LoadingManager();
    manager.onProgress = function( item, loaded, total ) {
        var percentComplete = loaded / total * 100;
        document.getElementById('loading-percent').innerHTML = parseInt(percentComplete) + '%';
        if (percentComplete === 100) {
            document.getElementById('loadingDialog').style.display = 'none';
            orbitControls.autoRotate = true;
        }
    };


    onProgress = function( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            // console.log( Math.round( percentComplete  , 2 ) + '% downloaded' );
        }
    };

    onError = function( xhr ) {
        console.error( xhr );
    };

    THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

    textureLoader = new THREE.TextureLoader(manager);
    mtlLoader = new THREE.MTLLoader(manager);
    mtlLoader.setPath('src/car/');


    createLights();
    createGroundPlane();
    createTorus();
    createCar();
    createCircle();
    createControls();
    bindClicks();
    render();
}

function createLights() {
    // 添加环境光
    var ambientColor = '#c1c1c1';
    ambientLight = new THREE.AmbientLight(ambientColor);
    scene.add(ambientLight);

    createTopLight();
    createSunLight();
    createBottomLight();
    createLensFlare();
}

// 添加点光源
function createSunLight() {
    light = new THREE.DirectionalLight(0xFFFFFF, 1.0, 1000); //0xFF0000
    light.position.set(-500, 500, 1000);
    scene.add(light);
}

// 添加顶部光源
function createTopLight() {
    topLight = new THREE.PointLight(0xFFFFFF, 1.0, 1000); //0xFF0000
    topLight.position.set(0, 500, 0);
    topLight.castShadow = true;
    topLight.shadow.camera.near = 2;
    topLight.shadow.camera.far = 600;
    topLight.shadow.camera.fov = 30;
    scene.add(topLight);
}

// 添加尾部光源
function createBottomLight() {
    backLight = new THREE.PointLight(0xFFFFFF, 1.0, 1000); //0xFF0000
    backLight.position.set(100, 100, 100);
    scene.add(backLight);
}

// 添加眩光
function createLensFlare() {
    var textureFlare = textureLoader.load('textures/lensflare/sun_white.png');
    var textureFlare0 = textureLoader.load('textures/lensflare/Flare_Pentagone.png');
    var flareColor = new THREE.Color(0xffffff);
    lensFlare = new THREE.LensFlare(textureFlare, 500, 0.0, THREE.AdditiveBlending, flareColor);
    lensFlare.add(textureFlare0, 60,0.6, THREE.AdditiveBlending);
    lensFlare.add(textureFlare0, 70,0.7, THREE.AdditiveBlending);
    lensFlare.add(textureFlare0, 120,0.9, THREE.AdditiveBlending);
    lensFlare.add(textureFlare0, 70, 1, THREE.AdditiveBlending);
    lensFlare.position.copy(light.position);
    scene.add(lensFlare);
}

// 添加控制器
function createControls() {
    orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
    orbitControls.enableZoom = false;
    orbitControls.target.set(0,0,0);
    orbitControls.autoRotate = false;
    orbitControls.maxPolarAngle = Math.PI /2; //限制最大拖动角度
    orbitControls.enabled = true;

}

// 添加地面
function createGroundPlane() {
    textureLoader.load( 'src/box/floor.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 50, 50 );
        texture.anisotropy = 1;

        // 创建平面的骨架
        var planeGeometry = new THREE.PlaneGeometry(10000,10000, 1,1);
        // 创建平面的材料
        var planeMaterial = new THREE.MeshBasicMaterial({map:texture, transparent : true});
        // 合成平面
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);

        // 设置平面的位置
        plane.position.x = 0;
        plane.position.y = OFFSET_Y;
        plane.position.z = 0;
        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;

        // 在场景中添加平面
        scene.add(plane);
        ground = plane;
    });
}

// 添加圆环
function createCircle() {
    // 添加圆环
    textureLoader.load( 'src/hotspot.png', function ( texture ) {
        // 创建平面的骨架
        var circleGeometry = new THREE.CircleGeometry(3,20);
        // 创建平面的材料
        var circleMaterial = new THREE.MeshBasicMaterial({map:texture, transparent : true});
        // 合成平面
        var plane = new THREE.Mesh(circleGeometry, circleMaterial);

        // 设置平面的位置
        plane.position.x = 30;
        plane.position.y = -13;
        plane.position.z = 10;
        plane.rotation.y = Math.PI/2;
        // 在场景中添加平面
        scene.add(plane);
        hotspot = plane;
    });
}

//创建隧道
function createTorus() {
    var materialMap = textureLoader.load('textures/env/pattern.png');
    materialMap.wrapS = materialMap.wrapT = THREE.RepeatWrapping;
    materialMap.repeat.set( 30, 30 );
    materialMap.anisotropy = 8;

    var torusMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, map: materialMap, side: THREE.DoubleSide, transparent: true } );
    torusObject = new THREE.Mesh( new THREE.TorusGeometry( 1000, 500, 60, 30, Math.PI/2 ), torusMaterial );
    torusObject.position.set( -1000, 0, 500 );
    torusObject.rotation.x = -Math.PI/2;
    scene.add( torusObject );
}

function importDoorLeft() {

    mtlLoader.setPath( 'src/car/' );
    mtlLoader.load( 'chemen.mtl', function( materials ) {

        materials.preload();

        var objLoader = new THREE.OBJLoader( manager );
        objLoader.setPath( 'src/car/' );
        objLoader.setMaterials( materials );
        objLoader.load('chemen.obj', function (object) {

            object.traverse(function (child) {

                console.log(child);

                if (child instanceof THREE.Mesh) {
                    if (child.name === 'mirror_2') {
                        child.material = getGlassMaterial();
                    } else {
                        setCarBodyMaterial(child);
                    }
                }

            });


            var rate = SCALE_RATE / 0.3;
            var posX = 26.7 * rate, posY = 32 * rate, posZ = 20.15 * rate;
            object.position.set( posX, posY, posZ * 2);
            object.wireframe = true;
            addObjectToScene(object);

            doorLeft = object;
        }, onProgress, onError);
    });
}

function importTire() {
    mtlLoader.setPath( 'src/car/' );
    mtlLoader.load( 'chelun.mtl', function( materials ) {

        materials.preload();

        var objLoader = new THREE.OBJLoader( manager );
        objLoader.setPath( 'src/car/' );
        objLoader.setMaterials( materials );
        objLoader.load( 'chelun.obj', function ( object ) {

            var rate = SCALE_RATE / 0.3;
            var posX = 25 * rate, posY = 12 * rate, posZ = 28 * rate;
            frontLeft = createWheelWithPos(object, new THREE.Vector3(posX, posY, posZ * 2), false);
            backLeft = createWheelWithPos(object, new THREE.Vector3(posX, posY, -posZ), false);
            frontRight = createWheelWithPos(object, new THREE.Vector3(-posX, posY, posZ * 2), true);
            backRight = createWheelWithPos(object, new THREE.Vector3(-posX, posY, -posZ), true);

        }, onProgress, onError );

    });

}

function importPrado() {

    mtlLoader.load( 'cheshen.mtl', function( materials ) {

        materials.preload();

        var objLoader = new THREE.OBJLoader( manager );
        objLoader.setPath( 'src/car/' );
        objLoader.setMaterials( materials );
        objLoader.load('cheshen.obj', function (object) {

            object.traverse(function (child) {

                if (child instanceof THREE.Mesh){
                    if (child.name === 'mirror_qian' || child.name === 'mirror_houchemen' || child.name === 'mirror_1' || child.name === 'mirror_top') {

                        child.material = getGlassMaterial();

                    } else if (child.name === 'cheshen' || child.name === 'qianchemen' || child.name === 'houchemen') {
                        setCarBodyMaterial(child);
                    }  else  {
                        setMetallicMaterial(child);
                    }
                }
            });

            addObjectToScene(object);
        }, onProgress, onError);
    });
}

function createCar() {
    importDoorLeft();
    importPrado();
    importTire();
}

function render() {
    camera.lookAt(new THREE.Vector3(lookAtPos.posX, lookAtPos.posY, lookAtPos.posZ));
    //
    // render_stats.update();
    if (isRunning) {
        playGround();
    }

    orbitControls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render( scene, camera );
    TWEEN.update();

    requestAnimationFrame( render );
}

// 创建玻璃材质
function getGlassMaterial() {
    return new THREE.MeshBasicMaterial( { color: 0x223344, envMap: textureCube, opacity: 0.25, transparent: true, combine: THREE.MixOperation, reflectivity: 0.25 } );
}

// 创建反光材质
function setCarBodyMaterial(body) {
    var mat = new THREE.MeshPhongMaterial({color: 0x777777, envMap: textureCube, shininess: 50, combine: THREE.MixOperation, reflectivity: 0.25});
    mat.map = body.material.map;
    mat.bumpMap = body.material.bumpMap;
    mat.bumpScale = body.material.bumpScale;
    body.material = mat;
}

// 创建金属材质
function setMetallicMaterial(child) {
    var mat = new THREE.MeshPhongMaterial({color: 0x777777, shininess: 50});
    mat.map = child.material.map;
    mat.bumpMap = child.material.bumpMap;
    mat.bumpScale = child.material.bumpScale;
    child.material = mat;
}


//创建ShaderMaterial纹理的函数
function createMaterial(vertexShader, fragmentShader) {
    var vertShader = document.getElementById(vertexShader).innerHTML; //获取顶点着色器的代码
    var fragShader = document.getElementById(fragmentShader).innerHTML; //获取片元着色器的代码

    //配置着色器里面的attribute变量的值
    var attributes = {};
    //配置着色器里面的uniform变量的值
    var uniforms = {
        time: {type: 'f', value: 0.2},
        scale: {type: 'f', value: 0.2},
        alpha: {type: 'f', value: 0.6},
        resolution: {type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
    };

    var meshMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        defaultAttributeValues : attributes,
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true

    });


    return meshMaterial;
}

// 创建着色器材质
function getShaderMaterial() {
    var material=new THREE.ShaderMaterial({
        attributes: {
            vertex_position: light.position
        },
        uniforms: {

            color: {
                type: 'v3', // 指定变量类型为三维向量
                value: new THREE.Color('#000') // 要传递给着色器的颜色值
            },
            light: {
                type: 'v3',
                value: light.position // 光源位置
            },
            vertexOpacity: {
                type: 'f',
                value: 0.3
            }

        },
        //加载顶点着色器程序
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,

        //加载片元着色器程序
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        transparent:true

    });//着色器材质对象

    return material;
}

// 创建车轮
function createWheelWithPos(obj, pos, mirror) {
    var object = obj.clone();
    object.position.copy(pos);
    if (mirror) {
        object.rotation.y = Math.PI;
    }

    object.traverse(function (child) {
        if (child instanceof THREE.Mesh){
            setMetallicMaterial(child);
        }
    });

    addObjectToScene(object);
    return object;
}

// 增加模型至场景
function addObjectToScene(object) {
    object.scale.set(SCALE_RATE, SCALE_RATE, SCALE_RATE);
    object.position.y += OFFSET_Y;
    scene.add( object );
}

// 进入车子动画
function enterCarAnimation() {
    TWEEN.removeAll();
    isRunning = false;
    document.getElementById('btnEnterCar').style.display = 'none';
    document.getElementById('btnEngine').style.display = 'none';

    var cameraPos = camera.position;
    var position = { posX: cameraPos.x, posY: cameraPos.y, posZ: cameraPos.z};
    var distPos = {posX: 80, posY: 0, posZ: -10};
    var tweenA = new TWEEN.Tween(position);
    tweenA.to(distPos, 1000);
    tweenA.easing(TWEEN.Easing.Quadratic.In);
    tweenA.onStart(function () {
        lookAtPos = distPos;
        scene.remove(hotspot);
        scene.remove(lensFlare);
        orbitControls.enabled = false;
        orbitControls.autoRotate = false;
        orbitControls.target.set(11,0,11);
    });
    tweenA.onUpdate(function() {
        camera.position.set(this.posX, this.posY, this.posZ);
    });
    tweenA.onComplete(function () {
        playDoorAnimation(true);
    });

    var tweenB = new TWEEN.Tween(distPos);
    tweenB.delay(1000);
    tweenB.to({posX: 10, posY: 0, posZ: 10}, 1000);
    tweenB.easing(TWEEN.Easing.Linear.None);
    tweenB.onUpdate(function() {
        camera.position.set(this.posX, this.posY, this.posZ);
    });
    tweenB.onComplete(function () {
        orbitControls.enabled = true;
        orbitControls.autoRotate = true;
        orbitControls.maxPolarAngle = Math.PI;
        playDoorAnimation(false);

        setTimeout(function () {
            document.getElementById('btnLeaveCar').style.display = 'block';
        }, 1500);
    });

    tweenA.chain(tweenB);
    tweenA.start();

}

// 离开车子动画
function leaveCarAnimation() {
    document.getElementById('btnLeaveCar').style.display = 'none';
    playDoorAnimation(true);

    var distPos = {posX: 80, posY: 0, posZ: -10};
    var tweenA = new TWEEN.Tween({posX: 10, posY: 0, posZ: 10});
    tweenA.delay(1000);
    tweenA.to(distPos, 1000);
    tweenA.easing(TWEEN.Easing.Linear.None);
    tweenA.onUpdate(function() {
        camera.position.set(this.posX, this.posY, this.posZ);
    });
    tweenA.onComplete(updateOrbitTarget);

    var tweenB = new TWEEN.Tween(distPos);
    tweenB.to({posX: 143,posY: 9,posZ: -45}, 1000);
    tweenB.easing(TWEEN.Easing.Linear.None);
    tweenB.onUpdate(function() {
        camera.position.set(this.posX, this.posY, this.posZ);
    });
    tweenB.onComplete(function () {
        playDoorAnimation(false);
        setTimeout(function () {
            lookAtPos = {posX: 0, posY: 0, posZ: 0};
            scene.add(hotspot);
            scene.add(lensFlare);
            orbitControls.enabled = true;
            orbitControls.maxPolarAngle = Math.PI/2;

            document.getElementById('btnEnterCar').style.display = 'block';
            document.getElementById('btnEngine').style.display = 'block';
        }, 1500);
    });

    tweenA.chain(tweenB);
    tweenA.start();
}

function updateOrbitTarget() {
    var tweenA = new TWEEN.Tween({posX: 11, posY: 0, posZ: 11});
    tweenA.to({posX: 0, posY: 0, posZ: 0}, 1000);
    tweenA.easing(TWEEN.Easing.Linear.None);
    tweenA.onUpdate(function() {
        orbitControls.target.set(this.posX, this.posY, this.posZ);
    });
    tweenA.start();
}

// 打开/关闭车门
function playDoorAnimation(open) {
    var targetDeg = open?-Math.PI/3: 0;
    console.log(targetDeg);
    var tweenA = new TWEEN.Tween({deg: doorLeft.rotation.y});
    tweenA.easing(TWEEN.Easing.Quadratic.In);
    tweenA.to({deg: targetDeg}, 1000);
    tweenA.onUpdate(function() {
        doorLeft.rotation.y = this.deg;
    });
    tweenA.start();
}

// 开始轮胎动画
function startTireAnimation() {
    TWEEN.removeAll();

    var position = { deg : 0 };
    tireTween = new TWEEN.Tween(position).to({deg: -360}, 1000);
    tireTween.onUpdate(function(){
        frontLeft.rotation.x = this.deg;
        frontRight.rotation.x = this.deg;
        backLeft.rotation.x = this.deg;
        backRight.rotation.x = this.deg;
    });
    tireTween.repeat(Infinity);
    tireTween.start();
}

// 结束轮胎动画
function stopTireAnimation() {
    tireTween.stop();
}

// 场地滚动
function playGround() {
    ground.position.z -= 10;
    if (Math.abs(ground.position.z) >= 3500 ) {
        ground.position.z = 0;
    }
}

function bindClicks() {
    var raycaster = new THREE.Raycaster();//光线投射，用于确定鼠标点击位置
    var mouse = new THREE.Vector2();//创建二维平面
    window.addEventListener("mousedown",mousedown);//页面绑定鼠标点击事件
    //点击方法
    function mousedown(e){
        //将html坐标系转化为webgl坐标系，并确定鼠标点击位置
        mouse.x =  e.clientX / renderer.domElement.clientWidth*2-1;
        mouse.y =  -(e.clientY / renderer.domElement.clientHeight*2)+1;
        //以camera为z坐标，确定所点击物体的3D空间位置
        raycaster.setFromCamera(mouse,camera);
        //确定所点击位置上的物体数量
        var intersects = raycaster.intersectObjects(scene.children);

        //选中后进行的操作
        if(intersects.length > 0){
            if (intersects[ 0 ].object === hotspot) {
                enterCarAnimation();
            }
        }
    }

    document.getElementById('btnEngine').addEventListener('click', function () {
        if (isRunning) {
            isRunning = false;
            stopTireAnimation();
            scene.add(hotspot);
            document.getElementById('btnEnterCar').style.display  = 'block';

        } else {
            isRunning = true;
            startTireAnimation();
            scene.remove(hotspot);
            document.getElementById('btnEnterCar').style.display  = 'none';
        }

    });

    document.getElementById('btnEnterCar').addEventListener('click', enterCarAnimation);
    document.getElementById('btnLeaveCar').addEventListener('click', leaveCarAnimation);
}
initScene();

//rem设置
(function(doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function() {
            var clientWidth = docEl.clientWidth;
            if (!clientWidth) return;
            docEl.style.fontSize = 20 * Math.min( clientWidth / 375, 1)  + 'px';
        };
    win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);