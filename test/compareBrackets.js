const asciichart = require('asciichart')
const tp = require('../index')

const single = {
  deduction: 5_202.00,
  incomeTax: [
    [      0,  10_099, 0.010],
    [ 10_099,  23_942, 0.020],
    [ 23_942,  37_788, 0.040],
    [ 37_788,  52_455, 0.060],
    [ 52_455,  66_295, 0.080],
    [ 66_295, 338_639, 0.093],
    [338_639, 406_364, 0.103],
    [406_364, 677_275, 0.113],
    [677_275,  null, 0.123]
  ],
  capitalGainsTax: [
    [      0,   8_932, 0.010],
    [  8_932,  21_175, 0.020],
    [ 21_175,  33_421, 0.040],
    [ 33_421,  46_394, 0.060],
    [ 46_394,  58_634, 0.080],
    [ 58_634, 299_508, 0.093],
    [299_508, 359_407, 0.103],
    [359_407, 599_012, 0.113],
    [599_012,  null, 0.123]
  ]
}

const married = {
  deduction: 10_404.00,
  incomeTax: [
    [        0,    20_198, 0.010],
    [   20_198,    47_844, 0.020],
    [   47_844,    75_576, 0.040],
    [   75_576,   104_910, 0.060],
    [  104_910,   132_590, 0.080],
    [  132_590,   677_278, 0.093],
    [  677_278,   812_728, 0.103], [  812_728, 1_354_500, 0.113],
    [1_354_500,      null, 0.123]
  ],
  capitalGainsTax: [
    [        0,    17_864, 0.010],
    [   17_864,    42_350, 0.020],
    [   42_350,    66_842, 0.040],
    [   66_842,    92_788, 0.060],
    [   92_788,   117_268, 0.080],
    [  117_268,   599_016, 0.093],
    [  599_016,   718_814, 0.103],
    [  718_814, 1_198_025, 0.113],
    [1_198_025,      null, 0.123]
  ]
}

const partnerMakes = 0.1 // 1.0 is no discrepency
const generateIncomes = () => {
  const incomes = []
  const max = 500_000
  const step = 5_000

  for (let i = 0; i <= max; i += step) {
    incomes.push({
      capGainsIncome: 0,
      ordinaryIncome: i,
    });
  }
  return incomes
}

const generateTaxRatePoints = ({ deduction, incomeTax, capitalGainsTax }, mode) => {
  const incomes = generateIncomes()
  return incomes.reduce((points, { ordinaryIncome, capGainsIncome }) => {
    const incomeMultipler = mode === 'married' ? 2 : 1
    const taxMultiplier = mode === 'single' ? 2 : 1
    if (mode === 'single') {
      const humanOneAgi = (ordinaryIncome + capGainsIncome)
      const taxBracketOne = tp.appendDeductionToBracket(
        deduction,
        tp.stackTaxBrackets(
          ordinaryIncome * incomeMultipler,
          incomeTax,
          capitalGainsTax
        )
      )
      const humanOneTax = tp.taxAmount(humanOneAgi, taxBracketOne)
      // partner
      const humanTwoAgi = (ordinaryIncome + capGainsIncome) * partnerMakes
      const taxBracketTwo = tp.appendDeductionToBracket(
        deduction,
        tp.stackTaxBrackets(
          ordinaryIncome * partnerMakes,
          incomeTax,
          capitalGainsTax
        )
      )
      const humanTwoTax = tp.taxAmount(humanTwoAgi, taxBracketTwo)
      points.push(humanOneTax + humanTwoTax)
    } else {
      const agi = (ordinaryIncome + capGainsIncome) * (1 + partnerMakes)
      const taxBracket = tp.appendDeductionToBracket(
        deduction,
        tp.stackTaxBrackets(
          ordinaryIncome * (1 + partnerMakes),
          incomeTax,
          capitalGainsTax
        )
      )
      points.push(tp.taxAmount(agi, taxBracket) * taxMultiplier)
    }
    return points
  }, [])
}

console.log('\\ '.repeat(60))
console.log('📊', 'Charting Single vs Married Tax Bracket for California 2022\n')

console.log(
  asciichart.plot(
    [
      generateTaxRatePoints(single, 'single'), // double taxes
      generateTaxRatePoints(married, 'married'), // double agi
    ],
    { height: 20,
      format: (number, _idx) => {
        const roundedNumber = Number(number).toFixed(2);
        const [integerPart, decimalPart] = roundedNumber.split('.');
        const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const formattedNumber = integerWithCommas + '.' + decimalPart;
        return formattedNumber.padStart(12, ' ');
      },
      colors: [
        asciichart.blue,
        asciichart.green,
    ] }
  ),
  '\n'
)

console.log('🧪', 'X = AGI', 'y = Tax Amount')
console.log(asciichart.blue + '■' + asciichart.reset, 'Single')
console.log(asciichart.green + '■' + asciichart.reset, 'Married')
console.log('/ '.repeat(60))
