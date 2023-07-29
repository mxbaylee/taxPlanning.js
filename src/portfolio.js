const threeDecimals = (value) => {
  return Math.round(value * 1_000) / 1_000
}

const sortByAbsDistance = (desiredRatio) => {
  return (itemA, itemB) => {
    const aVal = Math.abs(desiredRatio - itemA.ratio)
    const bVal = Math.abs(desiredRatio - itemB.ratio)
    return aVal - bVal
  }
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
   * Adds a stock to the list of stocks by value you want to take.
   *
   * @param {Stonk} stonk The stock to add.
   * @param {number|false} [value=false]
   *        The total value you want to add to the withdraw, `false` adds all of
   *        stonk's value.
   * @returns {void}
   */
  addByValue (stonk, value = false) {
    if (value === false) {
      this.stonks.push([stonk, stonk.shares])
    } else {
      const withdrawValue = Math.min(stonk.value, value)
      const sharesToTake = withdrawValue / (stonk.value / stonk.shares)
      this.stonks.push([stonk, sharesToTake])
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

  greaterThanAndEqualToRatio (targetRatio = 0.0) {
    return this.stonks.slice(0).filter((itemA) => {
      return itemA.ratio >= targetRatio
    })
  }

  lessThanRatio (targetRatio = 0.0) {
    return this.stonks.slice(0).filter((itemA) => {
      return itemA.ratio < targetRatio
    })
  }

  /**
   * Sorts the stonks by the absolute distance from the desired ratio.
   *
   * @param {number} [desiredRatio=0.0] The desired ratio.
   * @returns {Array<Stonk>} The sorted stonks.
   */
  sortByAbsDistanceFromRatio(desiredRatio = 0.0) {
    return this.stonks.slice(0).sort(sortByAbsDistance(desiredRatio))
  }

  /**
   * Withdraws an amount from the portfolio.
   *
   * The naive approach, which works most of the time, would be to sort the
   * stonks by the absolute distance between the desired ratio and stonk ratio.
   *
   * The correct approach would be to split the stonks by less than and greater
   * than the desired ratio, then sort them by absolute distance. Each
   * iteration, you'd want one from either list based on which brings you closer
   * to your desired ratio.
   *
   * For example if you were targeting a 0.0 ratio and sorted these shares were
   * sorted by distance alone,  you'd end up with 1.5 in gains by adding the
   * first two stonks together. But the first and third stonk get you closer to
   * the 0.0 ratio.
   *
   * ```
   * const portfolio = new Portfolio([
   *   new Stonk({ value: 10, gains: 0.5, shares: 10 }), // 0.05
   *   new Stonk({ value: 10, gains: 1, shares: 10 }), // 0.1
   *   new Stonk({ value: 10, gains: -1.5, shares: 10 }), // -0.15
   * ])
   * const withdraw = portfolio.withdraw(20, 0)
   * assert.equal(withdraw.value, 20)
   * assert.equal(withdraw.gains, -1)
   * ```
   *
   * @param {number} withdrawAmount The amount to withdraw.
   * @param {number} [desiredRatio=0.0]
   *        The desired ratio of gains to withdraw. Can be `-1.0` to `1.0` for
   *        tax gain/loss harvesting. This is calculated with
   *        `desiredGains/desiredValue` for example if you wanted $0 in gains
   *        and $100 in value you'd want `0.0` to find a withdraw with no tax
   *        implications.
   * @returns {Withdraw} The withdraw object.
   */
  withdraw (withdrawAmount, desiredRatio = 0.0) {
    if (withdrawAmount > this.value) {
      throw Error('Your withdraw amount exceeds the portfolio.')
    }

    const withdraw = new Withdraw(withdrawAmount)
    const positiveList = this.greaterThanAndEqualToRatio(desiredRatio).sort(
      sortByAbsDistance(desiredRatio)
    )
    const negativeList = this.lessThanRatio(desiredRatio).sort(
      sortByAbsDistance(desiredRatio)
    )

    let positiveIdx = 0
    let negativeIdx = 0

    for (let i = this.stonks.length;i >= 0; i--) {
      const remainingAmount = withdrawAmount - withdraw.value
      if (withdraw.remaining <= 0) {
        break
      }

      const negativeStonk = negativeList[negativeIdx] || positiveList[positiveIdx]
      const positiveStonk = positiveList[positiveIdx] || negativeList[negativeIdx]

      const positiveRatio = Math.abs(desiredRatio - withdraw.ratioWithTempStonk(positiveStonk))
      const negativeRatio = Math.abs(desiredRatio - withdraw.ratioWithTempStonk(negativeStonk))
      const negativeWins = negativeRatio <= positiveRatio
      const chosenedStonk = negativeWins ? negativeStonk : positiveStonk

      if (positiveList.includes(chosenedStonk)) {
        positiveIdx++
      } else {
        negativeIdx++
      }

      withdraw.addByValue(chosenedStonk, withdraw.remaining)
    }
    return withdraw
  }
}

module.exports = { Withdraw, Portfolio, Stonk }
