const assert = require('node:assert')
const tp = require('../index')

const variables = {
  ordinaryIncome:     567_500.00,
  capitalGainsIncome:       0.00,
  californiaDeduction:  5_202.00,
  federalDeduction:    12_950.00,
}
variables.agi = variables.ordinaryIncome + variables.capitalGainsIncome
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
      variables.ordinaryIncome,
      tp.appendDeductionToBracket(
        variables.federalDeduction,
        federalInomeTaxes,
      ),
      tp.appendDeductionToBracket(
        variables.federalDeduction,
        tp.mergeTaxBrackets(
          federalCapGainsTax,
          federalNiit,
        )
      )
    )
    const actualAmount = tp.taxAmount(
      variables.agi,
      federalTaxBracket
    )
    const expectedAmount = 168_138.50
    assert.equal(actualAmount, expectedAmount)
  })
  it('can get state tax year values', () => {
    const stateTaxBrackets = tp.stackTaxBrackets(
      variables.ordinaryIncome,
      tp.appendDeductionToBracket(
        variables.californiaDeduction,
        californiaIncomeTax
      ),
      tp.appendDeductionToBracket(
        variables.californiaDeduction,
        californiaCapGainsTax
      )
    )
    const actualAmount = tp.taxAmount(
      variables.agi,
      stateTaxBrackets
    )
    const expectedAmount = 52_843.12
    assert.equal(actualAmount, expectedAmount)
  })
  it('can combine federal and state', () => {
    const federalTaxBracket = tp.stackTaxBrackets(
      variables.ordinaryIncome,
      tp.appendDeductionToBracket(
        variables.federalDeduction,
        federalInomeTaxes,
      ),
      tp.appendDeductionToBracket(
        variables.federalDeduction,
        tp.mergeTaxBrackets(
          federalCapGainsTax,
          federalNiit,
        )
      )
    )
    const stateTaxBrackets = tp.stackTaxBrackets(
      variables.ordinaryIncome,
      tp.appendDeductionToBracket(
        variables.californiaDeduction,
        californiaIncomeTax
      ),
      tp.appendDeductionToBracket(
        variables.californiaDeduction,
        californiaCapGainsTax
      )
    )
    const combinedTaxBrackets = tp.mergeTaxBrackets(
      federalTaxBracket,
      stateTaxBrackets,
    )
    const actualAmount = tp.taxAmount(
      variables.agi,
      combinedTaxBrackets
    )
    const expectedAmount = 220_981.62
    assert.equal(actualAmount, expectedAmount)
  })
  it('can be combined a second way', () => {
    variables.ordinaryIncome = 300_000

    const stackedByAuthority = tp.mergeTaxBrackets(
      // federal
      tp.stackTaxBrackets(
        variables.ordinaryIncome,
        tp.appendDeductionToBracket( // income taxes
          variables.federalDeduction,
          federalInomeTaxes,
        ),
        tp.appendDeductionToBracket( // capital gains taxes
          variables.federalDeduction,
          tp.mergeTaxBrackets(
            federalCapGainsTax,
            federalNiit,
          )
        )
      ),
      // state
      tp.stackTaxBrackets(
        variables.ordinaryIncome,
        tp.appendDeductionToBracket( // income taxes
          variables.californiaDeduction,
          californiaIncomeTax
        ),
        tp.appendDeductionToBracket( // capital gains taxes
          variables.californiaDeduction,
          californiaCapGainsTax
        )
      )
    )

    const stackedByType = tp.stackTaxBrackets(
      variables.ordinaryIncome,
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

    assert.deepEqual(stackedByType, stackedByAuthority)
  })
})
