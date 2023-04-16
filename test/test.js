const assert = require('node:assert')
const tp = require('../index')

describe('.taxAmount', () => {
  it('calculates basic amounts', () => {
    const simpleProgressiveTaxBracket = [
      [    0,  10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const assertions = [
      { input:      0.00, expected:     0.00 },
      { input:  5_000.00, expected:     0.00 },
      { input: 10_000.00, expected:     0.00 },
      { input: 14_206.90, expected:   420.69 },
      { input: 15_000.00, expected:   500.00 },
      { input: 20_000.00, expected: 1_000.00 },
      { input: 25_000.00, expected: 1_500.00 },
      { input: 30_000.00, expected: 2_500.00 },
      { input: 35_000.00, expected: 3_500.00 },
    ]

    return assertions.forEach(({ input, expected }) => {
      const actual = tp.taxAmount(input, simpleProgressiveTaxBracket)
      const failureString = `💣 Input: ${input}, Expected: ${expected}, Actual: ${actual}.`;
      assert.strictEqual(actual, expected, failureString)
    })
  })

  it('calculates realistic tax brackets', () => {
    const realisticBracket = [
      [      0,  10_099, 0.01],
      [ 10_099,  23_942, 0.02],
      [ 23_942,  37_788, 0.04],
      [ 37_788,  52_455, 0.06],
      [ 52_455,  66_295, 0.08],
      [ 66_295, 338_639, 0.09],
      [33_8639, 406_364, 0.10],
      [40_6364, 677_275, 0.11],
      [67_7275,    null, 0.12]
    ]
    const assertions = [
      { input:       0.00, expected:      0.00 },
      { input:   5_000.00, expected:     50.00 },
      { input:  25_013.00, expected:    420.69 },
      { input:  40_000.00, expected:  1_064.41 },
      { input:  60_000.00, expected:  2_415.31 },
      { input: 150_000.00, expected: 10_452.36 },
      { input: 400_000.00, expected: 33_565.97 },
      { input: 500_000.00, expected: 44_502.33 },
      { input: 800_000.00, expected: 78_729.58 },
    ]
    return assertions.forEach(({ input, expected }) => {
      const actual = tp.taxAmount(input, realisticBracket)
      const failureString = `💣 Input: ${input}, Expected: ${expected}, Actual: ${actual}.`;
      assert.strictEqual(actual, expected, failureString)
    })
  })
})

describe('.taxBasis', () => {
  it('calculates easy tax basis', () => {
    const simpleProgressiveTaxBracket = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const assertions = [
      { input:      0.00, expected:      0.00 },
      { input:  5_000.00, expected:  5_000.00 },
      { input: 10_000.00, expected: 10_000.00 },
      { input: 14_627.59, expected: 14_206.90 },
      { input: 15_000.00, expected: 14_545.45 },
      { input: 20_000.00, expected: 19_090.91 },
      { input: 25_000.00, expected: 23_636.36 },
      { input: 30_000.00, expected: 27_916.67 },
      { input: 35_000.00, expected: 32_083.33 },
    ]
    return assertions.forEach(({ input, expected }) => {
      const actual = tp.taxBasis(input, simpleProgressiveTaxBracket)
      const failureString = `💣 Input: ${input}, Expected: ${expected}, Actual: ${actual}.`;
      assert.strictEqual(actual, expected, failureString)
    })
  })
})

describe('.appendDeductionToBracket', () => {
  it('can append deductions to brackets', () => {
    const simpleProgressiveTaxBracket = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const deduction = 5_000
    const actual = tp.appendDeductionToBracket(deduction, simpleProgressiveTaxBracket)
    const expected = [
      [     0, 15_000, 0.00],
      [15_000, 30_000, 0.10],
      [30_000,   null, 0.20],
    ]
    assert.deepEqual(actual, expected)
  })
})

describe('.mergeTaxBrackets', () => {
  it('merges tax brackets', () => {
    const simpleFederal = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const simpleState = [
      [     0, 15_000, 0.01],
      [15_000, 25_000, 0.02],
      [25_000, 50_000, 0.03],
      [50_000,   null, 0.04],
    ]
    const expected = [
      [     0, 10_000, 0.01],
      [10_000, 15_000, 0.11],
      [15_000, 25_000, 0.12],
      [25_000, 50_000, 0.23],
      [50_000,   null, 0.24],
    ]
    const actual = tp.mergeTaxBrackets(simpleFederal, simpleState)
    assert.deepEqual(actual, expected)
  })

  it('merges tax brackets that both start with zero % brackets', () => {
    const simpleFederal = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const simpleState = [
      [     0, 15_000, 0.00],
      [15_000, 25_000, 0.01],
      [25_000, 50_000, 0.02],
      [50_000,   null, 0.03],
    ]
    const expected = [
      [     0, 10_000, 0.00],
      [10_000, 15_000, 0.10],
      [15_000, 25_000, 0.11],
      [25_000, 50_000, 0.22],
      [50_000,   null, 0.23],
    ]
    const actual = tp.mergeTaxBrackets(simpleFederal, simpleState)
    assert.deepEqual(actual, expected)
  })
})

describe('.stackTaxBrackets', () => {
  it('merges tax brackets that both start with zero % brackets', () => {
    const variables = {
      income:  25_000,
    }
    const simpleIncome = [
      [     0, 15_000, 0.01],
      [15_000, 25_000, 0.02],
      [25_000, 50_000, 0.03],
      [50_000,   null, 0.04],
    ]
    const simpleCapGains = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const expected = [
      [     0, 15_000, 0.01],
      [15_000, 25_000, 0.02],
      [25_000,   null, 0.20],
    ]
    const actual = tp.stackTaxBrackets(
      variables.income,
      simpleIncome,
      simpleCapGains
    )
    assert.deepEqual(actual, expected)
  })
  it('stacks at $0 income', () => {
    const variables = {
      income: 0,
    }
    const simpleIncome = [
      [     0, 15_000, 0.01],
      [15_000, 25_000, 0.02],
      [25_000, 50_000, 0.03],
      [50_000,   null, 0.04],
    ]
    const simpleCapGains = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const expected = [
      [     0, 10_000, 0.00],
      [10_000, 25_000, 0.10],
      [25_000,   null, 0.20],
    ]
    const actual = tp.stackTaxBrackets(
      variables.income,
      simpleIncome,
      simpleCapGains
    )
    assert.deepEqual(actual, expected)
  })
})

describe('protected.taxBasisFoundation', () => {
  it('calculates the foundation for a tax bracket', () => {
    const simpleProgressiveTaxBracket = [
      [    0,  15_000, 0.10],
      [15_000, 25_000, 0.20],
      [25_000, 50_000, 0.30],
      [50_000,   null, 0.40],
    ]
    const assertions = [
      { input: 0.10, expected:            16_500.00 },
      { input: 0.20, expected:            28_500.00 },
      { input: 0.30, expected:            61_000.00 },
      { input: 0.40, expected: 1_539_316_269_886.40 },
    ]

    return assertions.forEach(({ input, expected }) => {
      const actual = tp.taxBasisFoundation(input, simpleProgressiveTaxBracket)
      const failureString = `💣 Input: ${input}, Expected: ${expected}, Actual: ${actual}.`;
      assert.equal(actual, expected, failureString)
    })
  })
})
