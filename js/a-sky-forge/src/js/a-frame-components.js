if(typeof exports !== 'undefined') {
  const dynamicSkyEntityMethodsExports = require('./a-dynamic-sky-entity-methods.js');
  const aSkyInterpolationMethodExports = require('./a-sky-interpolation-methods.js');
  const aSkyForgeMethodExports = require('./a-sky-forge.js')
  //Give this global scope by leaving off the var
  dynamicSkyEntityMethods = dynamicSkyEntityMethodsExports.dynamicSkyEntityMethods;
  aSkyInterpolator = aSkyInterpolationMethodExports.aSkyInterpolator;
  aDynamicSky = aSkyForgeMethodExports.aDynamicSky;
}

// The mesh mixin provides common material properties for creating mesh-based primitives.
// This makes the material component a default component and maps all the base material properties.
var meshMixin = AFRAME.primitives.getMeshMixin();

//Create primitive data associated with this, based off a-sky
//https://github.com/aframevr/aframe/blob/master/src/extras/primitives/primitives/a-sky.js
AFRAME.registerPrimitive('a-sky-forge', AFRAME.utils.extendDeep({}, meshMixin, {
    // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
    defaultComponents: {
      geometry: {
        primitive: 'sphere',
        radius: 5000,
        segmentsWidth: 64,
        segmentsHeight: 32
      },
      scale: '-1, 1, 1',
      "geo-coordinates": 'lat: 37.7749; long: -122.4194',
      "sky-params": 'luminance: 1.0; turbidity: 2.0; rayleigh: 1.0; mieCoefficient: 0.005; mieDirectionalG: 0.8;',
      "sky-time": `timeOffset: ${Math.round(dynamicSkyEntityMethods.getSecondOfDay())}; utcOffset: 0; timeMultiplier: 1.0; dayOfTheYear: ${Math.round(dynamicSkyEntityMethods.getDayOfTheYear())}; year: ${Math.round(dynamicSkyEntityMethods.getYear())}`
    }
  }
));

//Register associated components
AFRAME.registerComponent('geo-coordinates', {
  schema: {
    lat: {type: 'number', default: 37.7749},
    long: {type: 'number', default: -122.4194}
  }
});

var skyParamsUniformsData = {};
AFRAME.registerComponent('sky-params', {
  dependencies: ['a-sky-forge'],
  schema:{
    luminance: { type: 'number', default: 1.0, max: 2.0, min: 0.0, is: 'uniform' },
    turbidity: { type: 'number', default: 2.0, max: 20.0, min: 0.0, is: 'uniform' },
    rayleigh: { type: 'number', default: 1.0, max: 4.0, min: 0.0, is: 'uniform' },
    mieCoefficient: { type: 'number', default: 0.005, min: 0.0, max: 0.1, is: 'uniform' },
    mieDirectionalG: { type: 'number', default: 0.8, min: 0.0, max: 1, is: 'uniform' }
  },

  init: function(){
    this.material = this.el.getOrCreateObject3D('mesh').material = skyShaderMaterial;
    skyParamsUniformsData.turbidity = this.data.turbidity;
    skyParamsUniformsData.rayleigh = this.data.rayleigh;
    skyShaderMaterial.uniforms['rayleigh'].value = this.data.rayleigh;
    skyParamsUniformsData.mieCoefficient = this.data.mieCoefficient;
    moonShaderMaterial.uniforms['luminance'].value = this.data.luminance;
    skyShaderMaterial.uniforms['luminance'].value = this.data.luminance;
    moonShaderMaterial.uniforms['mieDirectionalG'].value = this.data.mieDirectionalG;
    skyShaderMaterial.uniforms['mieDirectionalG'].value = this.data.mieDirectionalG;
  }
});

