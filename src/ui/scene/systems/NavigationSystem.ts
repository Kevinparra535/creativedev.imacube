/**
 * NavigationSystem.ts
 * 
 * Maneja la navegación de los cubos hacia objetivos de atención.
 * Usa saltos dirigidos con ruido aleatorio (personalidad). 
 * El pathfinding es aleatorio por ahora (más exploración = más conocimiento, pero eso viene después).
 */

import { Quaternion, Vector3 } from 'three';
import type { Personality } from '../../components/CubeList';

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

export type NavigationPhase = 
  | 'idle'        // No navegando
  | 'orienting'   // Girando hacia objetivo
  | 'jumping'     // Saltando hacia objetivo
  | 'arrived';    // Llegó al objetivo

export interface NavigationState {
  phase: NavigationPhase;
  targetPosition: [number, number, number] | null;
  startedAt: number;
  lastJumpAt: number;
}

// ────────────────────────────────────────────────────────────────
// PERSONALITY-DRIVEN NOISE
// ────────────────────────────────────────────────────────────────

/**
 * Nivel de "caos" en la navegación según personalidad.
 * calm: línea casi recta
 * chaotic: zigzaguea bastante
 */
const NAVIGATION_NOISE: Record<Personality, number> = {
  calm: 0.1,       // Muy directo
  extrovert: 0.3,  // Un poco errático
  curious: 0.25,   // Explora ligeramente
  chaotic: 0.6,    // ¡Zigzag!
  neutral: 0.2,
};

/**
 * Velocidad de salto (impulso vertical) según personalidad.
 */
const JUMP_STRENGTH: Record<Personality, number> = {
  calm: 2.8,
  extrovert: 3.5,   // Salta más alto, más energético
  curious: 3.2,
  chaotic: 4.0,     // ¡Máximo caos!
  neutral: 3.0,
};

/**
 * Intervalo entre saltos (segundos) según personalidad.
 */
const JUMP_INTERVAL: Record<Personality, number> = {
  calm: 2.5,        // Pausa más entre saltos
  extrovert: 1.2,   // Salta frecuentemente
  curious: 1.8,
  chaotic: 0.8,     // ¡Saltos constantes!
  neutral: 1.5,
};

// ────────────────────────────────────────────────────────────────
// DIRECTION COMPUTATION
// ────────────────────────────────────────────────────────────────

/**
 * Calcula la dirección del salto hacia el objetivo.
 * Incluye ruido aleatorio según personalidad (exploración).
 * 
 * @returns [dx, dy, dz] vector de impulso normalizado (horizontal)
 */
export function computeJumpDirection(
  currentPos: [number, number, number],
  targetPos: [number, number, number],
  personality: Personality
): [number, number, number] {
  // Vector hacia objetivo (solo horizontal, ignoramos Y)
  const dx = targetPos[0] - currentPos[0];
  const dz = targetPos[2] - currentPos[2];
  
  // Distancia horizontal
  const dist = Math.sqrt(dx * dx + dz * dz);
  
  // Si está muy cerca, no saltar
  if (dist < 0.5) {
    return [0, 0, 0];
  }
  
  // Normalizar
  let dirX = dx / dist;
  let dirZ = dz / dist;
  
  // Agregar ruido aleatorio (personalidad)
  const noise = NAVIGATION_NOISE[personality];
  dirX += (Math.random() - 0.5) * noise;
  dirZ += (Math.random() - 0.5) * noise;
  
  // Re-normalizar después del ruido
  const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
  if (len > 0.01) {
    dirX /= len;
    dirZ /= len;
  }
  
  // Escalar por fuerza de salto horizontal (ajustable)
  const horizontalStrength = 2.5;
  
  return [dirX * horizontalStrength, 0, dirZ * horizontalStrength];
}

/**
 * Obtiene la fuerza de salto vertical según personalidad.
 */
export function getJumpStrength(personality: Personality): number {
  return JUMP_STRENGTH[personality];
}

/**
 * Obtiene el intervalo entre saltos según personalidad.
 */
export function getJumpInterval(personality: Personality): number {
  return JUMP_INTERVAL[personality];
}

// ────────────────────────────────────────────────────────────────
// ORIENTATION
// ────────────────────────────────────────────────────────────────

/**
 * Calcula la orientación objetivo (quaternion) para mirar hacia un punto.
 * Preserva el up-vector (auto-righting), solo rota en Y (yaw).
 * 
 * @param currentPos Posición actual del cubo
 * @param targetPos Posición del objetivo
 * @returns Quaternion orientado hacia objetivo
 */
export function computeTargetOrientation(
  currentPos: [number, number, number],
  targetPos: [number, number, number]
): Quaternion {
  const dx = targetPos[0] - currentPos[0];
  const dz = targetPos[2] - currentPos[2];
  
  // Ángulo en plano XZ
  const targetYaw = Math.atan2(dx, dz);
  
  // Quaternion solo con rotación Y (vertical preservado)
  const q = new Quaternion();
  q.setFromAxisAngle(new Vector3(0, 1, 0), targetYaw);
  
  return q;
}

/**
 * Interpola suavemente hacia la orientación objetivo.
 * Usa slerp para rotación suave.
 * 
 * @param current Quaternion actual
 * @param target Quaternion objetivo
 * @param speed Velocidad de interpolación (0-1, típicamente 0.05-0.2)
 * @returns Quaternion interpolado
 */
export function slerpToTarget(
  current: Quaternion,
  target: Quaternion,
  speed: number
): Quaternion {
  const result = new Quaternion();
  result.copy(current);
  result.slerp(target, speed);
  return result;
}

// ────────────────────────────────────────────────────────────────
// ARRIVAL DETECTION
// ────────────────────────────────────────────────────────────────

/**
 * Determina si el cubo ha llegado al objetivo.
 * Considera tanto distancia horizontal como velocidad (debe estar "asentado").
 */
export function hasArrivedAt(
  currentPos: [number, number, number],
  targetPos: [number, number, number],
  velocity: [number, number, number],
  threshold = 1.5
): boolean {
  const dx = targetPos[0] - currentPos[0];
  const dz = targetPos[2] - currentPos[2];
  const distXZ = Math.sqrt(dx * dx + dz * dz);
  
  // Velocidad horizontal
  const velXZ = Math.sqrt(velocity[0] ** 2 + velocity[2] ** 2);
  
  // Llegó si está cerca Y casi quieto
  return distXZ < threshold && velXZ < 0.5;
}

// ────────────────────────────────────────────────────────────────
// STATE HELPERS
// ────────────────────────────────────────────────────────────────

export function createNavigationState(): NavigationState {
  return {
    phase: 'idle',
    targetPosition: null,
    startedAt: 0,
    lastJumpAt: 0,
  };
}

export function startNavigation(
  target: [number, number, number]
): NavigationState {
  return {
    phase: 'orienting',
    targetPosition: target,
    startedAt: Date.now(),
    lastJumpAt: 0,
  };
}

export function stopNavigation(): NavigationState {
  return createNavigationState();
}
