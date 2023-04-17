const assert = require('node:assert')
const tp = require('../index')

const ordinaryIncome = 50_500.00
const capitalGainsIncome = 10_000.00
const agi = ordinaryIncome + capitalGainsIncome
const californiaDeduction = 5_202.00
const federalDeduction = 12_950

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

describe('Full Tax Year Calculations', () => {
  it('can get federal tax year values', () => {
    const federalTaxBracket = tp.stackTaxBrackets(
      ordinaryIncome,
      tp.appendDeductionToBracket(
        federalDeduction,
        federalInomeTaxes,
      ),
      tp.appendDeductionToBracket(
        federalDeduction,
        tp.mergeTaxBrackets(
          federalCapGainsTax,
          federalNiit,
        )
      )
    )
    const actualAmount = tp.taxAmount(
      agi,
      federalTaxBracket
    )
    const expectedAmount = 5_181.75
    assert.equal(actualAmount, expectedAmount)
  })
  it('can get state tax year values', () => {
    const stateTaxBrackets = tp.stackTaxBrackets(
      ordinaryIncome,
      tp.appendDeductionToBracket(
        californiaDeduction,
        californiaIncomeTax
      ),
      tp.appendDeductionToBracket(
        californiaDeduction,
        californiaCapGainsTax
      )
    )
    const actualAmount = tp.taxAmount(
      agi,
      stateTaxBrackets
    )
    const expectedAmount = 2_160.37
    assert.equal(actualAmount, expectedAmount)
  })
  it('can combine federal and state', () => {
    const federalTaxBracket = tp.stackTaxBrackets(
      ordinaryIncome,
      tp.appendDeductionToBracket(
        federalDeduction,
        federalInomeTaxes,
      ),
      tp.appendDeductionToBracket(
        federalDeduction,
        tp.mergeTaxBrackets(
          federalCapGainsTax,
          federalNiit,
        )
      )
    )
    const stateTaxBrackets = tp.stackTaxBrackets(
      ordinaryIncome,
      tp.appendDeductionToBracket(
        californiaDeduction,
        californiaIncomeTax
      ),
      tp.appendDeductionToBracket(
        californiaDeduction,
        californiaCapGainsTax
      )
    )
    const combinedTaxBrackets = tp.mergeTaxBrackets(
      federalTaxBracket,
      stateTaxBrackets,
    )
    const actualAmount = tp.taxAmount(
      agi,
      combinedTaxBrackets
    )
    const expectedAmount = 7_342.12
    assert.equal(actualAmount, expectedAmount)
  })
  it('can be combined a second way', () => {
    const localOrdinaryIncome = 300_000

    const stackedByAuthority = tp.mergeTaxBrackets(
      // federal
      tp.stackTaxBrackets(
        localOrdinaryIncome,
        tp.appendDeductionToBracket( // income taxes
          federalDeduction,
          federalInomeTaxes,
        ),
        tp.appendDeductionToBracket( // capital gains taxes
          federalDeduction,
          tp.mergeTaxBrackets(
            federalCapGainsTax,
            federalNiit,
          )
        )
      ),
      // state
      tp.stackTaxBrackets(
        localOrdinaryIncome,
        tp.appendDeductionToBracket( // income taxes
          californiaDeduction,
          californiaIncomeTax
        ),
        tp.appendDeductionToBracket( // capital gains taxes
          californiaDeduction,
          californiaCapGainsTax
        )
      )
    )

    const stackedByType = tp.stackTaxBrackets(
      localOrdinaryIncome,
      // income taxes
      tp.mergeTaxBrackets(
        tp.appendDeductionToBracket( // federal
          federalDeduction,
          federalInomeTaxes,
        ),
        tp.appendDeductionToBracket( // state
          californiaDeduction,
          californiaIncomeTax
        ),
      ),
      // capital gains taxes
      tp.mergeTaxBrackets(
        tp.appendDeductionToBracket( // federal
          federalDeduction,
          tp.mergeTaxBrackets(
            federalCapGainsTax,
            federalNiit,
          )
        ),
        tp.appendDeductionToBracket( // state
          californiaDeduction,
          californiaCapGainsTax
        )
      )
    )

    assert.deepEqual(stackedByType, stackedByAuthority)
  })
})
