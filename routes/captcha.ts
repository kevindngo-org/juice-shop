/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { type Captcha } from '../data/types'
import { CaptchaModel } from '../models/captcha'

// Safely evaluates an arithmetic expression composed of the operators '*', '+'
// and '-', honouring multiplication precedence, without resorting to eval().
function evaluateExpression (terms: number[], operators: string[]): number {
  const values = [terms[0]]
  const additiveOperators: string[] = []
  for (let i = 0; i < operators.length; i++) {
    if (operators[i] === '*') {
      values[values.length - 1] *= terms[i + 1]
    } else {
      additiveOperators.push(operators[i])
      values.push(terms[i + 1])
    }
  }
  let result = values[0]
  for (let i = 0; i < additiveOperators.length; i++) {
    result = additiveOperators[i] === '+' ? result + values[i + 1] : result - values[i + 1]
  }
  return result
}

export function captchas () {
  return async (req: Request, res: Response) => {
    const captchaId = req.app.locals.captchaId++
    const operators = ['*', '+', '-']

    const firstTerm = Math.floor((Math.random() * 10) + 1)
    const secondTerm = Math.floor((Math.random() * 10) + 1)
    const thirdTerm = Math.floor((Math.random() * 10) + 1)

    const firstOperator = operators[Math.floor((Math.random() * 3))]
    const secondOperator = operators[Math.floor((Math.random() * 3))]

    const expression = firstTerm.toString() + firstOperator + secondTerm.toString() + secondOperator + thirdTerm.toString()
    const answer = evaluateExpression([firstTerm, secondTerm, thirdTerm], [firstOperator, secondOperator]).toString()

    const captcha = {
      captchaId,
      captcha: expression,
      answer
    }
    const captchaInstance = CaptchaModel.build(captcha)
    await captchaInstance.save()
    res.json(captcha)
  }
}

export const verifyCaptcha = () => (req: Request, res: Response, next: NextFunction) => {
  CaptchaModel.findOne({ where: { captchaId: req.body.captchaId } }).then((captcha: Captcha | null) => {
    if ((captcha != null) && req.body.captcha === captcha.answer) {
      next()
    } else {
      res.status(401).send(res.__('Wrong answer to CAPTCHA. Please try again.'))
    }
  }).catch((error: Error) => {
    next(error)
  })
}
