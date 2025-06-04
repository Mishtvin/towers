import * as constant from './constant'

export const checkMoveDown = engine =>
  (engine.checkTimeMovement(constant.moveDownMovement))

export const getMoveDownValue = (engine, store) => {
  const pixelsPerFrame = store ? store.pixelsPerFrame : engine.pixelsPerFrame.bind(engine)
  const successCount = engine.getVariable(constant.successCount)
  const calHeight = engine.getVariable(constant.blockHeight) * 2
  if (successCount <= 4) {
    return pixelsPerFrame(calHeight * 1.25)
  }
  return pixelsPerFrame(calHeight)
}

export const getAngleBase = (engine) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookAngle } = engine.getVariable(constant.gameUserOption)
  if (hookAngle) {
    return hookAngle(successCount, gameScore)
  }
  if (engine.getVariable(constant.hardMode)) {
    return 90
  }
  switch (true) {
    case successCount < 10:
      return 30
    case successCount < 20:
      return 60
    default:
      return 80
  }
}

export const getSwingBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookSpeed } = engine.getVariable(constant.gameUserOption)
  if (hookSpeed) {
    return hookSpeed(successCount, gameScore)
  }
  if (successCount < 1) {
    return 0
  }
  let hard
  switch (true) {
    case successCount < 10:
      hard = 1
      break
    case successCount < 20:
      hard = 0.8
      break
    case successCount < 30:
      hard = 0.7
      break
    default:
      hard = 0.74
      break
  }
  if (engine.getVariable(constant.hardMode)) {
    hard = 1.1
  }
  return Math.sin(time / (200 / hard))
}

export const getLandBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { landBlockSpeed } = engine.getVariable(constant.gameUserOption)
  if (landBlockSpeed) {
    return landBlockSpeed(successCount, gameScore)
  }
  const { width } = engine
  let hard
  switch (true) {
    case successCount < 5:
      hard = 0
      break
    case successCount < 13:
      hard = 0.001
      break
    case successCount < 23:
      hard = 0.002
      break
    default:
      hard = 0.003
      break
  }
  return Math.cos(time / 200) * hard * width
}

export const getHookStatus = (engine) => {
  if (engine.checkTimeMovement(constant.hookDownMovement)) {
    return constant.hookDown
  }
  if (engine.checkTimeMovement(constant.hookUpMovement)) {
    return constant.hookUp
  }
  return constant.hookNormal
}

export const getNextBlockCenter = (engine) => {
  const firstCenter = engine.getVariable(constant.firstBlockCenter)
    || (engine.width / 2)
  const lastCenter = engine.getVariable(constant.lastBlockCenter)
    || firstCenter
  const step = engine.width * 0.05
  const maxDiff = engine.width * 0.2
  let direction = engine.utils.randomPositiveNegative()
  let target = lastCenter + step * direction
  if (Math.abs(target - firstCenter) > maxDiff) {
    direction *= -1
    target = lastCenter + step * direction
    if (Math.abs(target - firstCenter) > maxDiff) {
      target = firstCenter + Math.sign(target - firstCenter) * maxDiff
    }
  }
  return target
}

export const touchEventHandler = (engine) => {
  console.log('touchEventHandler invoked')
  if (!engine.getVariable(constant.gameStartNow)) return
  if (engine.debug && engine.paused) {
    console.log('Game paused, ignoring touch')
    return
  }
  const hookStatus = getHookStatus(engine)
  if (hookStatus !== constant.hookNormal) {
    console.log('Hook not ready, status:', hookStatus)
    return
  }
  engine.removeInstance('tutorial')
  engine.removeInstance('tutorial-arrow')
  const b = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (b) {
    console.log('Current block status:', b.status)
  }
  if (b && b.status === constant.swing) {
    console.log('Swing block touched, entering waitDrop state')
    // start waiting state instead of dropping immediately
    b.status = constant.waitDrop
    b.waitStart = Date.now()

    b.waitDuration = engine.utils.random(300, 600)

    console.log('waitDuration set to', b.waitDuration)
    const { buildRequest } = engine.getVariable(constant.gameUserOption)
    if (buildRequest) {
      console.log('Calling buildRequest')
      Promise.resolve(buildRequest()).then((res) => {
        console.log('Build request result:', res)
        b.serverResult = res && res.success
      }).catch((err) => {
        console.log('Build request error:', err)
        b.serverResult = false
      })
    } else {
      // default success if no request provided
      console.log('Build request default success')
      b.serverResult = true
    }
  } else {
    console.log('No active swing block for touch event')
  }
}

export const addSuccessCount = (engine) => {
  const { setGameSuccess } = engine.getVariable(constant.gameUserOption)
  const lastSuccessCount = engine.getVariable(constant.successCount)
  const success = lastSuccessCount + 1
  engine.setVariable(constant.successCount, success)
  if (engine.getVariable(constant.hardMode)) {
    engine.setVariable(constant.ropeHeight, engine.height * engine.utils.random(0.35, 0.55))
  }
  if (setGameSuccess) setGameSuccess(success)
}

export const addFailedCount = (engine) => {
  const { setGameFailed } = engine.getVariable(constant.gameUserOption)
  const lastFailedCount = engine.getVariable(constant.failedCount)
  const failed = lastFailedCount + 1
  engine.setVariable(constant.failedCount, failed)
  engine.setVariable(constant.perfectCount, 0)
  if (setGameFailed) setGameFailed(failed)
  if (failed >= 1) {
    engine.pauseAudio('bgm')
    engine.playAudio('game-over')
    engine.setVariable(constant.gameStartNow, false)
  }
}

export const addScore = (engine, isPerfect) => {
  const { setGameScore, successScore, perfectScore } = engine.getVariable(constant.gameUserOption)
  const lastPerfectCount = engine.getVariable(constant.perfectCount, 0)
  const lastGameScore = engine.getVariable(constant.gameScore)
  const perfect = isPerfect ? lastPerfectCount + 1 : 0
  const score = lastGameScore + (successScore || 25) + ((perfectScore || 25) * perfect)
  engine.setVariable(constant.gameScore, score)
  engine.setVariable(constant.perfectCount, perfect)
  if (setGameScore) setGameScore(score)
}

export const drawYellowString = (engine, option) => {
  const {
    string, size, x, y, textAlign, fontName = 'wenxue', fontWeight = 'normal'
  } = option
  const { ctx } = engine
  const fontSize = size
  const lineSize = fontSize * 0.1
  ctx.save()
  ctx.beginPath()
  const gradient = ctx.createLinearGradient(0, 0, 0, y)
  gradient.addColorStop(0, '#FAD961')
  gradient.addColorStop(1, '#F76B1C')
  ctx.fillStyle = gradient
  ctx.lineWidth = lineSize
  ctx.strokeStyle = '#FFF'
  ctx.textAlign = textAlign || 'center'
  ctx.font = `${fontWeight} ${fontSize}px ${fontName}`
  ctx.strokeText(string, x, y)
  ctx.fillText(string, x, y)
  ctx.restore()
}
