import { Dimensions } from 'react-native';

/**
 * Card dimensions for the listing carousel (map bottom sheet).
 * Wider / taller than before; pair with Colors.radius.md on the card shell.
 */
const screenWidth = Dimensions.get('window').width;

export const CARD_WIDTH = screenWidth * 0.92;
export const CARD_HEIGHT = 168;
export const CARD_SPACING = 16;
export const CARD_TOTAL_WIDTH = CARD_WIDTH + CARD_SPACING;

/** Vertical padding inside image column (top + bottom); thumbnail height = CARD_HEIGHT minus this */
export const LISTING_CARD_IMAGE_VERTICAL_INSET = 12;


