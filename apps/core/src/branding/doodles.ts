import type { ImageSourcePropType } from 'react-native';

/**
 * Open Doodles (Pablo Stanley) — free for commercial use.
 * Swap join-card art via `JOIN_CARD_DOODLE` only.
 * PNGs from open-doodles(2).zip (transparent, brand colors). Metro require() plug-and-play.
 */
export const DOODLES = {
  BalletDoodle: require('../../assets/brand/doodles/BalletDoodle.png'),
  BikiniDoodle: require('../../assets/brand/doodles/BikiniDoodle.png'),
  CoffeeDoddle: require('../../assets/brand/doodles/CoffeeDoddle.png'),
  DancingDoodle: require('../../assets/brand/doodles/DancingDoodle.png'),
  DogJumpDoodle: require('../../assets/brand/doodles/DogJumpDoodle.png'),
  DoogieDoodle: require('../../assets/brand/doodles/DoogieDoodle.png'),
  DumpingDoodle: require('../../assets/brand/doodles/DumpingDoodle.png'),
  FloatDoodle: require('../../assets/brand/doodles/FloatDoodle.png'),
  GroovyDoodle: require('../../assets/brand/doodles/GroovyDoodle.png'),
  GroovySittingDoodle: require('../../assets/brand/doodles/GroovySittingDoodle.png'),
  IceCreamDoodle: require('../../assets/brand/doodles/IceCreamDoodle.png'),
  LayingDoodle: require('../../assets/brand/doodles/LayingDoodle.png'),
  LovingDoodle: require('../../assets/brand/doodles/LovingDoodle.png'),
  MeditatingDoodle: require('../../assets/brand/doodles/MeditatingDoodle.png'),
  MessyDoodle: require('../../assets/brand/doodles/MessyDoodle.png'),
  MoshingDoodle: require('../../assets/brand/doodles/MoshingDoodle.png'),
  PettingDoodle: require('../../assets/brand/doodles/PettingDoodle.png'),
  PlantDoodle: require('../../assets/brand/doodles/PlantDoodle.png'),
  ReadingDoodle: require('../../assets/brand/doodles/ReadingDoodle.png'),
  ReadingSideDoodle: require('../../assets/brand/doodles/ReadingSideDoodle.png'),
  RollerSkatingDoodle: require('../../assets/brand/doodles/RollerSkatingDoodle.png'),
  RollingDoodle: require('../../assets/brand/doodles/RollingDoodle.png'),
  RunningDoodle: require('../../assets/brand/doodles/RunningDoodle.png'),
  SelfieDoodle: require('../../assets/brand/doodles/SelfieDoodle.png'),
  SitReadingDoodle: require('../../assets/brand/doodles/SitReadingDoodle.png'),
  SittingDoodle: require('../../assets/brand/doodles/SittingDoodle.png'),
  SleekDoodle: require('../../assets/brand/doodles/SleekDoodle.png'),
  SprintingDoodle: require('../../assets/brand/doodles/SprintingDoodle.png'),
  StrollingDoodle: require('../../assets/brand/doodles/StrollingDoodle.png'),
  SwingingDoodle: require('../../assets/brand/doodles/SwingingDoodle.png'),
  UnboxingDoodle: require('../../assets/brand/doodles/UnboxingDoodle.png'),
  ZombieingDoodle: require('../../assets/brand/doodles/ZombieingDoodle.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type DoodleId = keyof typeof DOODLES;

/** Swap guest join-card illustration: change this id only. */
export const JOIN_CARD_DOODLE: DoodleId = 'MessyDoodle';

/** Swap auth-start illustration: change this id only. */
export const AUTH_START_DOODLE: DoodleId = 'DogJumpDoodle';

/** Swap Need help? card illustration: change this id only. */
export const HELP_CARD_DOODLE: DoodleId = 'PlantDoodle';

export const JOIN_CARD_DOODLE_SIZE = 120;
/** Smaller than Join — Help card is title + one line only. */
export const HELP_CARD_DOODLE_SIZE = 72;
export const AUTH_START_DOODLE_SIZE = 168;
