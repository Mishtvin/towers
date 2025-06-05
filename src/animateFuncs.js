import { Instance } from 'cooljs'
import { blockAction, blockPainter } from './block'
import {
  checkMoveDown,
  getMoveDownValue,
  drawYellowString,
  getAngleBase
} from './utils'
import { addFlight } from './flight'
import * as constant from './constant'

export const endAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const successCount = engine.getVariable(constant.successCount, 0)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const threeFiguresOffset = Number(successCount) > 99 ? engine.width * 0.1 : 0

  drawYellowString(engine, {
    string: 'floor',
    size: engine.width * 0.06,
    x: (engine.width * 0.24) + threeFiguresOffset,
    y: engine.width * 0.12,
    textAlign: 'left',
    fontName: 'Arial',
    fontWeight: 'bold'
  })
  drawYellowString(engine, {
    string: successCount,
    size: engine.width * 0.17,
    x: (engine.width * 0.22) + threeFiguresOffset,
    y: engine.width * 0.2,
    textAlign: 'right'
  })
  const score = engine.getImg('score')
  const scoreWidth = score.width
  const scoreHeight = score.height
  const zoomedWidth = engine.width * 0.35
  const zoomedHeight = (scoreHeight * zoomedWidth) / scoreWidth
  engine.ctx.drawImage(
    score,
    engine.width * 0.61,
    engine.width * 0.038,
    zoomedWidth,
    zoomedHeight
  )
  drawYellowString(engine, {
    string: gameScore,
    size: engine.width * 0.06,
    x: engine.width * 0.9,
    y: engine.width * 0.11,
    textAlign: 'right'
  })
  const multiplier = (1 + successCount * 0.5).toFixed(1)
  drawYellowString(engine, {
    string: `${multiplier}x`,
    size: engine.width * 0.08,
    x: engine.width * 0.66,
    y: engine.width * 0.2,
    textAlign: 'left'
  })
}

export const startAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const lastBlock = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return
    if (engine.checkTimeMovement(constant.hookUpMovement)) return
    const angleBase = getAngleBase(engine)
    const successSoFar = engine.getVariable(constant.successCount, 0)
    let initialAngle
    if (successSoFar === 0) {
      initialAngle = 0
      console.log('Creating first block with no swing')
    } else {
      initialAngle = (Math.PI
          * engine.utils.random(angleBase, angleBase + 5)
          * engine.utils.randomPositiveNegative()
      ) / 180
    }
    engine.setVariable(constant.blockCount, engine.getVariable(constant.blockCount) + 1)
    engine.setVariable(constant.initialAngle, initialAngle)
    engine.setTimeMovement(constant.hookDownMovement, 500)
    console.log('Spawning block', engine.getVariable(constant.blockCount))
    const block = new Instance({
      name: `block_${engine.getVariable(constant.blockCount)}`,
      action: blockAction,
      painter: blockPainter
    })
    engine.addInstance(block)
  }
  const successCount = Number(engine.getVariable(constant.successCount, 0))
  switch (successCount) {
    case 2:
      addFlight(engine, 1, 'leftToRight')
      break
    case 6:
      addFlight(engine, 2, 'rightToLeft')
      break
    case 8:
      addFlight(engine, 3, 'leftToRight')
      break
    case 14:
      addFlight(engine, 4, 'bottomToTop')
      break
    case 18:
      addFlight(engine, 5, 'bottomToTop')
      break
    case 22:
      addFlight(engine, 6, 'bottomToTop')
      break
    case 25:
      addFlight(engine, 7, 'rightTopToLeft')
      break
    default:
      break
  }
}

