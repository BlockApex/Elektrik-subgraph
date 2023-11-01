import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  UniswapDayData,
  Factory,
  Pool,
  PoolDayData,
  Token,
  TokenDayData,
  TokenHourData,
  Bundle,
  PoolHourData,
  TickDayData,
  Tick,
  PairMinOHLC,
  PairHourOHLC,
  PairDayOHLC,
  PairMonthOHLC,
  PairYearOHLC,
  Pair5MinOHLC,
  Pair15MinOHLC,
  Pair30MinOHLC
} from './../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateUniswapDayData(event: ethereum.Event): UniswapDayData {
  let uniswap = Factory.load(FACTORY_ADDRESS)
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  let uniswapDayData = UniswapDayData.load(dayID.toString())
  if (uniswapDayData === null) {
    uniswapDayData = new UniswapDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.volumeETH = ZERO_BD
    uniswapDayData.volumeUSD = ZERO_BD
    uniswapDayData.volumeUSDUntracked = ZERO_BD
    uniswapDayData.feesUSD = ZERO_BD
  }
  uniswapDayData.tvlUSD = uniswap.totalValueLockedUSD
  uniswapDayData.txCount = uniswap.txCount
  uniswapDayData.save()
  return uniswapDayData as UniswapDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.feeGrowthGlobal0X128 = ZERO_BI
    poolDayData.feeGrowthGlobal1X128 = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return poolDayData as PoolDayData
}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolHourData = PoolHourData.load(hourPoolID)
  if (poolHourData === null) {
    poolHourData = new PoolHourData(hourPoolID)
    poolHourData.periodStartUnix = hourStartUnix
    poolHourData.pool = pool.id
    // things that dont get initialized always
    poolHourData.volumeToken0 = ZERO_BD
    poolHourData.volumeToken1 = ZERO_BD
    poolHourData.volumeUSD = ZERO_BD
    poolHourData.txCount = ZERO_BI
    poolHourData.feesUSD = ZERO_BD
    poolHourData.feeGrowthGlobal0X128 = ZERO_BI
    poolHourData.feeGrowthGlobal1X128 = ZERO_BI
    poolHourData.open = pool.token0Price
    poolHourData.high = pool.token0Price
    poolHourData.low = pool.token0Price
    poolHourData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolHourData.high)) {
    poolHourData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolHourData.low)) {
    poolHourData.low = pool.token0Price
  }

  poolHourData.liquidity = pool.liquidity
  poolHourData.sqrtPrice = pool.sqrtPrice
  poolHourData.token0Price = pool.token0Price
  poolHourData.token1Price = pool.token1Price
  poolHourData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolHourData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolHourData.close = pool.token0Price
  poolHourData.tick = pool.tick
  poolHourData.tvlUSD = pool.totalValueLockedUSD
  poolHourData.txCount = poolHourData.txCount.plus(ONE_BI)
  poolHourData.save()

  // test
  return poolHourData as PoolHourData
}

export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(dayID.toString())
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.close = tokenPrice
  tokenDayData.priceUSD = token.derivedETH.times(bundle.ethPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function updateTokenHourData(token: Token, event: ethereum.Event): TokenHourData {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let tokenHourID = token.id
    .toString()
    .concat('-')
    .concat(hourIndex.toString())
  let tokenHourData = TokenHourData.load(tokenHourID)
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  if (tokenHourData === null) {
    tokenHourData = new TokenHourData(tokenHourID)
    tokenHourData.periodStartUnix = hourStartUnix
    tokenHourData.token = token.id
    tokenHourData.volume = ZERO_BD
    tokenHourData.volumeUSD = ZERO_BD
    tokenHourData.untrackedVolumeUSD = ZERO_BD
    tokenHourData.feesUSD = ZERO_BD
    tokenHourData.open = tokenPrice
    tokenHourData.high = tokenPrice
    tokenHourData.low = tokenPrice
    tokenHourData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenHourData.high)) {
    tokenHourData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenHourData.low)) {
    tokenHourData.low = tokenPrice
  }

  tokenHourData.close = tokenPrice
  tokenHourData.priceUSD = tokenPrice
  tokenHourData.totalValueLocked = token.totalValueLocked
  tokenHourData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenHourData.save()

  return tokenHourData as TokenHourData
}

