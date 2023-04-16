const asciichart = require('asciichart')
const tp = require('../index')


// states without income or cap gain taxes:
// * washington
// * florida
// * tennessee

const california = {
  deduction: 5_202.00,
  incomeTax: [
    [    0,  10_099, 0.010],
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
    [    0,   8_932, 0.010],
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

const arkansas = {
  deduction: 2_200.00,
  incomeTax: [
    [    0, 4_300, 0.020],
    [4_300, 8_500, 0.040],
    [8_500,  null, 0.055],
  ],
  capitalGainsTax: [
    [    0, 4_300, 0.0100],
    [4_300, 8_500, 0.0200],
    [8_500,  null, 0.0275],
  ]
}

const missouri = {
  deduction: 12_950.00,
  incomeTax: [
    [    0,   111, 0.000],
    [  111, 1_121, 0.015],
    [1_121, 2_242, 0.020],
    [2_242, 3_363, 0.025],
    [3_363, 4_484, 0.030],
    [4_484, 5_605, 0.035],
    [5_605, 6_726, 0.040],
    [6_726, 7_847, 0.045],
    [7_847, 8_968, 0.050],
    [8_968,  null, 0.053],
  ],
  capitalGainsTax: [
    [    0,   111, 0.000],
    [  111, 1_121, 0.015],
    [1_121, 2_242, 0.020],
    [2_242, 3_363, 0.025],
    [3_363, 4_484, 0.030],
    [4_484, 5_605, 0.035],
    [5_605, 6_726, 0.040],
    [6_726, 7_847, 0.045],
    [7_847, 8_968, 0.050],
    [8_968,  null, 0.053],
  ]
}

const northCarolina = {
  deduction: 12_750.00,
  incomeTax: [
    [0, null, 0.049],
  ],
  capitalGainsTax: [
    [0, null, 0.049],
  ]
}

const generateIncomes = () => {
  const exampleIncomes = []
  const max = 100_000
  const step = 1_000

  for (let i = 0; i <= max; i += step) {
    exampleIncomes.push({
      capGainsIncome: 0,
      ordinaryIncome: i,
    });
  }
  return exampleIncomes
}
const generateTaxRatePoints = ({ deduction, incomeTax, capitalGainsTax }) => {
  const incomes = generateIncomes()
  return incomes.reduce((points, { ordinaryIncome, capGainsIncome }) => {
    const agi = ordinaryIncome + capGainsIncome
    const taxBracket = tp.appendDeductionToBracket(
      deduction,
      tp.stackTaxBrackets(
        ordinaryIncome,
        incomeTax,
        capitalGainsTax
      )
    )
    points.push(tp.taxAmount(agi, taxBracket))
    return points
  }, [])
}

console.log('\\ '.repeat(60))
console.log('📊', 'Charting 4 States Tax Bracket for 2022\n')

console.log(
  asciichart.plot(
    [
      generateTaxRatePoints(california),
      generateTaxRatePoints(arkansas),
      generateTaxRatePoints(missouri),
      generateTaxRatePoints(northCarolina),
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
        asciichart.magenta,
        asciichart.yellow,
    ] }
  ),
  '\n'
)

console.log('🧪', 'X = AGI', 'y = Tax Amount')
console.log(asciichart.blue + '■' + asciichart.reset, 'California')
console.log(asciichart.green + '■' + asciichart.reset, 'Arkansas')
console.log(asciichart.magenta + '■' + asciichart.reset, 'Missouri')
console.log(asciichart.yellow + '■' + asciichart.reset, 'North Carolina')
console.log('/ '.repeat(60))
