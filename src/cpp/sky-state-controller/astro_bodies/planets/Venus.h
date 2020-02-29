#pragma once
#include "AstronomicalBody.h"
#include "Sun.h"
#include "Earth.h"
#include "../world_state/AstroTime.h"

class Venus : public OtherPlanet{
public:
  Venus(AstsroTime* astroTime, Sun* sunRef, Earth* earthRef);
  void updateEclipticalLongitude();
  void updateEclipticalLatitude();
  void updateRadiusVector();
  void updateMagnitudeOfPlanet();
};