AFRAME.registerComponent('sky-time', {
  fractionalSeconds: 0,
  moon: null,
  dependencies: ['geo-coordinates', 'a-sky-forge'],
  schema: {
    timeOffset: {type: 'number', default: dynamicSkyEntityMethods.getSecondOfDay()},
    timeMultiplier: {type: 'number', default: 1.0},
    utcOffset: {type: 'int', default: 0},
    dayOfTheYear: {type: 'int', default: Math.round(dynamicSkyEntityMethods.getDayOfTheYear())},
    month: {type: 'int', default: -1},
    day: {type: 'int', default: -1},
    year: {type: 'int', default: Math.round(dynamicSkyEntityMethods.getYear())},
    imgDir: {type: 'string', default: '../images/'},
    moonTexture: {type: 'map', default: 'moon-tex-1024.png'},
    moonNormalMap: {type: 'map', default: 'moon-nor-1024.png'},
    starMask: {type: 'map', default:'padded-starry-sub-data-0.png'},
    starRas: {type: 'map', default:'padded-starry-sub-data-1.png'},
    starDecs: {type: 'map', default:'padded-starry-sub-data-2.png'},
    starMags: {type: 'map', default:'padded-starry-sub-data-3.png'},
    starColors: {type: 'map', default:'padded-starry-sub-data-4.png'},
  },

  init: function(){
    if(this.data.month != -1 && this.data.day != -1){
      this.data.dayOfTheYear = dynamicSkyEntityMethods.getDayOfTheYearFromYMD(this.data.year, this.data.month, this.data.day);
    }

    this.lastCameraDirection = {x: 0.0, y: 0.0, z: 0.0};
    this.dynamicSkyObj = aDynamicSky;
    this.dynamicSkyObj.latitude = this.el.components['geo-coordinates'].data.lat;
    this.dynamicSkyObj.longitude = this.el.components['geo-coordinates'].data.long;
    this.dynamicSkyObj.update(this.data);

    //Load our normal maps for the moon
    let textureLoader = new THREE.TextureLoader();
    let moonTextureDir = this.data.imgDir + this.data.moonTexture;
    let moonNormalMapDir = this.data.imgDir + this.data.moonNormalMap;
    let skyDomeRadius = this.el.components.geometry.data.radius;
    let sceneRef = this.el.sceneEl.object3D;
    this.moon = new Moon(moonTextureDir, moonNormalMapDir, skyDomeRadius, sceneRef, textureLoader);

    //Populate this data into an array because we're about to do some awesome stuff
    //to each texture with Three JS.
    //Note that,
    //We use a nearest mag and min filter to avoid fuzzy pixels, which kill good data
    //We use repeat wrapping on wrap s, to horizontally flip to the other side of the image along RA
    //And we use mirrored mapping on wrap w to just reflect back, although internally we will want to subtract 0.5 from this.
    //we also use needs update to make all this work as per, https://codepen.io/SereznoKot/pen/vNjJWd
    var starMask = textureLoader.load(this.data.imgDir + this.data.starMask, function(starMask){
      starMask.magFilter = THREE.NearestFilter;
      starMask.minFilter = THREE.NearestFilter;
      starMask.wrapS = THREE.RepeatWrapping;
      starMask.wrapW = THREE.MirroredRepeatWrapping;
      starMask.needsUpdate = true;
    });

    var starRas = textureLoader.load(this.data.imgDir + this.data.starRas, function(starRas){
      starRas.magFilter = THREE.NearestFilter;
      starRas.minFilter = THREE.NearestFilter;
      starRas.wrapS = THREE.RepeatWrapping;
      starRas.wrapW = THREE.MirroredRepeatWrapping;
      starRas.needsUpdate = true;
    });

    var starDecs = textureLoader.load(this.data.imgDir + this.data.starDecs, function(starDecs){
      starDecs.magFilter = THREE.NearestFilter;
      starDecs.minFilter = THREE.NearestFilter;
      starDecs.wrapS = THREE.RepeatWrapping;
      starDecs.wrapW = THREE.MirroredRepeatWrapping;
      starDecs.needsUpdate = true;
    });

    var starMags = textureLoader.load(this.data.imgDir + this.data.starMags, function(starMags){
      starMags.magFilter = THREE.NearestFilter;
      starMags.minFilter = THREE.NearestFilter;
      starMags.wrapS = THREE.RepeatWrapping;
      starMags.wrapW = THREE.MirroredRepeatWrapping;
      starMags.needsUpdate = true;
    });

    var starColors = textureLoader.load(this.data.imgDir + this.data.starColors, function(){
      starColors.magFilter = THREE.NearestFilter;
      starColors.minFilter = THREE.NearestFilter;
      starColors.wrapS = THREE.RepeatWrapping;
      starColors.wrapW = THREE.MirroredRepeatWrapping;
      starColors.needsUpdate = true;
    });

    //We only load our textures once upon initialization
    skyShaderMaterial.uniforms['starMask'].value = starMask;
    skyShaderMaterial.uniforms['starRas'].value = starMask;
    skyShaderMaterial.uniforms['starDecs'].value = starMask;
    skyShaderMaterial.uniforms['starMags'].value = starMask;
    skyShaderMaterial.uniforms['starColors'].value = starMask;

    //Hook up our interpolator and set the various uniforms we wish to track and
    //interpolate during each frame.
    this.currentTime = dynamicSkyEntityMethods.getNowFromData(this.data);
    this.initializationTime = new Date(this.currentTime.getTime());
    //Update at most, once a second (if more than five minutes normal time pass in that second)
    if(this.data.timeMultiplier != 0.0){
      this.hasLinearInterpolation = true;
      var interpolationLengthInSeconds = 300.0 > this.data.timeMultiplier ? 300.0 / this.data.timeMultiplier : 1.0;

      this.interpolator = new aSkyInterpolator(this.initializationTime, this.data.timeMultiplier, interpolationLengthInSeconds, this.dynamicSkyObj, this.data);

      //All of our interpolation hookups occur here
      this.interpolator.setLinearInterpolationForScalar('sunAzimuth', ['sunPosition', 'azimuth'], false,);
      this.interpolator.setLinearInterpolationForScalar('sunAltitude', ['sunPosition', 'altitude'], false);
      this.interpolator.setAngularLinearInterpolationForScalar('localSiderealTime', ['localApparentSiderealTimeForUniform'], false);

      this.interpolator.setLinearInterpolationForScalar('moonAzimuth', ['moonPosition', 'azimuth'], false,);
      this.interpolator.setLinearInterpolationForScalar('moonAltitude', ['moonPosition', 'altitude'], false);
      this.interpolator.setLinearInterpolationForScalar('moonEE', ['moonEE'], false);

      this.interpolator.setSLERPFor3Vect('sunXYZPosition', ['sunXYZPosition'], false);
      this.interpolator.setSLERPFor3Vect('moonXYZPosition', ['moonXYZPosition'], false);

      //Once all of these are set up - prime the buffer the first time.
      this.interpolator.primeBuffer();
    }
    else{
      this.hasLinearInterpolation = false;
    }
  },

  update: function () {
    this.fractionalSeconds = 0;
  },

  tick: function (time, timeDelta) {
    //Standard Sky Animations
    skyShaderMaterial.uniforms['uTime'].value = time;

    //Interpolated Sky Position Values
    if(this.hasLinearInterpolation){
      this.currentTime.setTime(this.initializationTime.getTime() + time * this.data.timeMultiplier);

      let interpolatedValues = this.interpolator.getValues(this.currentTime);
      skyShaderMaterial.uniforms['localSiderealTime'].value = interpolatedValues.localSiderealTime;

      //Hopefully SLERP is my answer for avoiding moon novas in the middle of the night
      let sXYZ = interpolatedValues.sunXYZPosition;
      let mXYZ = interpolatedValues.moonXYZPosition;

      //
      //update our uniforms
      //
      let rayleigh = skyParamsUniformsData.rayleigh;
      let mieCoefficient = skyParamsUniformsData.mieCoefficient;
      let sunFade = 1.0 - Math.min(Math.max(1.0 - Math.exp(sXYZ.z), 0.0), 1.0);
      let moonFade = 1.0 - Math.min(Math.max(1.0 - Math.exp(mXYZ.z), 0.0), 1.0);
      moonShaderMaterial.uniforms['sunFade'].value = sunFade;
      skyShaderMaterial.uniforms['sunFade'].value = sunFade;
      moonShaderMaterial.uniforms['moonFade'].value = moonFade;
      skyShaderMaterial.uniforms['moonFade'].value = moonFade;
      moonShaderMaterial.uniforms['rayleighCoefficientOfSun'].value = rayleigh + sunFade - 1.0;
      skyShaderMaterial.uniforms['rayleighCoefficientOfSun'].value = moonShaderMaterial.uniforms['rayleighCoefficientOfSun'].value;
      moonShaderMaterial.uniforms['rayleighCoefficientOfMoon'].value = rayleigh + moonFade - 1.0;
      skyShaderMaterial.uniforms['rayleighCoefficientOfMoon'].value = moonShaderMaterial.uniforms['rayleighCoefficientOfMoon'].value;

      //
      //Calculate Total Mie
      //
      const lambda = new THREE.Vector3(680e-9, 550e-9, 450e-9);
      const k = new THREE.Vector3(0.686, 0.678, 0.666);
      const piTimes2 = 2.0 * Math.PI;
      let c = (0.2 * skyParamsUniformsData.turbidty) * 10.0e-18;
      let totalMie = new THREE.Vector3(piTimes2, piTimes2, piTimes2);
      totalMie.divide(lambda);
      totalMie.multiply(totalMie); // raise to the power of v - 2.0 where v is 4.0, so square it
      totalMie.multiply(k).multiplyScalar(0.434 * c * Math.PI);

      moonShaderMaterial.uniforms['betaM'].value = totalMie.multiplyScalar(mieCoefficient);
      skyShaderMaterial.uniforms['betaM'].value = moonShaderMaterial.uniforms['betaM'].value;
      const up = new THREE.Vector3(0.0, 1.0, 0.0);
      let dotOfMoonDirectionAndUp = mXYZ.dot(up);
      let dotOfSunDirectionAndUp = sXYZ.dot(up);
      let cutoffAngle = Math.PI / 1.95;
      let steepness = 1.5;
      moonShaderMaterial.uniforms['moonE'].value = interpolatedValues.moonEE * Math.max(0.0, 1.0 - Math.exp(-((cutoffAngle - Math.acos(dotOfMoonDirectionAndUp))/steepness)));
      skyShaderMaterial.uniforms['moonE'].value = moonShaderMaterial.uniforms['moonE'].value;
      moonShaderMaterial.uniforms['sunE'].value = 1000.0 * Math.max(0.0, 1.0 - Math.exp(-((cutoffAngle - Math.acos(dotOfSunDirectionAndUp))/steepness)));
      skyShaderMaterial.uniforms['sunE'].value = moonShaderMaterial.uniforms['sunE'].value;
      moonShaderMaterial.uniforms['linMoonCoefficient2'].value = Math.min(Math.max(Math.pow(1.0-dotOfMoonDirectionAndUp,5.0),0.0),1.0);
      skyShaderMaterial.uniforms['linMoonCoefficient2'].value = moonShaderMaterial.uniforms['linMoonCoefficient2'].value;
      moonShaderMaterial.uniforms['linSunCoefficient2'].value = Math.min(Math.max(Math.pow(1.0-dotOfSunDirectionAndUp,5.0),0.0),1.0);
      skyShaderMaterial.uniforms['linSunCoefficient2'].value = moonShaderMaterial.uniforms['linSunCoefficient2'].value;
      moonShaderMaterial.uniforms['sunXYZPosition'].value = sXYZ;
      skyShaderMaterial.uniforms['sunXYZPosition'].value = sXYZ;
      const simplifiedRayleigh = new THREE.Vector3(0.0005 / 94.0, 0.0005 / 40.0, 0.0005 / 18.0);
      moonShaderMaterial.uniforms['betaRSun'].value = simplifiedRayleigh.clone().multiplyScalar(rayleigh - (1.0 - sunFade));
      skyShaderMaterial.uniforms['betaRSun'].value = moonShaderMaterial.uniforms['betaRSun'].value;
      moonShaderMaterial.uniforms['betaRMoon'].value = simplifiedRayleigh.clone().multiplyScalar(rayleigh - (1.0 - moonFade));
      skyShaderMaterial.uniforms['betaRMoon'].value = moonShaderMaterial.uniforms['betaRMoon'].value;
      moonShaderMaterial.uniforms['moonXYZPosition'].value = mXYZ;
      skyShaderMaterial.uniforms['moonXYZPosition'].value = mXYZ;

      this.moon.update(mXYZ, sXYZ);
    }
  }
});
