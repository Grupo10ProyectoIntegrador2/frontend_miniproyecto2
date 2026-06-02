/** Iniciales cortas para el avatar de la sala (máx. 2 caracteres). */
export function getRoomInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'S'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** Etiqueta legible del ID para mostrar en tarjetas y banners. */
export function formatRoomId(roomId: string): string {
  const short = roomId.slice(0, 8).toUpperCase()
  return `SAL-${short}`
}
