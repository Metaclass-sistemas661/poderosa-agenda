/**
 * Sistema de Versionamento - Poderosa Agenda
 * 
 * Segue Semantic Versioning (SemVer): MAJOR.MINOR.PATCH
 * - MAJOR: Mudanças incompatíveis / grande redesign
 * - MINOR: Novas funcionalidades (compatíveis)
 * - PATCH: Correções de bugs
 */

export const APP_VERSION = '1.0.0'
export const APP_BUILD_DATE = '2026-08-04'
export const APP_NAME = 'Poderosa Agenda'

export interface VersionInfo {
  version: string
  buildDate: string
  name: string
  environment: 'development' | 'staging' | 'production'
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    buildDate: APP_BUILD_DATE,
    name: APP_NAME,
    environment: (process.env.NODE_ENV === 'production' ? 'production' : 'development') as VersionInfo['environment']
  }
}

/**
 * Verifica se o usuário já viu a versão atual
 */
export function hasSeenVersion(version: string): boolean {
  if (typeof window === 'undefined') return true
  const seen = localStorage.getItem('poderosa_agenda_last_seen_version')
  return seen === version
}

/**
 * Marca a versão como vista
 */
export function markVersionAsSeen(version: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('poderosa_agenda_last_seen_version', version)
}

/**
 * Compara versões (retorna 1 se a > b, -1 se a < b, 0 se iguais)
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  
  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1
    if (partsA[i] < partsB[i]) return -1
  }
  return 0
}
