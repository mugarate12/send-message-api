import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {
  sendMessageController
} from './../controllers'

function sendMessage(routes: Router) {
  // send text
  routes.post('/zapi/sendMessage', celebrate({
    [Segments.BODY]: Joi.object().keys({
      msg: Joi.string().required(),
      grupo: Joi.string().required()
    })
  }), sendMessageController.sendText)

  // send image
  routes.post('/zapi/sendImage', celebrate({
    [Segments.BODY]: Joi.object().keys({
      grupo: Joi.string().required(),
      image: Joi.string().required(),

      msg: Joi.string().optional()
    })
  }), sendMessageController.sendImage)
  
  // send link
  routes.post('/zapi/sendLink', celebrate({
    [Segments.BODY]: Joi.object().keys({
      phone: Joi.string().required(),
      message: Joi.string().required(),
      image: Joi.string().required(),
      linkUrl: Joi.string().required(),
      title: Joi.string().required(),
      linkDescription: Joi.string().required()
    })
  }), sendMessageController.sendLink)

  // send document
}

export default sendMessage