export function updateTickDayData(tick: Tick, event: ethereum.Event): TickDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tickDayDataID = tick.id.concat('-').concat(dayID.toString())
  let tickDayData = TickDayData.load(tickDayDataID)
  if (tickDayData === null) {
    tickDayData = new TickDayData(tickDayDataID)
    tickDayData.date = dayStartTimestamp
    tickDayData.pool = tick.pool
    tickDayData.tick = tick.id
  }
  tickDayData.liquidityGross = tick.liquidityGross
  tickDayData.liquidityNet = tick.liquidityNet
  tickDayData.volumeToken0 = tick.volumeToken0
  tickDayData.volumeToken1 = tick.volumeToken0
  tickDayData.volumeUSD = tick.volumeUSD
  tickDayData.feesUSD = tick.feesUSD
  tickDayData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickDayData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickDayData.save()

  return tickDayData as TickDayData
}
export function updatePairMinData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): PairMinOHLC {
  let timestamp = event.block.timestamp.toI32()
  let minIndex = timestamp / 60 // get unique hour within unix history
  let minStartUnix = minIndex * 60 // want the rounded effect
  let tokenMinID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(minIndex.toString())
  let pairMinData = PairMinOHLC.load(tokenMinID)
  let price = amount0.div(amount1)
  if (pairMinData === null) {
    pairMinData = new PairMinOHLC(tokenMinID)
    pairMinData.token0 = token0
    pairMinData.token1 = token1
    pairMinData.periodStartUnix = minStartUnix
    pairMinData.open = price
    pairMinData.high = price
    pairMinData.low = price
    pairMinData.close = price
  }

  if (price.gt(pairMinData.high)) {
    pairMinData.high = price
  }

  if (price.lt(pairMinData.low)) {
    pairMinData.low = price
  }

  pairMinData.close = price

  pairMinData.save()

  return pairMinData as PairMinOHLC
}
export function updatePair5MinData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): Pair5MinOHLC {
  let timestamp = event.block.timestamp.toI32()
  let min5Index = timestamp / 300 // get unique hour within unix history
  let min5StartUnix = min5Index * 300 // want the rounded effect
  let token5MinID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(min5Index.toString())
  let pair5MinData = Pair5MinOHLC.load(token5MinID)
  let price = amount0.div(amount1)
  if (pair5MinData === null) {
    pair5MinData = new Pair5MinOHLC(token5MinID)
    pair5MinData.token0 = token0
    pair5MinData.token1 = token1
    pair5MinData.periodStartUnix = min5StartUnix
    pair5MinData.open = price
    pair5MinData.high = price
    pair5MinData.low = price
    pair5MinData.close = price
  }

  if (price.gt(pair5MinData.high)) {
    pair5MinData.high = price
  }

  if (price.lt(pair5MinData.low)) {
    pair5MinData.low = price
  }

  pair5MinData.close = price

  pair5MinData.save()

  return pair5MinData as Pair5MinOHLC
}
export function updatePair15MinData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): Pair15MinOHLC {
  let timestamp = event.block.timestamp.toI32()
  let min15Index = timestamp / 900 // get unique hour within unix history
  let min15StartUnix = min15Index * 900 // want the rounded effect
  let token15MinID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(min15Index.toString())
  let pair15MinData = Pair15MinOHLC.load(token15MinID)
  let price = amount0.div(amount1)
  if (pair15MinData === null) {
    pair15MinData = new Pair15MinOHLC(token15MinID)
    pair15MinData.token0 = token0
    pair15MinData.token1 = token1
    pair15MinData.periodStartUnix = min15StartUnix
    pair15MinData.open = price
    pair15MinData.high = price
    pair15MinData.low = price
    pair15MinData.close = price
  }

  if (price.gt(pair15MinData.high)) {
    pair15MinData.high = price
  }

  if (price.lt(pair15MinData.low)) {
    pair15MinData.low = price
  }

  pair15MinData.close = price

  pair15MinData.save()

  return pair15MinData as Pair15MinOHLC
}
export function updatePair30MinData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): Pair30MinOHLC {
  let timestamp = event.block.timestamp.toI32()
  let min30Index = timestamp / 1800 // get unique hour within unix history
  let min30StartUnix = min30Index * 1800 // want the rounded effect
  let token30MinID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(min30Index.toString())
  let pair30MinData = Pair30MinOHLC.load(token30MinID)
  let price = amount0.div(amount1)
  if (pair30MinData === null) {
    pair30MinData = new Pair30MinOHLC(token30MinID)
    pair30MinData.token0 = token0
    pair30MinData.token1 = token1
    pair30MinData.periodStartUnix = min30StartUnix
    pair30MinData.open = price
    pair30MinData.high = price
    pair30MinData.low = price
    pair30MinData.close = price
  }

  if (price.gt(pair30MinData.high)) {
    pair30MinData.high = price
  }

  if (price.lt(pair30MinData.low)) {
    pair30MinData.low = price
  }

  pair30MinData.close = price

  pair30MinData.save()

  return pair30MinData as Pair30MinOHLC
}
export function updatePairHourData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): PairHourOHLC {
  let timestamp = event.block.timestamp.toI32()
  let minIndex = timestamp / 3600 // get unique hour within unix history
  let minStartUnix = minIndex * 3600 // want the rounded effect
  let tokenHourID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(minIndex.toString())
  let pairHourData = PairHourOHLC.load(tokenHourID)
  let price = amount0.div(amount1)
  if (pairHourData === null) {
    pairHourData = new PairHourOHLC(tokenHourID)
    pairHourData.token0 = token0
    pairHourData.token1 = token1
    pairHourData.periodStartUnix = minStartUnix
    pairHourData.open = price
    pairHourData.high = price
    pairHourData.low = price
    pairHourData.close = price
  }

  if (price.gt(pairHourData.high)) {
    pairHourData.high = price
  }

  if (price.lt(pairHourData.low)) {
    pairHourData.low = price
  }

  pairHourData.close = price

  pairHourData.save()

  return pairHourData as PairHourOHLC
}
export function updatePairDayData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): PairDayOHLC {
  let timestamp = event.block.timestamp.toI32()
  let minIndex = timestamp / 86400 // get unique hour within unix history
  let minStartUnix = minIndex * 86400 // want the rounded effect
  let tokenDayID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(minIndex.toString())
  let pairDayData = PairDayOHLC.load(tokenDayID)
  let price = amount0.div(amount1)
  if (pairDayData === null) {
    pairDayData = new PairDayOHLC(tokenDayID)
    pairDayData.token0 = token0
    pairDayData.token1 = token1
    pairDayData.periodStartUnix = minStartUnix
    pairDayData.open = price
    pairDayData.high = price
    pairDayData.low = price
    pairDayData.close = price
  }

  if (price.gt(pairDayData.high)) {
    pairDayData.high = price
  }

  if (price.lt(pairDayData.low)) {
    pairDayData.low = price
  }

  pairDayData.close = price

  pairDayData.save()

  return pairDayData as PairDayOHLC
}
export function updatePairMonthData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): PairMonthOHLC {
  let timestamp = event.block.timestamp.toI32()
  let minIndex = timestamp / 2592000 // get unique hour within unix history
  let minStartUnix = minIndex * 2592000 // want the rounded effect
  let tokenMonthID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(minIndex.toString())
  let pairMonthData = PairMonthOHLC.load(tokenMonthID)
  let price = amount0.div(amount1)
  if (pairMonthData === null) {
    pairMonthData = new PairMonthOHLC(tokenMonthID)
    pairMonthData.token0 = token0
    pairMonthData.token1 = token1
    pairMonthData.periodStartUnix = minStartUnix
    pairMonthData.open = price
    pairMonthData.high = price
    pairMonthData.low = price
    pairMonthData.close = price
  }

  if (price.gt(pairMonthData.high)) {
    pairMonthData.high = price
  }

  if (price.lt(pairMonthData.low)) {
    pairMonthData.low = price
  }

  pairMonthData.close = price

  pairMonthData.save()

  return pairMonthData as PairMonthOHLC
}
export function updatePairYearData(
  token0: Address,
  token1: Address,
  amount0: BigDecimal,
  amount1: BigDecimal,
  event: ethereum.Event
): PairYearOHLC {
  let timestamp = event.block.timestamp.toI32()
  let minIndex = timestamp / 31536000 // get unique hour within unix history
  let minStartUnix = minIndex * 31536000 // want the rounded effect
  let tokenYearID = token0
    .toHexString()
    .concat('-')
    .concat(token1.toHexString())
    .concat('-')
    .concat(minIndex.toString())
  let pairYearData = PairYearOHLC.load(tokenYearID)
  let price = amount0.div(amount1)
  if (pairYearData === null) {
    pairYearData = new PairYearOHLC(tokenYearID)
    pairYearData.token0 = token0
    pairYearData.token1 = token1
    pairYearData.periodStartUnix = minStartUnix
    pairYearData.open = price
    pairYearData.high = price
    pairYearData.low = price
    pairYearData.close = price
  }

  if (price.gt(pairYearData.high)) {
    pairYearData.high = price
  }

  if (price.lt(pairYearData.low)) {
    pairYearData.low = price
  }

  pairYearData.close = price

  pairYearData.save()

  return pairYearData as PairYearOHLC
}
