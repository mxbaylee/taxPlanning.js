# 💰 Tax Planning

This toolchain is designed to assist individuals with long-term tax planning
strategies, such as a Roth conversion ladder and predicting tax liability over
their lifetime.

The API's are intentionally compatible with [Google Sheet App Scripts][gsas].

## 🧪 Examples

A comprehensive example of Federal and State tax bracket combinations exist
inside of `./test/fullTaxYearAmount.js`.

### 🏦 Tax Amount

Calculate the tax amount based on a value and a range of tax brackets.

```js
const tp = require('tax-planning.js')
const simpleTaxBracket = [
    [    0,  10_000, 0.00],
    [10_000, 25_000, 0.10],
    [25_000,   null, 0.20],
]
console.log(
    tp.taxAmount(30_000, simpleTaxBracket)
)
// => 2_500.00
```

### 🚕 Tax Basis

Given an amount, it'll return the basis that would result in `amount` if you included tax.

```js
const tp = require('tax-planning.js')
const simpleTaxBracket = [
    [    0,  10_000, 0.00],
    [10_000, 25_000, 0.10],
    [25_000,   null, 0.20],
]
console.log(
    tp.taxBasis(15_000, simpleTaxBracket)
)
// => 14_545.45
```

### 🛋️ Append Deduction to Bracket

Instead of subtracting your standard deduction, craft a new tax bracket set with a standard deduction built in.

```js
const tp = require('tax-planning.js')
const simpleTaxBracket = [
    [    0,  10_000, 0.00],
    [10_000, 25_000, 0.10],
    [25_000,   null, 0.20],
]
console.log(
    tp.appendDeductionToBracket(5_000, simpleTaxBracket)
)
/*
=> [
  [     0, 15_000, 0.00],
  [15_000, 30_000, 0.10],
  [30_000,   null, 0.20],
]
*/
```

### 🧲 Merge Tax Brackets

Merge two tax brackets into one bracket.

```js
const tp = require('tax-planning.js')
const simpleFederal = [
    [    0,  10_000, 0.00],
    [10_000, 25_000, 0.10],
    [25_000,   null, 0.20],
]
const simpleState = [
    [     0, 15_000, 0.01],
    [15_000, 25_000, 0.02],
    [25_000, 50_000, 0.03],
    [50_000,   null, 0.04],
]
console.log(
    tp.mergeTaxBrackets(simpleFederal, simpleState)
)
/*
=> [
    [     0, 10_000, 0.01],
    [10_000, 15_000, 0.11],
    [15_000, 25_000, 0.12],
    [25_000, 50_000, 0.23],
    [50_000,   null, 0.24],
]
*/
```

### 🧱 Stack Tax Brackets

Stack two tax brackets on a pivot. It's common to pivot on ordinary income,
while stack capital gains income on top.

```js
const tp = require('tax-planning.js')
const ordinaryIncome = 25_000
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
console.log(
    tp.stackTaxBrackets(
        ordinaryIncome,
        simpleIncome,
        simpleCapGains
    )
)
/*
=> [
    [     0, 15_000, 0.01],
    [15_000, 25_000, 0.02],
    [25_000,   null, 0.20],
]
*/
```

### 🚵 Full Tax Year

This demonstrates how you could combine multiple brackets into a single set,
which you can use to generate the tax amount for various scenarios.

[💡 View the full Example][example]

```js
const tp = require('tax-planning.js')

// snippet from `./test/fullYearTaxAmount.js`
const federalTaxBracket = tp.stackTaxBrackets(
  ordinaryIncome,
  tp.appendDeductionToBracket( federalDeduction,
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
```

[example]:test/fullYearTaxAmount.js
[gsas]:https://developers.google.com/sheets/api/quickstart/apps-script
