const threeDecimals = (value) => {
  return Math.round(value * 1_000) / 1_000
}

class Stonk {
  constructor (item) {
    this.item = item
    this.item.ratio = this.ratio
  }

  get shares() {
    return threeDecimals(this.item.shares)
  }

  get value() {
    return threeDecimals(this.item.value)
  }

  /**
   * Gets the partial value of the stonk, which is the value of the stonk
   * multiplied by the number of shares.
   *
   * @param {number} shares Number of shares.
   * @returns {number} value
   */
  partialValue (shares) {
    return threeDecimals(this.value / this.shares * shares)
  }

  get gains() {
    return threeDecimals(this.item.gains)
  }

  /**
   * Gets the partial gains of the stonk, which is the gains of the stonk
   * multiplied by the number of shares.
   *
   * @param {number} shares Number of shares.
   * @returns {number} gains
   */
  partialGains (shares) {
    return threeDecimals(this.gains / this.shares * shares)
  }

  get ratio() {
    return threeDecimals(this.item.gains / this.item.value)
  }
}

class Withdraw {
  constructor (targetAmount = 0) {
    this.targetAmount = targetAmount
    this.stonks = []
  }

  get remaining () {
    return this.targetAmount - this.value
  }

  /**
   * Adds a stock to the list of stocks.
   *
   * @param {Stonk} stonk The stock to add.
   * @param {number|false} [sharesToWithdraw=false]
   *        The number of shares to withdraw. If `false`, then all of the shares
   *        of the stock are added.
   * @returns {void}
   */
  add (stonk, sharesToWithdraw = false) {
    if (sharesToWithdraw === false) {
      this.stonks.push([stonk, stonk.shares])
    } else {
      this.stonks.push([stonk, sharesToWithdraw])
    }
  }

  get value () {
    return threeDecimals(this.stonks.reduce((memo, [withdrawStonk, withdrawShares]) => {
      return memo + withdrawStonk.partialValue(withdrawShares)
    }, 0))
  }

  get gains () {
    return threeDecimals(this.stonks.reduce((memo, [withdrawStonk, withdrawShares]) => {
      return memo + withdrawStonk.partialGains(withdrawShares)
    }, 0))
  }

  get ratio () {
    return threeDecimals(this.gains / this.value)
  }

  ratioWithTempStonk (tempStonk) {
    if (!tempStonk) return this.ratio
    const tempValue = this.value + tempStonk.value
    const tempGains = this.gains + tempStonk.gains
    return threeDecimals(tempGains / tempValue)
  }
}

class Portfolio {
  constructor (stonks) {
    this.stonks = stonks
  }

  get value () {
    return threeDecimals(this.stonks.reduce((memo, stonk) => {
      return memo + stonk.value
    }, 0))
  }

  get gains () {
    return threeDecimals(this.stonks.reduce((memo, stonk) => {
      return memo + stonk.gains
    }, 0))
  }

  get ratio () {
    return threeDecimals(this.gains / this.value)
  }

  /**
   * Sorts the stonks by the absolute distance from the desired ratio.
   *
   * @param {number} [desiredRatio=0.0] The desired ratio.
   * @returns {Array<Stonk>} The sorted stonks.
   */
  sortByAbsDistanceFromRatio(desiredRatio = 0.0) {
    return this.stonks.slice(0).sort((itemA, itemB) => {
      const aVal = Math.abs(desiredRatio - itemA.ratio)
      const bVal = Math.abs(desiredRatio - itemB.ratio)
      return aVal - bVal
    })
  }

  /**
   * Withdraws an amount from the portfolio.
   *
   * @param {number} withdrawAmount The amount to withdraw.
   * @param {number} [desiredRatio=0.0]
   *        The desired ratio of gains to withdraw. Can be `-1.0` to `1.0` for
   *        tax gain/loss harvesting.
   * @returns {Withdraw} The withdraw object.
   */
  withdraw (withdrawAmount, desiredRatio = 0.0) {
    if (withdrawAmount > this.value) {
      throw Error('Your withdraw amount exceeds the portfolio.')
    }

    const sortedStonks = this.sortByAbsDistanceFromRatio(desiredRatio)

    return sortedStonks.reduce((withdraw, stonk) => {
      if (withdraw.remaining > 0) {
        if (withdraw.remaining > stonk.value) {
          withdraw.add(stonk)
        } else {
          const sharesToTake = withdraw.remaining / (stonk.value / stonk.shares)
          withdraw.add(stonk, sharesToTake)
        }
      }
      return withdraw
    }, new Withdraw(withdrawAmount))
  }
}

module.exports = { Withdraw, Portfolio, Stonk }
