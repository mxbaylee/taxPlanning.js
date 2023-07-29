/**
 * 💕 Calculates the amount of income needed to achieve a target tax rate with stacked tax brackets using binary search.
 *
 * @param {number} goalRate - The target tax rate to achieve, expressed as a decimal.
 * @param {number} capIncome - The capped income amount.
 * @param {number[][]} incomeTaxBrackets - Array of income tax brackets, each represented as [lowerBound, upperBound, rate].
 * @param {number[][]} capTaxBrackets - Array of capped tax brackets, each represented as [lowerBound, upperBound, rate].
 *
 * @returns {number} - The amount of income needed to achieve the target tax rate.
 */
function amountByRateWithStackedTax(goalRate, capIncome, incomeTaxBrackets, capTaxBrackets) {
  const effectiveRate = goalRate.toFixed(4)
  return binarySearch(0, 500000, (ordinaryIncomeGuess) => {
    const binaryBracket = stackTaxBrackets(ordinaryIncomeGuess, incomeTaxBrackets, capTaxBrackets)
    const binaryRate = taxRate(ordinaryIncomeGuess + capIncome, binaryBracket).toFixed(4)
    if (binaryRate === effectiveRate) {
      return 0
    } else if (binaryRate < effectiveRate) {
      return -1
    }
    return 1
  })
}

/**
 * 📏 Calculate the amount needed to get taxed at the target rate.
 *
 * @param {number} targetRate - Rate to target.
 * @param {number[][]} taxBracketsRange - Range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number} - Amount needed.
 */
function amountByRate(targetRate, taxBracketsRange) {
  return taxBracketsRange.reverse().reduce((accumulator, [threshold, width, rate]) => {
    const effectiveThreshold = threshold || Math.pow(2, 40)
    const lowerRate = taxRate(effectiveThreshold, taxBracketsRange)
    const higherRate = taxRate(width, taxBracketsRange || Math.pow(2, 40))
    if (targetRate > lowerRate && targetRate <= higherRate) {
      const taxRate = lowerRate - targetRate
      const denominator = targetRate - rate
      return ((effectiveThreshold * taxRate) / denominator) + effectiveThreshold
    }
    return accumulator
  }, Math.pow(2, 40))
}

/**
 * 📐 Calculate the amount of ordinary income to withdraw, given a fixed capital gains income and a target rate.
 *
 * @param {number} targetRate - Target tax rate.
 * @param {number} capitalGainsIncome - Total capital gains income.
 * @param {number[][]} incomeTaxBracket - Tax brackets for regular income, represented as an array of arrays with 3 columns (threshold, width, rate) and variable rows.
 * @param {number[][]} capitalGainsTaxBracket - Tax brackets for capital gains, represented as an array of arrays with 3 columns (threshold, width, rate) and variable rows.
 * @param {number} [estimatedMaximum=500_000] - Maximum income expected, used  to calculate the tax amount accurately.
 *
 * @returns {number} - Amount needed to get taxed at the target rate.
 */
function complexAmountByRate(targetRate, capitalGainsIncome, incomeTaxBracket, capitalGainsTaxBracket, estimatedMaximum = 500_000) {
  return binarySearch(0, estimatedMaximum, (ordinaryIncomeGuess) => {
    const agi = ordinaryIncomeGuess + capitalGainsIncome
    const taxBracket = stackTaxBrackets(
      ordinaryIncomeGuess,
      incomeTaxBracket,
      capitalGainsTaxBracket
    )
    const effectiveRate = taxRate(agi, taxBracket)
    if (effectiveRate > targetRate) {
      return 1
    } else if (effectiveRate < targetRate) {
      return -1
    }
    return 0
  })
}

/**
 * 🚕 Given an amount, it'll return the basis that would result in `amount` if you included tax.
 *
 * @param {number} amountCell - Amount to be deducted in the generated brackets.
 * @param {number[][]} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number} - Basis that would result in `amountCell` with the * `taxBracketsRange`
 */
function taxBasis(amountCell, taxBracketsRange) {
  const amount = taxBracketsRange.reduce((accumulator, [threshold, _, rate], bracketIdx) => {
    const currentBracketBasis = taxBasisFoundation(rate, taxBracketsRange)
    if (currentBracketBasis >= amountCell) {
      const prevRate = bracketIdx === 0 ? 0 : taxBracketsRange[bracketIdx - 1][2]
      const prevBracketBasis = taxBasisFoundation(prevRate, taxBracketsRange)
      if (prevBracketBasis < amountCell) {
        return threshold + ((amountCell - prevBracketBasis) / ( 1 + rate))
      }
    }
    return accumulator
  }, amountCell)

  return toMoney(amount)
}

