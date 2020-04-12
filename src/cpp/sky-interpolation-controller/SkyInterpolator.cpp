#include "Constants.h"
#include "SkyInterpolator.h"
#include <emscripten/emscripten.h>
#include <cmath>
#include <stdio.h>

//
//Constructor
//
SkyInterpolator::SkyInterpolator(){
  //
  //Empty constructor
  //
}

SkyInterpolator* skyInterpolator;

extern "C" {
  int main();
  void initialize(float latitude, float* astroPositions_0, float* rotatedAstroPositions, float* linearValues_0, float* linearValues);
  void updateFinalValues(float* astroPositions_f, float* linearValues_f);
  void updateTimeData(float t_0, float t_f, float initialLSRT, float finalLSRT);
  void tick(float t);
}

void EMSCRIPTEN_KEEPALIVE initialize(float latitude, float* astroPositions_0, float* rotatedAstroPositions, float* linearValues_0, float* linearValues){
  skyInterpolator->sinOfLatitude = sin(latitude);
  skyInterpolator->cosOfLatitude = cos(latitude);
  skyInterpolator->astroPositions_0 = astroPositions_0;
  skyInterpolator->rotatedAstroPositions = rotatedAstroPositions;
  skyInterpolator->linearValues_0 = linearValues_0;
  skyInterpolator->linearValues = linearValues;
}

void EMSCRIPTEN_KEEPALIVE updateFinalValues(float* astroPositions_f, float* linearValues_f){
  #pragma unroll
  for(int i = 0; i < NUMBER_OF_RAS_AND_HAS; ++i){
    skyInterpolator->deltaPositions[i] = astroPositions_f[i] - skyInterpolator->astroPositions_0[i];
  }

  #pragma unroll
  for(int i = 0; i < NUMBER_OF_LINEAR_VALUES; ++i){
    skyInterpolator->deltaLinearValues[i] = linearValues_f[i] - skyInterpolator->linearValues_0[i];
  }
}

void EMSCRIPTEN_KEEPALIVE updateTimeData(float t_0, float t_f, float initialLSRT, float finalLSRT){
  skyInterpolator->t_0 = t_0;
  skyInterpolator->oneOverDeltaT = 1.0 / (t_f - t_0);
  skyInterpolator->initialLSRT = initialLSRT;
  skyInterpolator->finalLSRT = finalLSRT;
}

void EMSCRIPTEN_KEEPALIVE tick(float t){
  float tRelativeToT_0 = t - skyInterpolator->t_0;
  float tFractional = tRelativeToT_0 * skyInterpolator->oneOverDeltaT;

  //Update our linear interpolations
  skyInterpolator->updateLinearInterpolations(tFractional);

  //Update our LSRT
  float lsrt = skyInterpolator->interpolateLSRT(tFractional);

  //Update our rotation of our astronomical objects in the sky
  skyInterpolator->rotateAstroObjects(lsrt, tFractional);
}

void SkyInterpolator::rotateAstroObjects(float lsrt, float fractOfFinalPosition){
  //Interpolate the x, y and z right ascension and hour angle for each of our astronomical objects
  float interpolatedAstroPositions[NUMBER_OF_ASTRONOMICAL_COORDINATES];
  #pragma unroll
  for(int i = 0; i < NUMBER_OF_RAS_AND_HAS; ++i){
    interpolatedAstroPositions[i] = astroPositions_0[i] + fractOfFinalPosition * deltaPositions[i];
  }

  //Rotate our objects into the x, y, z coordinates of our azimuth and altitude
  float sinOfLSRT = sin(lsrt);
  float cosOfLSRT = cos(lsrt);
  float magnitudeOfAstroVector;
  #pragma unroll
  for(int i = 0; i < NUMBER_OF_ASTRONOMICAL_COORDINATES; i += 3){
    //Rotate the object
    rotatedAstroPositions[i] = sinOfLatitude * cosOfLSRT * interpolatedAstroPositions[i] + sinOfLatitude * sinOfLSRT * interpolatedAstroPositions[i + 1] - cosOfLatitude * interpolatedAstroPositions[i + 2];
    rotatedAstroPositions[i + 1] = cosOfLatitude * cosOfLSRT * interpolatedAstroPositions[i] + cosOfLatitude * sinOfLSRT * interpolatedAstroPositions[i + 1] + sinOfLatitude * interpolatedAstroPositions[i + 2];
    rotatedAstroPositions[i + 2] = interpolatedAstroPositions[i + 2];

    //Get the magnitude of the vector
    magnitudeOfAstroVector = 1.0 / sqrt(rotatedAstroPositions[i] * rotatedAstroPositions[i] + rotatedAstroPositions[i + 1] * rotatedAstroPositions[i + 1] + rotatedAstroPositions[i + 2] * rotatedAstroPositions[i + 2]);
    rotatedAstroPositions[i] *= magnitudeOfAstroVector;
    rotatedAstroPositions[i + 1] *= magnitudeOfAstroVector;
    rotatedAstroPositions[i + 2] *= magnitudeOfAstroVector;
  }
}

void SkyInterpolator::updateLinearInterpolations(float fractOfFinalPosition){
  #pragma unroll
  for(int i = 0; i < NUMBER_OF_LINEAR_VALUES; i += 1){
    linearValues[i] = linearValues_0[i] + fractOfFinalPosition * deltaLinearValues[i];
  }
}

float SkyInterpolator::interpolateLSRT(float fractOfFinalPosition){
  if(finalLSRT < initialLSRT){
    return initialLSRT + fractOfFinalPosition * (finalLSRT + (PI_TIMES_TWO - initialLSRT));
  }
  float test = fractOfFinalPosition;
  return initialLSRT + fractOfFinalPosition * (finalLSRT - initialLSRT);
}

int main(){
  return 0;
}
