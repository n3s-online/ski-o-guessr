import * as turf from "@turf/turf";

/**
 * Calculate the distance and direction between two geographic points
 */
export function calculateDistanceAndDirection(
  actualLat: number,
  actualLong: number,
  guessLat: number,
  guessLong: number
) {
  // Create point features
  const actualPoint = turf.point([actualLong, actualLat]);
  const guessPoint = turf.point([guessLong, guessLat]);

  // Calculate distance
  const distanceKm = turf.distance(actualPoint, guessPoint);
  const distanceMiles = distanceKm * 0.621371;

  // Calculate bearing (direction)
  const bearing = turf.bearing(guessPoint, actualPoint);

  return {
    distanceKm,
    distanceMiles,
    direction: bearing,
  };
}

/**
 * Format distance based on unit preference
 */
export function formatDistance(distance: number, useMetric: boolean): string {
  if (useMetric) {
    return distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${Math.round(distance * 10) / 10} km`;
  } else {
    const miles = distance * 0.621371;
    return miles < 1
      ? `${Math.round(miles * 5280)} ft`
      : `${Math.round(miles * 10) / 10} mi`;
  }
}