/**
 * (PROTECTED) 🚕 Sum of the tax + basis of a given tax bracket.
 *
 * @param {number} ratio - The tax percent that represents the tax bracket.
 * @param {number[][]} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number} - Sum of the tax + basis of a given tax bracket.
 */
function taxBasisFoundation(ratio, taxBracketsRange) {
  return taxBracketsRange.reduce((accumulator, [threshold, width, rate]) => {
    if (ratio >= rate) {
      const effectiveWidth = width || Math.pow(2, 40)
      return accumulator + (
        (effectiveWidth - threshold) * (1 + rate)
      )
    }
    return accumulator
  }, 0)
}

/**
 * 🫓 Flatten tax brackets by combining similar rate items next to each other
 *
 * @param {number[][]} taxBracketRange - Range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number[][]} - Flattened tax brackets
 */
function flattenTaxBrackets(taxBracketRange) {
  return taxBracketRange.reduce((flatBrackets, [threshold, width, taxRate], idx) => {
    const lastBracket = flatBrackets[idx - 1]

    if (lastBracket && lastBracket[2] === taxRate) {
      lastBracket.width = width
    } else {
      flatBrackets.push([threshold, width, taxRate])
    }

    return flatBrackets
  }, [])
}

/**
 * 🧲 Merge two tax brackets into one bracket.
 *
 * @param {number[][]} firstBracket - First range that includes 3 columns (threshold, width, rate) and variable rows.
 * @param {number[][]} secondBracket - Second range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number[][]} - Merged tax brackets
 */
function mergeTaxBrackets(firstBracket, secondBracket) {
  const mergedArray = firstBracket.concat(secondBracket)
  const bounds = mergedArray.reduce((acc, [threshold, width, _]) => {
    acc.add(threshold || 0)
    acc.add(width || 0)
    return acc
  }, new Set())
  const sortedBounds = Array.from(bounds).sort((a,b) => a - b)

  const sumRateAt = (value, firstBracket, secondBracket) => {
    const rateAt = (value, bracket) => {
      return bracket.reduce((previousRate, [threshold, width, rate]) => {
        if (value >= threshold && (value < threshold + width || !width)) {
          return rate
        }
        return previousRate
      }, 0)
    }
    // avoiding floating point issues by multiplying
    return (
      (1000 * rateAt(value, firstBracket)) +
      (1000 * rateAt(value, secondBracket))
    ) / 1000
  }

  return flattenTaxBrackets(sortedBounds.reduce((acc, val, idx) => {
    acc.push([
      val,
      sortedBounds[idx+1],
      sumRateAt(val, firstBracket, secondBracket)
    ])
    return acc
  }, []))
}

/**
 * 🛋️ Instead of subtracting your standard deduction, craft a new tax bracket set with a standard deduction built in.
 *
 * @param {number} deductionCell - Amount to be deducted in the generated brackets.
 * @param {range} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number[][]} - Tax bracket with a 0% bracket for `deductionCell`.
 */
function appendDeductionToBracket(deductionCell, taxBracketsRange) {
  return flattenTaxBrackets(taxBracketsRange.reduce((accumulator, [threshold, width, rate], bracketIdx) => {
    if (bracketIdx === 0 && rate === 0) {
      return [[0, width + deductionCell, 0]]
    }
    accumulator.push([
      threshold + deductionCell,
      width && (width + deductionCell) || null,
      rate
    ])
    return accumulator
  }, [[0, deductionCell, 0]]))
}

/**
 * 🧱 Stack two tax brackets on a pivot.
 *
 * @param {number} pivotAmount - The amount to pivot between one bracket and the next.
 * @param {number[][]} bottomBracketsRange - Bottom range that includes 3 columns (threshold, width, rate) and variable rows.
 * @param {number[][]} topBracketsRange - Top range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number[][]} - Tax amounts by bracket.
 */
function stackTaxBrackets(pivotAmount, bottomBracketsRange, topBracketsRange) {
  const newBracket = []
  bottomBracketsRange.forEach(([threshold, width, rate]) => {
    if (threshold < pivotAmount) {
      newBracket.push([
        threshold,
        Math.min(pivotAmount, width || Math.pow(2, 40)),
        rate
      ])
    }
  })
  topBracketsRange.forEach(([threshold, width, rate]) => {
    const effectiveThreshold = Math.max(pivotAmount, threshold)
    const effectiveWidth = width || Math.pow(2, 40)

    const shouldAppend = effectiveThreshold !== width && (
      (threshold >= pivotAmount) || (pivotAmount <= effectiveWidth)
    )

    if (shouldAppend) {
      newBracket.push([
        effectiveThreshold,
        width,
        rate
      ])
    }
  })
  return newBracket
}

