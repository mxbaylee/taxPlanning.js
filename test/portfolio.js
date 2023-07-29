const assert = require('node:assert')
const { Withdraw, Portfolio, Stonk } = require('../portfolio')

describe('Stonk', () => {
  describe('.ratio', () => {
    it('calculates correct ratio', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 60,
      })
      assert.equal(stonk.ratio, 0.4)
    })
    it('rounds to 3 significant digits', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 50,
      })
      assert.equal(stonk.ratio, 0.333)
    })
  })
  describe('.partialValue', () => {
    it('equates 10 shares to $10', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 50,
        shares: 150,
      })
      assert.equal(stonk.partialValue(10), 10)
    })
    it('equates 10 shares to $5', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 50,
        shares: 300,
      })
      assert.equal(stonk.partialValue(10), 5)
    })
  })
  describe('.partialGains', () => {
    it('equates 10 shares to $10', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 50,
        shares: 150,
      })
      assert.equal(stonk.partialGains(10), 3.333)
    })
    it('equates 10 shares to $5', () => {
      const stonk = new Stonk({
        value: 150,
        gains: 50,
        shares: 300,
      })
      assert.equal(stonk.partialGains(10), 1.667)
    })
  })
})

describe('Withdraw', () => {
  describe('.ratio', () => {
    it('partial stonk', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 5,
        shares: 1,
      }), 0.5)
      assert.equal(withdraw.ratio, 0.5)
    })
    it('single stonk', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 5,
        shares: 1,
      }), 1)
      assert.equal(withdraw.ratio, 0.5)
    })
    it('multi stonks', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 5,
        shares: 1,
      }))
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }))
      assert.equal(withdraw.ratio, 0.25)
    })
    it('partial multi stonks', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 5,
        shares: 1,
      }), 0.5)
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }), 0.75)
      assert.equal(withdraw.ratio, 0.2)
    })
  })
  describe('.value', () => {
    it('happy path', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }), 1)
      assert.equal(withdraw.value, 10)
    })
    it('partial share', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }), 0.5)
      assert.equal(withdraw.value, 5)
    })
    it('partial share with multiple shares', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 10,
      }), 0.5)
      assert.equal(withdraw.value, 0.5, 'Each stonk is worth $1, so 0.5 stonks is $0.50')
    })
    it('adds two stonks together', () => {
      const withdraw = new Withdraw()
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }), 0.5)
      withdraw.add(new Stonk({
        value: 10,
        gains: 0,
        shares: 1,
      }), 0.5)
      assert.equal(withdraw.value, 10, 'Both stonks are $10, total $20, and we take half of each, so $10')
    })
  })
})

describe('Portfolio', () => {
  it('.value', () => {
    const portfolio = new Portfolio([
      new Stonk({ value: 10, gains: 0 }),
      new Stonk({ value: 20, gains: 10 }),
      new Stonk({ value: 32, gains: 20 })
    ])
    assert.equal(portfolio.value, 62)
  })
  it('.gains', () => {
    const portfolio = new Portfolio([
      new Stonk({ value: 10, gains: 0 }),
      new Stonk({ value: 20, gains: 10 }),
      new Stonk({ value: 32, gains: 20 })
    ])
    assert.equal(portfolio.gains, 30)
  })
  it('.ratio', () => {
    const portfolio = new Portfolio([
      new Stonk({ value: 10, gains: 0 }),
      new Stonk({ value: 20, gains: 10 }),
      new Stonk({ value: 32, gains: 20 })
    ])
    assert.equal(portfolio.ratio, 0.484)
  })
  describe('.sortByRatio', () => {
    it('happy path', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0 }),
        new Stonk({ value: 20, gains: 10 }),
        new Stonk({ value: 32, gains: 20 })
      ])

      const sortedStonks = portfolio.sortByAbsDistanceFromRatio(0.5)

      assert.equal(sortedStonks[0].value, 20, 'first item is the second stonk')
      assert.equal(sortedStonks[1].value, 32, 'second item is the third stonk')
      assert.equal(sortedStonks[2].value, 10, 'third item is the first stonk')
    })
    it('complex path', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: -8, basis: 18 }),
        new Stonk({ value: 20, gains: 18, basis: 2 }),
        new Stonk({ value: 32, gains: 20, basis: 22 })
      ])

      assert.equal(portfolio.stonks[2].ratio, 0.625)
      assert.equal(portfolio.stonks[1].ratio, 0.9)
      assert.equal(portfolio.stonks[0].ratio, -0.8)

      const sortedStonks = portfolio.sortByAbsDistanceFromRatio(0.5)

      assert.equal(sortedStonks[0], portfolio.stonks[2], 'first assertion')
      assert.equal(sortedStonks[1], portfolio.stonks[1], 'second assertion')
      assert.equal(sortedStonks[2], portfolio.stonks[0], 'third assertion')
    })
  })
  describe('.withdraw', () => {
    it('returns the correct amount', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 5 }),
        new Stonk({ value: 20, gains: 10, shares: 10 }),
        new Stonk({ value: 32, gains: 20, shares: 16 })
      ])
      const withdraw = portfolio.withdraw(10, 1.0)
      assert.equal(withdraw.value, 10)
    })
    it('finds with multiple stonks', () => {
      // failing test
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 5 }),
        new Stonk({ value: 20, gains: 10, shares: 10 }),
        new Stonk({ value: 1, gains: 0, shares: 0.5 })
      ])
      const withdraw = portfolio.withdraw(30, 1.0)
      assert.equal(withdraw.value, 30)
    })
    it('picks the best single stonk', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 10 }),
        new Stonk({ value: 10, gains: 5, shares: 10 }),
      ])
      const withdraw = portfolio.withdraw(10, 1.0)
      assert.equal(withdraw.value, 10)
      assert.equal(withdraw.gains, 5)
    })
    it('throws when excess withdraws', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 10 }),
      ])
      assert.throws(() => {
        portfolio.withdraw(15)
      })
    })
    it('happy tax gain harvesting', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 10 }),
        new Stonk({ value: 10, gains: 5, shares: 10 }),
        new Stonk({ value: 10, gains: 5, shares: 10 }),
      ])
      const withdraw = portfolio.withdraw(20, 1.0)
      assert.equal(withdraw.value, 20)
      assert.equal(withdraw.gains, 10)
    })
    it('happy non-taxable event', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: 0, shares: 10 }),
        new Stonk({ value: 10, gains: 5, shares: 10 }),
        new Stonk({ value: 10, gains: 5, shares: 10 }),
      ])
      const withdraw = portfolio.withdraw(20, 0)
      assert.equal(withdraw.value, 20)
      assert.equal(withdraw.gains, 5)
    })
    it('happy tax loss harvesting', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: -10, shares: 10 }), // ratio: -1
        new Stonk({ value: 10, gains: 0, shares: 10 }), // ratio: 0.067
        new Stonk({ value: 10, gains: 8, shares: 10 }), // ratio: 0.8
      ])
      const withdraw = portfolio.withdraw(20, -1.0)
      assert.equal(withdraw.value, 20, 'value')
      assert.equal(withdraw.gains, -10, 'gains')
    })
    it('withdraws a partial stonk', () => {
      const portfolio = new Portfolio([
        new Stonk({ value: 10, gains: -10, shares: 10 }),
      ])
      const withdraw = portfolio.withdraw(5)
      assert.equal(withdraw.value, 5)
    })
  })
})
