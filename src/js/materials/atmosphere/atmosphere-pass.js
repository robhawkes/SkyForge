//This helps
//--------------------------v
//https://threejs.org/docs/#api/en/core/Uniform
StarrySky.Materials.Atmosphere.atmosphereShader = {
  uniforms: function(isSunShader = false, isMoonShader = false){
    let uniforms = {
      uTime: {type: 'f', value: 0.0},
      sunPosition: {type: 'vec3', value: new THREE.Vector3()},
      moonPosition: {type: 'vec3', value: new THREE.Vector3()},
      mieInscatteringSum: {type: 't', value: null},
      rayleighInscatteringSum: {type: 't', value: null},
      transmittance: {type: 't', value: null},
      toneMappingExposure: {type: 'f', value: 1.0},
      sunHorizonFade: {type: 'f', value: 1.0},
      moonHorizonFade: {type: 'f', value: 1.0}
    }

    //Pass our specific uniforms in here.
    if(isSunShader){
      uniforms.sunAngularDiameterCos = {type: 'f', value: 1.0};
      uniforms.radiusOfSunPlane = {type: 'f', value: 1.0};
      uniforms.worldMatrix = {type: 'mat4', value: new THREE.Matrix4()};
      uniforms.moonDiffuseMap = {type: 't', value: null};
    }
    else if(isMoonShader){
      uniforms.moonAngularDiameterCos = {type: 'f', value: 1.0};
      uniforms.sunRadius = {type: 'f', value: 1.0};
      uniforms.radiusOfMoonPlane = {type: 'f', value: 1.0};
      uniforms.worldMatrix = {type: 'mat4', value: new THREE.Matrix4()};
      uniforms.sunLightDirection = {type: 'vec3', value: new THREE.Vector3()};
      uniforms.moonDiffuseMap = {type: 't', value: null};
      uniforms.moonNormalMap = {type: 't', value: null};
      uniforms.moonRoughnessMap = {type: 't', value: null};
      uniforms.moonAperatureSizeMap = {type: 't', value: null};
      uniforms.moonAperatureOrientationMap = {type: 't', value: null};
    }

    if(!isSunShader){
      uniforms.starHashCubemap = {type: 't', value: null};
      uniforms.dimStarData = {type: 't', value: null};
      uniforms.brightStarData = {type: 't', value: null};
      uniforms.starColorData = {type: 't', value: null};
    }

    return uniforms;
  },
  vertexShader: [
    'varying vec3 vWorldPosition;',

    'void main() {',
      'vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
      'vWorldPosition = vec3(-worldPosition.z, worldPosition.y, -worldPosition.x);',

      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}',
  ].join('\n'),
  fragmentShader: function(mieG, textureWidth, textureHeight, packingWidth, packingHeight, atmosphereFunctions, sunCode = false, moonCode = false){
    let originalGLSL = [
    'precision mediump float;',

    'varying vec3 vWorldPosition;',

    'uniform float uTime;',
    'uniform vec3 sunPosition;',
    'uniform vec3 moonPosition;',
    'uniform float sunHorizonFade;',
    'uniform float moonHorizonFade;',
    'uniform sampler2D mieInscatteringSum;',
    'uniform sampler2D rayleighInscatteringSum;',
    'uniform sampler2D transmittance;',

    '#if(!$isSunPass)',
      '//varying vec3 galacticCoordinates;',
      'uniform samplerCube starHashCubemap;',
      'uniform sampler2D dimStarData;',
      'uniform sampler2D brightStarData;',
      'uniform sampler2D starColorData;',
    '#endif',

    'const float piOver2 = 1.5707963267948966192313;',
    'const float piTimes2 = 6.283185307179586476925286;',
    'const float pi = 3.141592653589793238462;',
    'const float scatteringSunIntensity = 20.0;',
    'const float scatteringMoonIntensity = 1.44; //Moon reflects 7.2% of all light',

    '#if($isSunPass)',
      'uniform float sunAngularDiameterCos;',
      'uniform sampler2D moonDiffuseMap;',
      'varying vec2 vUv;',
      'const float sunDiskIntensity = 30.0;',

      '//From https://twiki.ph.rhul.ac.uk/twiki/pub/Public/Solar_Limb_Darkening_Project/Solar_Limb_Darkening.pdf',
      'const float ac1 = 0.46787619;',
      'const float ac2 = 0.67104811;',
      'const float ac3 = -0.06948355;',
    '#elif($isMoonPass)',
      'uniform float moonAngularDiameterCos;',
      'uniform float sunRadius;',
      'uniform sampler2D moonDiffuseMap;',
      'uniform sampler2D moonNormalMap;',
      'uniform sampler2D moonRoughnessMap;',
      'uniform sampler2D moonAperatureSizeMap;',
      'uniform sampler2D moonAperatureOrientationMap;',
      'varying vec2 vUv;',
      'varying mat3 TBNMatrix;',

      '//Tangent space lighting',
      'varying vec3 tangentSpaceSunLightDirection;',
      'varying vec3 tangentSpaceViewDirection;',
    '#endif',

    '$atmosphericFunctions',

    '#if(!$isSunPass)',
      'vec3 getSpectralColor(){',
        'return vec3(1.0);',
      '}',

      '//From http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/',
      'float rand(float x){',
        'float a = 12.9898;',
        'float b = 78.233;',
        'float c = 43758.5453;',
        'float dt= dot(vec2(x, x) ,vec2(a,b));',
        'float sn= mod(dt,3.14);',
        'return fract(sin(sn) * c);',
      '}',

      '//From The Book of Shaders :D',
      '//https://thebookofshaders.com/11/',
      'float noise(float x){',
        'float i = floor(x);',
        'float f = fract(x);',
        'float y = mix(rand(i), rand(i + 1.0), smoothstep(0.0,1.0,f));',

        'return y;',
      '}',

      'float brownianNoise(float lacunarity, float gain, float initialAmplitude, float initialFrequency, float timeInSeconds){',
        'float amplitude = initialAmplitude;',
        'float frequency = initialFrequency;',

        '// Loop of octaves',
        'float y = 0.0;',
        'float maxAmplitude = initialAmplitude;',
        'for (int i = 0; i < 5; i++) {',
        '	y += amplitude * noise(frequency * timeInSeconds);',
        '	frequency *= lacunarity;',
        '	amplitude *= gain;',
        '}',

        'return y;',
      '}',

      'const float twinkleDust = 0.002;',
      'float twinkleFactor(vec3 starposition){',
        '//Determine brightness',
        'float brightnessVariation = 0.99 * pow((1.0 - starposition.y / piOver2), 0.5);',
        'float randSeed = uTime * twinkleDust * (1.0 + rand(rand(starposition.x) + rand(starposition.z)));',

        '// float lacunarity= 0.8;',
        '// float gain = 0.55;',
        '// float initialAmplitude = 1.0;',
        '// float initialFrequency = 2.0;',
        '//lacunarity, gain, initialAmplitude, initialFrequency',
        'return 1.0 + brightnessVariation * (brownianNoise(0.8, 0.55, 1.0, 2.0, randSeed) - 1.0);',
      '}',

      'float fastAiry(float r){',
        '//Variation of Airy Disk approximation from https://www.shadertoy.com/view/tlc3zM to create our stars brightness',
        'float one_over_r_cubed = 1.0 / abs(r * r * r);',
        'float gauss_r_over_1_4 = exp(-.5 * (0.71428571428 * r) * (0.71428571428 * r));',
        'return abs(r) < 1.88 ? gauss_r_over_1_4 : abs(r) > 6.0 ? 1.35 * one_over_r_cubed : (gauss_r_over_1_4 + 2.7 * one_over_r_cubed) * 0.5;',
      '}',

      'vec3 drawStarLight(vec4 starData, vec3 sphericalPosition){',
        '//I hid the temperature inside of the magnitude of the stars equitorial position, as the position vector must be normalized.',
        'float temperature = length(starData.xyz);',
        'vec3 normalizedStarPosition = starData.xyz / temperature;',
        'float starBrightness = pow(2.512, (4.0 - starData.a)) * twinkleFactor(normalizedStarPosition);',
        'float approximateDistance2Star = distance(sphericalPosition, normalizedStarPosition) * 1400.0;',

        '//Modify the intensity and color of this star using approximation of stellar scintillation',


        '//Pass this brightness into the fast Airy function to make the star glow',
        'float stellarBrightness = starBrightness * max(fastAiry(approximateDistance2Star), 0.0);',
        'return vec3(stellarBrightness);',
      '}',
    '#endif',

    'vec3 linearAtmosphericPass(vec3 sourcePosition, float sourceIntensity, vec3 sphericalPosition, sampler2D mieLookupTable, sampler2D rayleighLookupTable, float intensityFader, vec2 uv2OfTransmittance){',
      'float cosOfAngleBetweenCameraPixelAndSource = dot(sourcePosition, sphericalPosition);',
      'float cosOFAngleBetweenZenithAndSource = sourcePosition.y;',
      'vec3 uv3 = vec3(uv2OfTransmittance.x, uv2OfTransmittance.y, parameterizationOfCosOfSourceZenithToZ(cosOFAngleBetweenZenithAndSource));',
      'float depthInPixels = $textureDepth;',
      'UVInterpolatants solarUVInterpolants = getUVInterpolants(uv3, depthInPixels);',

      '//Interpolated scattering values',
      'vec3 interpolatedMieScattering = mix(texture2D(mieLookupTable, solarUVInterpolants.uv0).rgb, texture2D(mieLookupTable, solarUVInterpolants.uvf).rgb, solarUVInterpolants.interpolationFraction);',
      'vec3 interpolatedRayleighScattering = mix(texture2D(rayleighLookupTable, solarUVInterpolants.uv0).rgb, texture2D(rayleighLookupTable, solarUVInterpolants.uvf).rgb, solarUVInterpolants.interpolationFraction);',

      'return intensityFader * sourceIntensity * (miePhaseFunction(cosOfAngleBetweenCameraPixelAndSource) * interpolatedMieScattering + rayleighPhaseFunction(cosOfAngleBetweenCameraPixelAndSource) * interpolatedRayleighScattering);',
    '}',

    'void main(){',
      'vec3 sphericalPosition = normalize(vWorldPosition);',

      '//Get our transmittance for this texel',
      'float cosOfViewAngle = sphericalPosition.y;',
      'vec2 uv2OfTransmittance = vec2(parameterizationOfCosOfViewZenithToX(cosOfViewAngle), parameterizationOfHeightToY(RADIUS_OF_EARTH));',
      'vec3 transmittanceFade = texture2D(transmittance, uv2OfTransmittance).rgb;',

      '//In the event that we have a moon shader, we need to block out all astronomical light blocked by the moon',
      '#if($isMoonPass)',
        '//Get our lunar occlusion texel',
        'vec2 offsetUV = vUv * 2.0 - vec2(0.5);',
        'vec4 lunarDiffuseTexel = texture2D(moonDiffuseMap, offsetUV);',
        'vec2 uvClamp1 = 1.0 - vec2(step(offsetUV.x, 0.0), step(offsetUV.y, 0.0));',
        'vec2 uvClamp2 = 1.0 - vec2(step(1.0 - offsetUV.x, 0.0), step(1.0 - offsetUV.y, 0.0));',
        'vec3 lunarDiffuseColor = lunarDiffuseTexel.rgb;',
        'float lunarMask = lunarDiffuseTexel.a * uvClamp1.x * uvClamp1.y * uvClamp2.x * uvClamp2.y;',
      '#elif($isSunPass)',
        '//Get our lunar occlusion texel in the frame of the sun',
        'float lunarMask = texture2D(moonDiffuseMap, vUv).a;',
      '#endif',

      '//This stuff never shows up near our sun, so we can exclude it',
      '#if(!$isSunPass)',
        '//Get the stellar starting id data from the galactic cube map',
        'vec3 galacticCoordinates = sphericalPosition;',
        'vec3 starHashData = textureCube(starHashCubemap, galacticCoordinates).rgb;',

        '//Red',
        'float scaledBits = starHashData.r * 255.0;',
        'float leftBits = floor(scaledBits / 2.0);',
        'float rightBits = scaledBits - leftBits * 2.0;',
        'float dimStarXCoordinate = leftBits / 128.0;',

        '//Green',
        'scaledBits = starHashData.g * 255.0;',
        'leftBits = floor(scaledBits / 8.0);',
        'float dimStarYCoordinate = (rightBits + leftBits * 2.0) / 64.0;',
        'rightBits = scaledBits - leftBits * 8.0;',

        '//Blue',
        'scaledBits = starHashData.b * 255.0;',
        'leftBits = floor(scaledBits / 32.0);',
        'float brightStarXCoordinate = (rightBits + leftBits * 8.0) / 64.0;',
        'rightBits = scaledBits - leftBits * 32.0;',
        'float brightStarYCoordinate = rightBits / 32.0;',

        'vec4 starData = texture2D(dimStarData, vec2(dimStarXCoordinate, dimStarYCoordinate));',
        'vec3 galacticLighting = drawStarLight(starData, galacticCoordinates);',
        'starData = texture2D(brightStarData, vec2(brightStarXCoordinate, brightStarYCoordinate));',
        'galacticLighting += drawStarLight(starData, galacticCoordinates);',
        'float leftBrightStarXCoordinate = brightStarXCoordinate - (1.0 / 64.0);',
        'float leftBrightStarYCoordinate = brightStarYCoordinate - (floor(leftBrightStarXCoordinate)/32.0);',
        'leftBrightStarXCoordinate = leftBrightStarXCoordinate < 0.0 ? 1.0 : leftBrightStarXCoordinate;',
        'starData = texture2D(brightStarData, vec2(leftBrightStarXCoordinate, leftBrightStarYCoordinate));',
        'galacticLighting += drawStarLight(starData, galacticCoordinates);',
        'float rightBrightStarXCoordinate = brightStarXCoordinate + (1.0 / 64.0);',
        'float rightBrightStarYCoordinate = brightStarYCoordinate + (floor(rightBrightStarXCoordinate)/32.0);',
        'rightBrightStarXCoordinate = rightBrightStarXCoordinate > 1.0 ? 0.0 : rightBrightStarXCoordinate;',
        'starData = texture2D(brightStarData, vec2(rightBrightStarXCoordinate, rightBrightStarYCoordinate));',
        'galacticLighting += drawStarLight(starData, galacticCoordinates);',

        '//Check our distance from each of the four primary planets',


        '//Get the galactic lighting from',


        '//Apply the transmittance function to all of our light sources',
        'galacticLighting = galacticLighting * transmittanceFade;',
      '#endif',

      '//Atmosphere',
      'vec3 solarAtmosphericPass = linearAtmosphericPass(sunPosition, scatteringSunIntensity, sphericalPosition, mieInscatteringSum, rayleighInscatteringSum, sunHorizonFade, uv2OfTransmittance);',
      'vec3 lunarAtmosphericPass = linearAtmosphericPass(moonPosition, scatteringMoonIntensity, sphericalPosition, mieInscatteringSum, rayleighInscatteringSum, moonHorizonFade, uv2OfTransmittance);',

      '//Sun and Moon layers',
      '#if($isSunPass)',
        'vec3 combinedPass = lunarAtmosphericPass + solarAtmosphericPass;',
        '$draw_sun_pass',
        'combinedPass = combinedPass + sunTexel;',
      '#elif($isMoonPass)',
        'vec3 combinedPass = lunarAtmosphericPass + solarAtmosphericPass;',
        '$draw_moon_pass',
        'combinedPass = mix(combinedPass + galacticLighting, combinedPass + moonTexel, lunarMask);',
      '#else',
      '//Regular atmospheric pass',
        'vec3 combinedPass = lunarAtmosphericPass + solarAtmosphericPass + galacticLighting;',

        '//Color Adjustment Pass',
        'combinedPass = ACESFilmicToneMapping(combinedPass);',

        '//Triangular Blue Noise Dithering Pass',

      '#endif',

      'gl_FragColor = vec4(combinedPass, 1.0);',
    '}',
    ];

    let mieGSquared = mieG * mieG;
    let miePhaseFunctionCoefficient = (1.5 * (1.0 - mieGSquared) / (2.0 + mieGSquared));
    let textureDepth = packingWidth * packingHeight;

    let updatedLines = [];
    for(let i = 0, numLines = originalGLSL.length; i < numLines; ++i){
      let updatedGLSL = originalGLSL[i].replace(/\$atmosphericFunctions/g, atmosphereFunctions);
      updatedGLSL = updatedGLSL.replace(/\$mieG/g, mieG.toFixed(16));
      updatedGLSL = updatedGLSL.replace(/\$mieGSquared/g, mieGSquared.toFixed(16));
      updatedGLSL = updatedGLSL.replace(/\$miePhaseFunctionCoefficient/g, miePhaseFunctionCoefficient.toFixed(16));

      //Texture constants
      updatedGLSL = updatedGLSL.replace(/\$textureWidth/g, textureWidth.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$textureHeight/g, textureHeight.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$packingWidth/g, packingWidth.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$packingHeight/g, packingHeight.toFixed(1));
      updatedGLSL = updatedGLSL.replace(/\$textureDepth/g, textureDepth.toFixed(1));

      //Additional injected code for sun and moon
      if(moonCode !== false){
        updatedGLSL = updatedGLSL.replace(/\$isMoonPass/g, '1');
        updatedGLSL = updatedGLSL.replace(/\$isSunPass/g, '0');
        updatedGLSL = updatedGLSL.replace(/\$draw_sun_pass/g, '');
        updatedGLSL = updatedGLSL.replace(/\$draw_moon_pass/g, moonCode);
      }
      else if(sunCode !== false){
        updatedGLSL = updatedGLSL.replace(/\$isMoonPass/g, '0');
        updatedGLSL = updatedGLSL.replace(/\$draw_moon_pass/g, '');
        updatedGLSL = updatedGLSL.replace(/\$isSunPass/g, '1');
        updatedGLSL = updatedGLSL.replace(/\$draw_sun_pass/g, sunCode);
      }
      else{
        updatedGLSL = updatedGLSL.replace(/\$isMoonPass/g, '0');
        updatedGLSL = updatedGLSL.replace(/\$draw_moon_pass/g, '');
        updatedGLSL = updatedGLSL.replace(/\$isSunPass/g, '0');
        updatedGLSL = updatedGLSL.replace(/\$draw_sun_pass/g, '');
      }

      updatedLines.push(updatedGLSL);
    }

    return updatedLines.join('\n');
  }
}
