#include "../world_state/AstroTime.h"
#include "../Constants.h"
#include "OtherPlanet.h"
#include "Mars.h"
#include <cmath>

//
//Constructor
//
Mars::Mars(AstsroTime* astroTime) : OtherPlanet(astroTimeRef){
  //
  //Default constructor
  //
};

//From page 286 of Meeus
void Mars::updateMagnitudeOfPlanet(){
  double phaseAngle = getPhaseAngleInDegrees();
  irradianceFromEarth = -1.52 + 5.0 * log(distanceFromSun * distanceFromEarth) + 0.016 * phaseAngle;
}

void Mars::updateEclipticalLongitude(){
  const double L_0_A[69] = {620347711.581, 18656368.093, 1108216.816, 91798.406,
  27744.987, 10610.235, 12315.897, 8926.784, 8715.691, 6797.556, 7774.872, 3575.078,
  4161.108, 3075.252, 2628.117, 2937.546, 2389.414, 2579.844, 1528.141, 1798.806,
  1264.357, 1286.228, 1546.404, 1024.902, 891.566, 858.759, 832.715, 832.72, 712.902,
  748.723, 723.861, 635.548, 655.162, 550.474, 552.75, 425.966, 415.131, 472.167,
  306.551, 312.141, 293.198, 302.375, 274.027, 281.079, 231.183, 283.602, 236.117,
  274.033, 299.395, 204.162, 238.866, 188.648, 221.228, 179.196, 172.117, 193.118,
  144.304, 160.016, 174.072, 130.989, 138.243, 128.062, 139.898, 128.105, 116.944,
  110.378, 113.481, 100.099, 95.594};
  const double L_0_B[69] = {0.0, 5.0503710027, 5.40099836344, 5.75478744667, 5.97049513147,
  2.93958560338, 0.84956094002, 4.15697846427, 6.11005153139, 0.36462229657, 3.33968761376,
  1.6618650571, 0.22814971327, 0.85696614132, 0.64806124465, 6.07893711402, 5.03896442664,
  0.02996736156, 1.14979301996, 0.65634057445, 3.62275122593, 3.06796065034, 2.91579701718,
  3.69334099279, 0.18293837498, 2.4009381194, 2.46418619474, 4.49495782139, 3.66335473479,
  3.82248614017, 0.67497311481, 2.92182225127, 0.48864064125, 3.81001042328, 4.47479317037,
  0.55364317304, 0.49662285038, 3.62547124025, 0.38052848348, 0.99853944405, 4.22131299634,
  4.48618007156, 0.54222167059, 5.88163521788, 1.28242156993, 5.7688543494, 5.75503217933,
  0.13372524985, 2.78323740866, 2.82133445874, 5.37153646326, 1.4910406604, 3.50466812198,
  1.00561962003, 0.43943649536, 3.35716641911, 1.41874112114, 3.94857092451, 2.41361337725,
  4.04491134956, 4.30145122848, 1.8066581622, 3.32595559208, 2.20807538189, 3.12806863456,
  1.05194545948, 3.70070432339, 3.24340223714, 0.53950648295};
  const double L_0_C[69] = {0.0, 3340.6124267, 6681.2248534, 10021.8372801, 3.523118349,
  2281.23049651, 2810.92146161, 0.0172536522, 13362.4497068, 398.149003408, 5621.84292321,
  2544.31441988, 2942.46342329, 191.448266112, 3337.08930835, 0.0673103028, 796.298006816,
  3344.13554505, 6151.5338883, 529.690965095, 5092.15195812, 2146.16541648, 1751.53953142,
  8962.45534991, 16703.0621335, 2914.01423582, 3340.59517305, 3340.62968035, 1059.38193019,
  155.420399434, 3738.76143011, 8432.76438482, 3127.31333126, 0.9803210682, 1748.01641307,
  6283.07584999, 213.299095438, 1194.44701022, 6684.74797175, 6677.70173505, 20.7753954924,
  3532.06069281, 3340.5451164, 1349.86740966, 3870.30339179, 3149.16416059, 3333.4988797,
  3340.679737, 6254.62666252, 1221.84856632, 4136.91043352, 9492.146315, 382.896532223,
  951.718406251, 5486.77784318, 3.5904286518, 135.065080035, 4562.46099302, 553.569402842,
  12303.0677766, 7.1135470008, 5088.62883977, 2700.71514039, 1592.59601363, 7903.07341972,
  242.728603974, 1589.07289528, 11773.3768115, 20043.6745602};

  double L0 = 0.0;
  for(int i = 0; i < 77; ++i){
    L0 += L_0_A[i] * cos(L_0_B[i] + L_0_C[i] * astroTimeRef->julianCentury);
  }

  const double L_1_A[46] = {3.34061242701e+11, 1457554.523, 168414.711, 20622.975,
  3452.392, 2586.332, 841.535, 537.567, 520.948, 432.635, 429.655, 381.751, 328.53,
  282.795, 205.657, 168.866, 157.593, 133.686, 116.965, 117.503, 113.718, 133.565,
  91.099, 84.256, 113.886, 80.823, 79.847, 72.505, 72.945, 71.49, 85.34, 67.58,
  65.06, 65.061, 61.478, 48.482, 46.581, 56.642, 47.615, 42.052, 41.33, 40.28,
  33.04, 28.676, 22.322, 22.432};
  const double L_1_B[46] = {0.0, 3.60433733236, 3.92318567804, 4.26108844583, 4.7321039319,
  4.60670058555, 4.45864030426, 5.01581256923, 4.99428054039, 2.56070853083, 5.31645299471,
  3.53878166043, 4.95632685192, 3.15966768785, 4.56889279932, 1.3293655906, 4.18519540728,
  2.23327245555, 2.21414273762, 6.02411290806, 5.42753341019, 5.97420357518, 1.09626613064,
  5.29330740437, 2.12863726524, 4.42818326716, 2.24822372859, 5.84203374239, 2.50193599662,
  3.85645759558, 3.90856932983, 5.0233489507, 1.01810963274, 3.04888114328, 4.15185188249,
  4.87339233007, 1.31461442691, 3.88772102421, 1.18228660215, 5.30826745759, 0.71392238704,
  2.72571311592, 5.40823104809, 0.04305323493, 5.86718681699, 5.46596961275};
  const double L_1_C[46] = {0.0, 3340.6124267, 6681.2248534, 10021.8372801, 3.523118349,
  13362.4497068, 2281.23049651, 398.149003408, 3344.13554505, 191.448266112, 155.420399434,
  796.298006816, 16703.0621335, 2544.31441988, 2146.16541648, 3337.08930835, 1751.53953142,
  0.9803210682, 1059.38193019, 6151.5338883, 3738.76143011, 1748.01641307, 1349.86740966,
  6684.74797175, 1194.44701022, 529.690965095, 8962.45534991, 242.728603974, 951.718406251,
  2914.01423582, 553.569402842, 382.896532223, 3340.59517305, 3340.62968035, 3149.16416059,
  213.299095438, 3185.19202727, 4136.91043352, 3333.4988797, 20043.6745602, 1592.59601363,
  7.1135470008, 6283.07584999, 9492.146315, 3870.30339179, 20.3553193988};

  double L1 = 0.0;
  for(int i = 0; i < 51; ++i){
    L1 += L_1_A[i] * cos(L_1_B[i] + L_1_C[i] * astroTimeRef->julianCentury);
  }

  const double L_2_A[33] = {58152.577, 13459.579, 2432.575, 401.065, 451.384, 222.025,
  120.954, 62.971, 53.644, 34.273, 31.659, 29.839, 23.172, 21.663, 16.05, 20.369,
  14.924, 16.229, 14.317, 14.411, 11.944, 15.655, 11.261, 13.36, 10.395, 9.415,
  9.58, 8.996, 7.498, 6.499, 6.307, 6.864, 5.871};
  const double L_2_B[33] = {2.04961712429, 2.45738706163, 2.79737979284, 3.13581149963,
  0.0, 3.19437046607, 0.54327128607, 3.47765178989, 3.54171478781, 6.00208464365,
  4.14001980084, 1.9983873938, 4.33401932281, 3.44500841809, 6.11000263211, 5.42202383442,
  6.09549588012, 0.65685105422, 2.61898820749, 4.01941740099, 3.86196758615, 1.22093822826,
  4.71857181601, 0.60151621438, 0.25075540193, 0.68050215057, 3.82256319681, 3.88272784458,
  5.46428174266, 5.47802397833, 2.34134269478, 2.57523762859, 1.1486285578};
  const double L_2_C[33] = {3340.6124267, 6681.2248534, 10021.8372801, 13362.4497068,
  0.0, 3.523118349, 155.420399434, 16703.0621335, 3344.13554505, 2281.23049651,
  191.448266112, 796.298006816, 242.728603974, 398.149003408, 2146.16541648, 553.569402842,
  3185.19202727, 0.9803210682, 1349.86740966, 951.718406251, 6684.74797175, 1748.01641307,
  2544.31441988, 1194.44701022, 382.896532223, 1059.38193019, 20043.6745602, 3738.76143011,
  1751.53953142, 1592.59601363, 3097.88382273, 3149.16416059, 7.1135470008};

  double L2 = 0.0;
  for(int i = 0; i < 36; ++i){
    L2 += L_2_A[i] * cos(L_2_B[i] + L_2_C[i] * astroTimeRef->julianCentury);
  }

  const double L_3_A[12] = {1467.867, 692.668, 189.478, 41.615, 22.66, 8.126, 10.455,
  4.902, 5.379, 3.782, 3.181, 3.133};
  const double L_3_B[12] = {0.4442983946, 0.88679887123, 1.28336839921, 1.64210455567,
  2.05278956965, 1.99049724299, 1.57992093693, 2.8251687501, 3.14159265359, 2.01848153986,
  4.59108786647, 0.65141319517};
  const double L_3_C[12] = {3340.6124267, 6681.2248534, 10021.8372801, 13362.4497068,
  155.420399434, 16703.0621335, 3.523118349, 242.728603974, 0.0, 3344.13554505,
  3185.19202727, 553.569402842};

  double L3 = 0.0;
  for(int i = 0; i < 13; ++i){
    L3 += L_3_A[i] * cos(L_3_B[i] + L_3_C[i] * astroTimeRef->julianCentury);
  }

  const double L_4_A[8] = {27.242, 25.511, 11.147, 3.19, 3.251, 0.79, 0.783, 0.5};
  const double L_4_B[8] = {5.6399774232, 5.13956279086, 6.03556608878, 3.56206901204,
  0.1291561646, 0.48979114861, 1.31770747646, 3.082009215};
  const double L_4_C[8] = {6681.2248534, 3340.6124267, 10021.8372801, 155.420399434,
  13362.4497068, 16703.0621335, 242.728603974, 3185.19202727};

  double L4 = 0.0;
  for(int i = 0; i < 8; ++i){
    L4 += L_4_A[i] * cos(L_4_B[i] + L_4_C[i] * astroTimeRef->julianCentury);
  }

  const double L_5_A[2] = {0.762, 0.511};
  const double L_5_B[2] = {4.03556368806, 4.4877039364};
  const double L_5_C[2] = {6681.2248534, 10021.8372801};

  double L5 = 0.0;
  for(int i = 0; i < 2; ++i){
    L5 += L_5_A[i] * cos(L_5_B[i] + L_5_C[i] * astroTimeRef->julianCentury);
  }

  double julianCenturyMultiple = 1.0;
  double LValues[5] = {L0, L1, L2, L3, L4};
  eclipticalLongitude = 0.0;
  for(int i = 0; i < 5; ++i){
    eclipticalLongitude += LValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  eclipticalLongitude = eclipticalLongitude / 1.0e-8;
}

void Mars::updateEclipticalLatitude(){
  const double B_0_A[16] = {3197134.986, 298033.234, 289104.742, 31365.539, 3484.1,
  442.999, 443.401, 399.109, 292.506, 181.982, 163.159, 159.678, 139.323, 149.297,
  142.686, 142.685};
  const double B_0_B[16] = {3.76832042431, 4.10616996305, 0.0, 4.4465105309, 4.7881254926,
  5.65233014206, 5.02642622964, 5.13056816928, 3.79290674178, 6.13648041445, 4.26399640691,
  2.23194572851, 2.41796458896, 2.16501221175, 1.18215016908, 3.21292181638};
  const double B_0_C[16] = {3340.6124267, 6681.2248534, 0.0, 10021.8372801, 13362.4497068,
  3337.08930835, 3344.13554505, 16703.0621335, 2281.23049651, 6151.5338883, 529.690965095,
  1059.38193019, 8962.45534991, 5621.84292321, 3340.59517305, 3340.62968035};

  double B0 = 0.0;
  for(int i = 0; i < 18; ++i){
    B0 += B_0_A[i] * cos(B_0_B[i] + B_0_C[i] * astroTimeRef->julianCentury);
  }

  const double B_1_A[9] = {217310.991, 20976.948, 12834.709, 3320.981, 627.2,
  101.99, 75.107, 29.264, 23.251};
  const double B_1_B[9] = {6.04472194776, 3.14159265359, 1.60810667915, 2.62947004077,
  3.11898601248, 3.52113557592, 0.95983758515, 3.4030768271, 3.69342549027};
  const double B_1_C[9] = {3340.6124267, 0.0, 6681.2248534, 10021.8372801, 13362.4497068,
  16703.0621335, 3337.08930835, 3344.13554505, 5621.84292321};

  double B1 = 0.0;
  for(int i = 0; i < 10; ++i){
    B1 += B_1_A[i] * cos(B_1_B[i] + B_1_C[i] * astroTimeRef->julianCentury);
  }

  const double B_2_A[7] = {8888.446, 2595.393, 918.914, 267.883, 66.911, 14.267,
  7.948};
  const double B_2_B[7] = {1.06196052751, 3.14159265359, 0.1153843119, 0.78837893063,
  1.39435595847, 1.87268116087, 2.58819177832};
  const double B_2_C[7] = {3340.6124267, 0.0, 6681.2248534, 10021.8372801, 13362.4497068,
  16703.0621335, 3337.08930835};

  double B2 = 0.0;
  for(int i = 0; i < 8; ++i){
    B2 += B_2_A[i] * cos(B_2_B[i] + B_2_C[i] * astroTimeRef->julianCentury);
  }

  const double B_3_A[4] = {330.418, 93.057, 14.546, 8.731};
  const double B_3_B[4] = {2.04215300484, 0.0, 5.38525967237, 4.90252313032};
  const double B_3_C[4] = {3340.6124267, 0.0, 10021.8372801, 6681.2248534};

  double B3 = 0.0;
  for(int i = 0; i < 4; ++i){
    B3 += B_3_A[i] * cos(B_3_B[i] + B_3_C[i] * astroTimeRef->julianCentury);
  }

  const double B_4_A[3] = {6.007, 6.625, 0.464};
  const double B_4_B[3] = {3.37637101191, 0.0, 3.7720275715};
  const double B_4_C[3] = {3340.6124267, 0.0, 10021.8372801};

  double B4 = 0.0;
  for(int i = 0; i < 3; ++i){
    B4 += B_4_A[i] * cos(B_4_B[i] + B_4_C[i] * astroTimeRef->julianCentury);
  }

  double julianCenturyMultiple = 1.0;
  double BValues[4] = {B0, B1, B2, B3};
  eclipticalLatitude = 0.0;
  for(int i = 0; i < 4; ++i){
    eclipticalLatitude += BValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  eclipticalLatitude = eclipticalLatitude / 1.0e-8;
}

void Mars::updateRadiusVector(){
  const double R_0_A[45] = {153033488.271, 14184953.16, 660776.362, 46179.117,
  8109.733, 7485.318, 5523.191, 3825.16, 2306.537, 1999.396, 2484.394, 1960.195,
  1167.119, 1102.816, 899.066, 992.252, 807.354, 797.915, 740.975, 692.339, 633.144,
  725.583, 633.14, 574.355, 526.166, 629.978, 472.775, 348.095, 283.713, 279.543,
  233.857, 219.427, 269.896, 208.335, 275.217, 275.506, 239.119, 223.189, 182.689,
  186.207, 176.0, 178.617, 208.33, 228.126, 144.312};
  const double R_0_B[45] = {0.0, 3.47971283528, 3.81783443019, 4.15595316782, 5.55958416318,
  1.77239078402, 1.3643630377, 4.49407183687, 0.09081579001, 5.36059617709, 4.9254563992,
  4.74249437639, 2.11260868341, 5.00908403998, 4.40791133207, 5.83861961952, 2.10217065501,
  3.44839203899, 1.49906336885, 2.13378874689, 0.89353283242, 1.24516810723, 2.92430446399,
  0.82896244455, 5.38292991236, 1.28737486495, 5.19850522346, 4.83219199976, 2.90692064724,
  5.2574968538, 5.10545987572, 5.58340231744, 3.76393625127, 5.25476078693, 2.90817482492,
  1.21767950614, 2.03669934656, 4.19861535147, 5.08062725665, 5.6987157241, 5.95341919657,
  4.18423004741, 4.84626439637, 3.25526555588, 0.2130621946};
  const double R_0_C[45] = {0.0, 3340.6124267, 6681.2248534, 10021.8372801, 2810.92146161,
  5621.84292321, 2281.23049651, 13362.4497068, 2544.31441988, 3337.08930835, 2942.46342329,
  3344.13554505, 5092.15195812, 398.149003408, 529.690965095, 6151.5338883, 1059.38193019,
  796.298006816, 2146.16541648, 8962.45534991, 3340.59517305, 8432.76438482, 3340.62968035,
  2914.01423582, 3738.76143011, 1751.53953142, 3127.31333126, 16703.0621335, 3532.06069281,
  6283.07584999, 5486.77784318, 191.448266112, 5884.92684658, 3340.5451164, 1748.01641307,
  6254.62666252, 1194.44701022, 3149.16416059, 6684.74797175, 6677.70173505, 3870.30339179,
  3333.4988797, 3340.679737, 6872.67311951, 5088.62883977};

  double R0 = 0.0;
  for(int i = 0; i < 50; ++i){
    R0 += R_0_A[i] * cos(R_0_B[i] + R_0_C[i] * astroTimeRef->julianCentury);
  }

  const double R_1_A[27] = {1107433.345, 103175.887, 12877.2, 10815.88, 1194.55,
  438.582, 395.7, 182.576, 135.851, 128.199, 127.059, 118.443, 128.362, 87.534,
  83.021, 75.604, 72.002, 66.545, 54.305, 51.043, 66.413, 47.86, 49.42, 49.42,
  57.519, 48.32, 36.383};
  const double R_1_B[27] = {2.03250524857, 2.37071847807, 0.0, 2.70888095665, 3.04702256206,
  2.88835054603, 3.42323670971, 1.58427562964, 3.38507063082, 0.62991771813, 1.95391155885,
  2.99762091382, 6.04343227063, 3.42053385867, 3.85575072018, 4.45097659377, 2.76443992447,
  2.5487838147, 0.67754203387, 3.72584855417, 4.40596377334, 2.28524521788, 5.72961379219,
  1.47720011103, 0.5435613312, 2.58061402348, 6.02729341698};
  const double R_1_C[27] = {3340.6124267, 6681.2248534, 0.0, 10021.8372801, 13362.4497068,
  2281.23049651, 3344.13554505, 2544.31441988, 16703.0621335, 1059.38193019, 796.298006816,
  2146.16541648, 3337.08930835, 398.149003408, 3738.76143011, 6151.5338883, 529.690965095,
  1751.53953142, 8962.45534991, 6684.74797175, 1748.01641307, 2914.01423582, 3340.59517305,
  3340.62968035, 1194.44701022, 3149.16416059, 3185.19202727};

  double R1 = 0.0;
  for(int i = 0; i < 30; ++i){
    R1 += R_1_A[i] * cos(R_1_B[i] + R_1_C[i] * astroTimeRef->julianCentury);
  }

  const double R_2_A[11] = {44242.249, 8138.042, 1274.915, 187.388, 40.745, 52.395,
  26.617, 17.828, 11.713, 10.21, 9.95};
  const double R_2_B[11] = {0.47930604954, 0.86998389204, 1.22593985222, 1.57298976045,
  1.97082077028, 3.14159265359, 1.91665337822, 4.43491476419, 4.52509926559, 5.3914732206,
  0.41865678448};
  const double R_2_C[11] = {3340.6124267, 6681.2248534, 10021.8372801, 13362.4497068,
  3344.13554505, 0.0, 16703.0621335, 2281.23049651, 3185.19202727, 1059.38193019,
  796.298006816};

  double R2 = 0.0;
  for(int i = 0; i < 12; ++i){
    R2 += R_2_A[i] * cos(R_2_B[i] + R_2_C[i] * astroTimeRef->julianCentury);
  }

  const double R_3_A[6] = {1113.108, 424.447, 100.044, 19.606, 3.478, 4.693};
  const double R_3_B[6] = {5.14987305093, 5.61343952053, 5.99727457548, 0.07631453783,
  0.42912010211, 3.14159265359};
  const double R_3_C[6] = {3340.6124267, 6681.2248534, 10021.8372801, 13362.4497068,
  16703.0621335, 0.0};

  double R3 = 0.0;
  for(int i = 0; i < 6; ++i){
    R3 += R_3_A[i] * cos(R_3_B[i] + R_3_C[i] * astroTimeRef->julianCentury);
  }

  const double R_4_A[4] = {19.551, 16.322, 5.848, 1.533};
  const double R_4_B[4] = {3.58210746512, 4.05115851142, 4.4638164658, 4.84332951095};
  const double R_4_C[4] = {3340.6124267, 6681.2248534, 10021.8372801, 13362.4497068};

  double R4 = 0.0;
  for(int i = 0; i < 4; ++i){
    R4 += R_4_A[i] * cos(R_4_B[i] + R_4_C[i] * astroTimeRef->julianCentury);
  }

  double julianCenturyMultiple = 1.0;
  double RValues[4] = {R0, R1, R2, R3};
  radiusVector = 0.0;
  for(int i = 0; i < 4; ++i){
    radiusVector += RValues[i] * julianCenturyMultiple;
    julianCenturyMultiple *= astroTime->julianCentury;
  }
  radiusVector = radiusVector / 1.0e-8;
}
