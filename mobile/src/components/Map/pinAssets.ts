// Generated images: regenerate with
//   NODE_PATH=mobile/node_modules node scripts/generate-pin-assets.js
// (Metro picks the @2x/@3x file for the screen automatically.)
import { VenueDealStatus } from '../../utils/scheduleUtils';
import geometry from '../assets/pins/pinGeometry.json';

export type PinState = 'default' | 'selected';

export interface PinGeometry {
  width: number;
  height: number;
  anchor: { x: number; y: number };
  /** Points from the anchor up to the top of the visible pin. */
  topAboveAnchor: number;
}

export const pinAssets: Record<VenueDealStatus, Record<PinState, number>> = {
  live: {
    default: require('../assets/pins/pin-live-default.png'),
    selected: require('../assets/pins/pin-live-selected.png'),
  },
  later: {
    default: require('../assets/pins/pin-later-default.png'),
    selected: require('../assets/pins/pin-later-selected.png'),
  },
  none: {
    default: require('../assets/pins/pin-none-default.png'),
    selected: require('../assets/pins/pin-none-selected.png'),
  },
};

export const pinGeometry: Record<VenueDealStatus, Record<PinState, PinGeometry>> = geometry;

/** Live pins draw above "later" pins, which draw above dots; selected on top. */
export const pinZIndex: Record<VenueDealStatus, number> = { live: 3, later: 2, none: 1 };
export const SELECTED_PIN_Z_INDEX = 10;
