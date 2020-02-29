#pragma once
#include "AstronomicalBody.h"
#include "Sun.h"
#include "../world_state/AstroTime.h"

class Earth : public Planet{
public:
  Earth(AstroTime* astroTimeRef, Sun* sunRef);
  void updatePosition();
  void updateEclipticalLongitude();
  void updateEclipticalLatitude();
  void updateRadiusVector();
};
