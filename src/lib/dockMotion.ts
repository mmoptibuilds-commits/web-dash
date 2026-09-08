export function dockMagnification(distance: number, radius = 116, amount = 0.18, maxLift = 10) {
  if (distance >= radius) return { scale: 1, lift: 0 }
  const influence = (Math.cos((Math.max(0, distance) / radius) * Math.PI) + 1) / 2
  return {
    scale: Number((1 + amount * influence).toFixed(3)),
    lift: Number((maxLift * influence).toFixed(2)),
  }
}