/**
 * 🏦 Calculate the tax amount based on a value and a range of tax brackets.
 *
 * @param {number} amountCell - Amount to apply to the tax bracket.
 * @param {number[][]} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number} - The calculated tax amount.
 */
function taxAmount(amountCell, taxBracketsRange) {
  const amount = taxBracketsRange.reduce((accumulator, [threshold, width, rate]) => {
    const effectiveWidth = Math.min(amountCell, width || Math.pow(2, 40))
    return accumulator + Math.max(0, effectiveWidth - threshold) * rate
  }, 0)

  return toMoney(amount)
}

/**
 * (PRIVATE) ☑️ List all tax totals into rows.
 * 
 * @param {number} amountCell - Amount to apply to the tax bracket.
 * @param {number[][]} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number[][]} - Tax amounts by bracket.
 */
function listTaxTotals(amountCell, taxBracketsRange) {
  return taxBracketsRange.reduce((accumulator, [threshold, width, rate]) => {
    accumulator.push([
      Math.max(
        0,
        Math.min(
          amountCell,
          width || Math.pow(2, 40),
        ) - threshold
      ) * rate
    ])
    return accumulator
  }, [])
}

/**
 * 🔣 Calculate the tax rate based on a value and a range of tax brackets.
 *
 * @param {number} amountCell - Amount to apply to the tax bracket.
 * @param {range} taxBracketsRange - A range that includes 3 columns (threshold, width, rate) and variable rows.
 *
 * @returns {number} - The calculated tax rate.
 */
function taxRate(amountCell, taxBracketsRange) {
  if (amountCell === 0) return 0
  return toRate(taxAmount(amountCell, taxBracketsRange) / amountCell)
}

/**
 * 🎯 Finds a target value within a range (min to max) by repeatedly applying a
 * callback function to the middle element and updating the range based on the
 * comparison result.
 * 
 * @param {number} min - Lowest possible number
 * @param {number} max - Biggest possible number
 * @param {fn} callback - Takes in a `value` and returns -1 when `value` is too small, 1 when value is too large, and 0 for just right.
 *
 * @returns {number} - The found value
 */
function binarySearch(min, max, callback, _max = 1_000) {
  if (min > max || _max <= 0) {
    return -1
  }
  const mid = Math.ceil(min + max) / 2
  const ret = callback(mid)
  if (ret === 0) {
    return mid
  } else if (ret > 0) {
    return binarySearch(min, mid, callback, _max - 1)
  } else {
    return binarySearch(mid, max, callback, _max - 1)
  }
}
function decimalBinarySearch(decimals, min, max, callback) {
  const magnitude = Math.pow(10, decimals)
  return binarySearch(min*magnitude, max*magnitude, (value) => {
    return callback(value / magnitude)
  }) / magnitude
}

/**
 * Rounds a number to 2 decimal places.
 *
 * @param {number} amount - The input amount to be rounded.
 * @returns {number} - The rounded number with two decimal places.
 */
function toMoney(amount) {
  const parsedAmount = parseFloat(amount);
  const roundedNumString = parsedAmount.toFixed(2);
  const roundedNum = parseFloat(roundedNumString);
  return roundedNum;
}

/**
 * Rounds a number to 4 decimal places.
 *
 * @param {number} amount - The input amount to be rounded.
 * @returns {number} - The rounded number with two decimal places.
 */
function toRate(amount) {
  const parsedAmount = parseFloat(amount);
  const roundedNumString = parsedAmount.toFixed(4);
  const roundedNum = parseFloat(roundedNumString);
  return roundedNum;
}

const { Withdraw, Portfolio, Stonk } = require('./portfolio')

module.exports = {
  Withdraw,
  Portfolio,
  Stonk,
  amountByRate,
  amountByRateWithStackedTax,
  appendDeductionToBracket,
  binarySearch,
  mergeTaxBrackets,
  decimalBinarySearch,
  flattenTaxBrackets,
  listTaxTotals,
  stackTaxBrackets,
  taxAmount,
  taxBasis,
  taxBasisFoundation,
  taxRate,
  complexAmountByRate,
}
