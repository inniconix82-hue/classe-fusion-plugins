import { createContext, useContext } from 'react'

export type LayoutDirection = 'TB' | 'LR'

export const LayoutContext = createContext<LayoutDirection>('TB')

export function useLayoutDirection(): LayoutDirection {
  return useContext(LayoutContext)
}
