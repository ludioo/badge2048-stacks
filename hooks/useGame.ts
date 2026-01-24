'use client'

import { useReducer, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gameReducer, createInitialState } from '@/lib/game/reducer'
import { BOARD_SIZE } from '@/lib/game/constants'
import { slideDown, slideLeft, slideRight, slideUp } from '@/lib/game/slide'

type Direction = 'up' | 'down' | 'left' | 'right'
type TileId = string | null

interface IdMergeResult {
  values: (number | null)[]
  ids: TileId[]
  mergedIds: Set<string>
}

interface SlideWithIdsResult {
  valuesBoard: (number | null)[][]
  idsBoard: TileId[][]
  mergedIds: Set<string>
}

export interface RenderTile {
  id: string
  value: number
  row: number
  col: number
  isNew: boolean
  isMerged: boolean
}

const createIdBoardFromBoard = (
  board: (number | null)[][],
  nextId: () => string
): TileId[][] => {
  return board.map((row) =>
    row.map((cell) => (cell === null ? null : nextId()))
  )
}

const mergeLineWithIds = (
  values: (number | null)[],
  ids: TileId[],
  nextId: () => string
): IdMergeResult => {
  const valueList: number[] = []
  const idList: string[] = []

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value !== null) {
      valueList.push(value)
      idList.push(ids[i] ?? nextId())
    }
  }

  const mergedValues: (number | null)[] = []
  const mergedIds: TileId[] = []
  const mergedIdSet = new Set<string>()

  let i = 0
  while (i < valueList.length) {
    if (i < valueList.length - 1 && valueList[i] === valueList[i + 1]) {
      const mergedValue = valueList[i] * 2
      const newId = nextId()
      mergedValues.push(mergedValue)
      mergedIds.push(newId)
      mergedIdSet.add(newId)
      i += 2
    } else {
      mergedValues.push(valueList[i])
      mergedIds.push(idList[i])
      i += 1
    }
  }

  while (mergedValues.length < values.length) {
    mergedValues.push(null)
    mergedIds.push(null)
  }

  return { values: mergedValues, ids: mergedIds, mergedIds: mergedIdSet }
}

const slideWithIds = (
  direction: Direction,
  board: (number | null)[][],
  idBoard: TileId[][],
  nextId: () => string
): SlideWithIdsResult => {
  const valuesBoard: (number | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))
  const idsBoard: TileId[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))
  const mergedIds = new Set<string>()

  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < BOARD_SIZE; row++) {
      const rowValues = board[row]
      const rowIds = idBoard[row]

      const valuesToMerge = direction === 'right' ? [...rowValues].reverse() : rowValues
      const idsToMerge = direction === 'right' ? [...rowIds].reverse() : rowIds

      const result = mergeLineWithIds(valuesToMerge, idsToMerge, nextId)
      result.mergedIds.forEach((id) => mergedIds.add(id))

      const finalValues = direction === 'right' ? [...result.values].reverse() : result.values
      const finalIds = direction === 'right' ? [...result.ids].reverse() : result.ids

      valuesBoard[row] = finalValues
      idsBoard[row] = finalIds
    }
  } else {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const colValues: (number | null)[] = []
      const colIds: TileId[] = []
      for (let row = 0; row < BOARD_SIZE; row++) {
        colValues.push(board[row][col])
        colIds.push(idBoard[row][col])
      }

      if (direction === 'down') {
        colValues.reverse()
        colIds.reverse()
      }

      const result = mergeLineWithIds(colValues, colIds, nextId)
      result.mergedIds.forEach((id) => mergedIds.add(id))

      const finalValues = direction === 'down' ? [...result.values].reverse() : result.values
      const finalIds = direction === 'down' ? [...result.ids].reverse() : result.ids

      for (let row = 0; row < BOARD_SIZE; row++) {
        valuesBoard[row][col] = finalValues[row]
        idsBoard[row][col] = finalIds[row]
      }
    }
  }

  return { valuesBoard, idsBoard, mergedIds }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)
  const idCounterRef = useRef(1)
  const nextId = useCallback(() => `t${idCounterRef.current++}`, [])
  const [tileIds, setTileIds] = useState<TileId[][]>(() =>
    createIdBoardFromBoard(state.board, nextId)
  )
  const [mergedIds, setMergedIds] = useState<Set<string>>(new Set())
  const [spawnedId, setSpawnedId] = useState<string | null>(null)
  const [lastMoveEffects, setLastMoveEffects] = useState({ mergeCount: 0, spawned: false })
  const [invalidMoveTick, setInvalidMoveTick] = useState(0)
  const lastMoveRef = useRef<Direction | null>(null)
  const restartRef = useRef(false)
  const prevBoardRef = useRef(state.board)
  const tileIdsRef = useRef(tileIds)

  const move = useCallback((direction: Direction) => {
    if (state.status === 'gameover') return

    const { changed } =
      direction === 'up'
        ? slideUp(state.board)
        : direction === 'down'
        ? slideDown(state.board)
        : direction === 'left'
        ? slideLeft(state.board)
        : slideRight(state.board)

    if (!changed) {
      setInvalidMoveTick((value) => value + 1)
      return
    }

    lastMoveRef.current = direction
    switch (direction) {
      case 'up':
        dispatch({ type: 'SLIDE_UP' })
        break
      case 'down':
        dispatch({ type: 'SLIDE_DOWN' })
        break
      case 'left':
        dispatch({ type: 'SLIDE_LEFT' })
        break
      case 'right':
        dispatch({ type: 'SLIDE_RIGHT' })
        break
    }
  }, [state.board, state.status])

  const restart = useCallback(() => {
    restartRef.current = true
    dispatch({ type: 'RESTART' })
  }, [])

  useEffect(() => {
    const previousBoard = prevBoardRef.current
    const previousIds = tileIdsRef.current

    if (restartRef.current || !lastMoveRef.current) {
      const freshIds = createIdBoardFromBoard(state.board, nextId)
      tileIdsRef.current = freshIds
      setTileIds(freshIds)
      setMergedIds(new Set())
      setSpawnedId(null)
      setLastMoveEffects({ mergeCount: 0, spawned: false })
      restartRef.current = false
      prevBoardRef.current = state.board
      return
    }

    const direction = lastMoveRef.current
    const { valuesBoard, idsBoard, mergedIds: mergedIdSet } = slideWithIds(
      direction,
      previousBoard,
      previousIds,
      nextId
    )

    let newSpawnId: string | null = null
    const nextIdsBoard = idsBoard.map((row) => [...row])

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (valuesBoard[row][col] === null && state.board[row][col] !== null) {
          newSpawnId = nextId()
          nextIdsBoard[row][col] = newSpawnId
        }
      }
    }

    tileIdsRef.current = nextIdsBoard
    setTileIds(nextIdsBoard)
    setMergedIds(mergedIdSet)
    setSpawnedId(newSpawnId)
    setLastMoveEffects({ mergeCount: mergedIdSet.size, spawned: Boolean(newSpawnId) })
    prevBoardRef.current = state.board
  }, [state.board, nextId])

  const tiles = useMemo<RenderTile[]>(() => {
    const result: RenderTile[] = []
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const value = state.board[row][col]
        if (value === null) continue
        const id = tileIds[row]?.[col] ?? `fallback-${row}-${col}`
        result.push({
          id,
          value,
          row,
          col,
          isNew: id === spawnedId,
          isMerged: mergedIds.has(id),
        })
      }
    }
    return result
  }, [state.board, tileIds, mergedIds, spawnedId])

  return {
    state,
    tiles,
    lastMoveEffects,
    invalidMoveTick,
    move,
    restart,
  }
}