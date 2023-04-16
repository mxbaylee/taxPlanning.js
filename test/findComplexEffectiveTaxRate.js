const assert = require('node:assert')
const tp = require('../index')

const variables = {
  californiaDeduction:  5_202.00,
  federalDeduction:    12_950.00,
}
const federalInomeTaxes = [
  [      0,  10_275, 0.10],
  [ 10_275,  41_775, 0.12],
  [ 41_775,  89_075, 0.22],
  [ 89_075, 170_050, 0.24],
  [170_050, 215_950, 0.32],
  [215_950, 539_900, 0.35],
  [539_900,    null, 0.37]
]
const federalCapGainsTax = [
  [      0,  41_675, 0.00],
  [ 41_675, 459_750, 0.15],
  [459_750,    null, 0.20]
]
const federalNiit = [
  [      0, 200_000, 0.000],
  [200_000,    null, 0.038]
]
const californiaIncomeTax = [
  [      0,  10_099, 0.010],
  [ 10_099,  23_942, 0.020],
  [ 23_942,  37_788, 0.040],
  [ 37_788,  52_455, 0.060],
  [ 52_455,  66_295, 0.080],
  [ 66_295, 338_639, 0.093],
  [338_639, 406_364, 0.103],
  [406_364, 677_275, 0.113],
  [677_275,    null, 0.123]
]
const californiaCapGainsTax = [
  [      0,   8_932, 0.010],
  [  8_932,  21_175, 0.020],
  [ 21_175,  33_421, 0.040],
  [ 33_421,  46_394, 0.060],
  [ 46_394,  58_634, 0.080],
  [ 58_634, 299_508, 0.093],
  [299_508, 359_407, 0.103],
  [359_407, 599_012, 0.113],
  [599_012,    null, 0.123]
]

const buildBracketFromIncome = (ordinaryIncome) => {
  return tp.stackTaxBrackets(
    ordinaryIncome,
    // income taxes
    tp.mergeTaxBrackets(
      tp.appendDeductionToBracket( // federal
        variables.federalDeduction,
        federalInomeTaxes,
      ),
      tp.appendDeductionToBracket( // state
        variables.californiaDeduction,
        californiaIncomeTax
      ),
    ),
    // capital gains taxes
    tp.mergeTaxBrackets(
      tp.appendDeductionToBracket( // federal
        variables.federalDeduction,
        tp.mergeTaxBrackets(
          federalCapGainsTax,
          federalNiit,
        )
      ),
      tp.appendDeductionToBracket( // state
        variables.californiaDeduction,
        californiaCapGainsTax
      )
    )
  )
}

/*
 * Given a known capital gains, and a target effective tax rate
 * This demonstrates how to find the amount of ordinary income
 * to withdraw to create the effective tax rate.
 *
 * As you withdraw more ordinary income, your capital gains could
 * be taxed at a higher rate, making this a moving target as you
 * increase your ordinary income.
 */
describe('Find complex Effective Tax Rate', () => {
  it('finds the ordinary income, given 30K cap gains, to get effective 20% rate', () => {
    const capitalGainsIncome = 30_000
    const maxEffectiveTaxRate = 0.20

    const ordinaryIncome = tp.binarySearch(0, 500_000, (ordinaryIncomeGuess) => {
      const agi = ordinaryIncomeGuess + capitalGainsIncome
      const taxBracket = buildBracketFromIncome(ordinaryIncomeGuess)
      const effectiveRate = tp.taxRate(agi, taxBracket)
      if (effectiveRate > maxEffectiveTaxRate) {
        return 1
      } else if (effectiveRate < maxEffectiveTaxRate) {
        return -1
      }
      return 0
    })

    const agi = capitalGainsIncome + ordinaryIncome
    const taxBracket = buildBracketFromIncome(ordinaryIncome)
    const actualEffectiveRate = tp.taxRate(agi, taxBracket)

    assert.equal(actualEffectiveRate, maxEffectiveTaxRate)
  })
})
