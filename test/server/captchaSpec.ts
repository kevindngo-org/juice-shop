/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { captchas } from '../../routes/captcha'
import { CaptchaModel } from '../../models/captcha'
const expect = chai.expect
chai.use(sinonChai)

// Independent reference implementation honouring multiplication precedence,
// used to assert the generated answer is arithmetically correct.
function referenceAnswer (expression: string): number {
  const products = expression.split(/(?=[+-])/).map((part) => {
    return part.split('*').reduce((acc, factor) => acc * Number(factor), 1)
  })
  return products.reduce((acc, value) => acc + value, 0)
}

describe('captcha', () => {
  let req: any
  let res: any
  let build: any

  beforeEach(() => {
    req = { app: { locals: { captchaId: 0 } } }
    res = { json: sinon.spy() }
    build = sinon.stub(CaptchaModel, 'build').returns({ async save () {} } as any)
  })

  afterEach(() => {
    build.restore()
  })

  it('should answer the generated arithmetic captcha correctly without using eval', async () => {
    for (let i = 0; i < 200; i++) {
      res.json.resetHistory()

      await captchas()(req, res)

      const captcha = res.json.firstCall.args[0]
      expect(captcha.captcha).to.match(/^\d+[*+-]\d+[*+-]\d+$/)
      expect(Number(captcha.answer)).to.equal(referenceAnswer(captcha.captcha))
    }
  })
})
