import dayjs from "dayjs"

function getCurrentDate() {
  return dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")
}

function info(...args: any) {
  const date = getCurrentDate()
  console.info(`\x1b[34m[${date}]\x1b[0m \x1b[32m[info]\x1b[0m`, ...args)
}

function warn(...args: any) {
  const date = getCurrentDate()
  console.warn(`\x1b[34m[${date}]\x1b[0m \x1b[33m[warn]\x1b[0m`, ...args)
}

function error(...args: any) {
  const date = getCurrentDate()
  console.error(`\x1b[34m[${date}]\x1b[0m \x1b[31m[error]\x1b[0m`, ...args)
}

const logger = { info, warn, error }

export default logger
