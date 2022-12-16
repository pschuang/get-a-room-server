const {
  currentUTCDateTime,
  currentUTCDate,
  addTimeByMinute,
  addTimeByDay,
  isTimeBetween,
  addTimeBySecond,
} = require('../util/convertDatetime')

let todayDate
beforeEach(() => {
  todayDate = new Date()
})

const toDoubleDigits = (value) => (value < 10 ? '0' + value : value)

describe('Test time functions', () => {
  test('should get today UTC date', () => {
    expect(currentUTCDate()).toBe(
      `${todayDate.getUTCFullYear()}-${toDoubleDigits(
        todayDate.getUTCMonth() + 1
      )}-${toDoubleDigits(todayDate.getUTCDate())}`
    )
  })

  test('should get today UTC datetime', () => {
    expect(currentUTCDateTime()).toBe(
      `${todayDate.getUTCFullYear()}-${toDoubleDigits(
        todayDate.getUTCMonth() + 1
      )}-${toDoubleDigits(todayDate.getUTCDate())} ${toDoubleDigits(
        todayDate.getUTCHours()
      )}:${toDoubleDigits(todayDate.getUTCMinutes())}:${toDoubleDigits(
        todayDate.getUTCSeconds()
      )}`
    )
  })

  test('should return a new datetime equals to input datetime plus 80 seconds', () => {
    expect(addTimeBySecond('2022-03-07 09:13:00', 80)).toBe(
      '2022-03-07 09:14:20'
    )
  })

  test('should return a new datetime equals to input datetime plus 80 minutes', () => {
    expect(addTimeByMinute('2022-03-07 09:13:00', 80)).toBe(
      '2022-03-07 10:33:00'
    )
  })

  test('should return a new datetime equals to input datetime plus 2 days', () => {
    expect(addTimeByDay('2022-12-31', 2)).toBe('2023-01-02')
    expect(addTimeByDay('', 2)).toBe('Invalid Date')
    expect(addTimeByDay('2022-12-31', 'c')).toBe('Invalid Date')
  })

  test('should return true if the input date is in between', () => {
    expect(isTimeBetween('2022-03-07', '2022-03-01', '2022-12-31')).toBe(true)
    expect(isTimeBetween('2022-03-07', '2022-02-01', '2022-02-31')).toBe(false)
  })
})
