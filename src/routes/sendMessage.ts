import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {
  sendMessageController
} from './../controllers'

function sendMessage(routes: Router) {
  routes.post('/zapi/sendMessage', celebrate({
    [Segments.BODY]: Joi.object().keys({
      msg: Joi.string().required(),
      grupo: Joi.string().required() 
    })
  }), sendMessageController.send)
}

export default sendMessage
