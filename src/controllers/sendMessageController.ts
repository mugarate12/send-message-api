import { Request, Response } from 'express'
import axios from 'axios'
import mysql from 'mysql2'
import momentTimezone from 'moment-timezone'
import 'moment/locale/pt-br'
import dotenv from 'dotenv'

dotenv.config()

export default class SendMessageController {
  private numbersAPI = [
    {
      api: 'zapi',
      number: '+1 (403) 907-9623', // zapi 5
      instance: '39F1FF4266DF607803C12E64B605930B',
      token: 'C5ED4E01942A43806A8D3CBC'
    },
    {
      api: 'zapi',
      number: '+1 (907) 600-7448', // zapi 3
      instance: '39EDC7A2B800B075F94302B607963117',
      token: 'A84F4C3D1377277A16BDFAEB'
    },
    {
      api: 'zapi',
      number: '+1 (506) 405-1182', // zapi nsei
      instance: '38B5BA1A2985704E0B7626452DC325CF',
      token: '799AB6B7AFD61A719EAABDE0'
    },
    {
      api: 'zapi',
      number: '+1 (251) 931-9880', //zapi 4
      instance: '39EE623D90E8A0B15E0102B607963117',
      token: 'D8E85EA882EC089D9EA9C93C'
    },
    {
      api: 'zapi',
      number: '+1 (251) 216 6593', //zapi img
      instance: '39C58C7820B4903735DF0E63F29971E4',
      token: 'B856A5BF9478A169B1786645'
    },
    // {
    //   api: 'utalk',
    //   number: '+55 11 93940-8062',
    //   instance: '39F1FF4266DF607803C12E64B605930B',
    //   token: 'C5ED4E01942A43806A8D3CBC'
    // },
  ]

  private formatNumber = (number: string) => {
    let formattedNumber = ''

    for (let index = 0; index < number.length; index++) {
      const numberLetter = number[index]

      if (numberLetter.search(/\d/) !== -1) {
        formattedNumber += numberLetter
      }
    }

    return formattedNumber
  }

  private configureAndGetConnection = async () => {
    // database settings
    const database_user = String(process.env.DATABASE_USER)
    const database_password = String(process.env.DATABASE_PASSWORD) //'N6btXue8HbseDV'
    const database_host = String(process.env.DATABASE_HOST)
    const database_name = 'notification_manager'
    const database_port = Number(process.env.DATABASE_PORT)

    let connection = mysql.createConnection({
      host: database_host,
      user: database_user,
      password: database_password,
      port: database_port
    })

    // create database if not exists
    await this.query(connection, `CREATE DATABASE IF NOT EXISTS ${database_name}`)
    await this.query(connection, `CREATE SCHEMA IF NOT EXISTS ${database_name}`)

    connection = mysql.createConnection({
      host: database_host,
      user: database_user,
      password: database_password,
      database: database_name,
      port: database_port
    })

    // await this.execute(connection, "SET NAMES 'utf8'")
    // await this.execute(connection, "SET character_set_connection='utf8'")
    // await this.execute(connection, "SET character_set_client='utf8'")
    // await this.execute(connection, "SET character_set_results='utf8'")

    return connection
  }

  private createNecessaryTables = async (connection: mysql.Connection) => {
    // // create necessary tables
    await this.query(connection, 'CREATE TABLE IF NOT EXISTS `notification_whatsapp` (`id` int(11) NOT NULL AUTO_INCREMENT, `grupo_winzap` varchar(300) DEFAULT NULL, `grupo_paulo` varchar(300) DEFAULT NULL, `qtd` int(6) DEFAULT NULL, `date_min` varchar(300) DEFAULT NULL, `update_date` int(11) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1')
    await this.query(connection, 'CREATE TABLE IF NOT EXISTS `notification_whatsapp_apis` (`id` int(11) NOT NULL AUTO_INCREMENT, `grupo_winzap` varchar(300) DEFAULT NULL, `celular_api` varchar(300) DEFAULT NULL, `qtd` int(6) DEFAULT NULL, `date_min` varchar(300) DEFAULT NULL, `update_date` int(11) NOT NULL, PRIMARY KEY (`id`), KEY `what_apis` (`grupo_winzap`,`celular_api`,`date_min`)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1')
  }

  // configuration to date
  // date have a format "YYYY-MM-DD HH:mm:ss"
  /**
   * @description return data in format YYYY-MM-DD
   */
  private getActualDayDate = () => {
    momentTimezone.locale('pt-br')
    const date = momentTimezone()
      .tz('America/Sao_Paulo')
      .format('YYYY-MM-DD HH:mm:ss')

    const dateDay = date.split(' ')[0]
    return dateDay
  }

  /**
   * @param {String} number api number
   * @param {String} receiverNumber number or group id to receive message
   * @param {String} dayDate property in format YYYY-MM-DD 
   */
  private saveSendApis = async (
    connection: mysql.Connection,
    number: string,
    receiverNumber: string,
    dayDate: string
  ) => {
    const formatNumber = `zapi - ${receiverNumber}`

    // cel api === formatNumber
    // get data to notification_apis
    const searchCountMessagesOfNumberAndApi = await this.query(connection, `SELECT * FROM notification_whatsapp_apis WHERE grupo_winzap = '${number}' and celular_api ='${formatNumber}' and date_min ='${dayDate}'`)
  
    //insert data if not exist row to this api, or update actual data
    if (Array.isArray(searchCountMessagesOfNumberAndApi) && searchCountMessagesOfNumberAndApi.length > 0) {
      await this.query(connection, `UPDATE notification_whatsapp_apis  SET qtd=qtd+1, update_date=UNIX_TIMESTAMP(NOW()) WHERE grupo_winzap = '${number}' and celular_api ='${formatNumber}'   and date_min ='${dayDate}'`)
    } else {
      await this.query(connection, `INSERT INTO notification_whatsapp_apis (grupo_winzap,qtd,date_min,update_date,celular_api) VALUES('${number}', 1, '${dayDate}', UNIX_TIMESTAMP(NOW()), '${formatNumber}')`)
    }
  }

  private getStatusToZApiInstance = async (instance: string, token: string) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/status`
    let status = false
    
    await axios.get<{
      connected: boolean,
      session: boolean,
      created: number,
      error: string, // You are already connected." || You are not connected."
      smartphoneConnected: boolean
    }>(url)
      .then(response => {
        const data = response.data
        
        if (data.connected && data.smartphoneConnected) {
          status = true
        }
      })
      .catch(error => {
        console.log(error)
      })

      return status
  }

  private sendMessageWithZApi = async (
    instance: string,
    token: string,

    phone: string, 
    message: string
  ) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
    const data = {
      phone,
      message
    }
    let result = false

    await axios.post(url, data)
      .then((r) => {
        result = true
      })
      .catch(error => {
        console.log(error)
      })

    return result
  }

  private sendImageWithZApi = async (
    instance: string,
    token: string,

    data: {
      phone: string,
      image: string,
      caption?: string
    }
  ) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-image`
    let result = false

    await axios.post(url, data)
      .then((r) => {
        result = true
      })
      .catch(error => {
        console.log(error)
      })

    return result
  }
  
  private sendLinkWithZApi = async (
    instance: string,
    token: string,

    data: {
      phone: string,
      message: string,
      image: string,
      linkUrl: string,
      title: string,
      linkDescription: string
    }
  ) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-link`
    let result = false

    await axios.post(url, data)
      .then((r) => {
        result = true
      })
      .catch(error => {
        console.log(error)
      })

    return result
  }
  
  private sendDocumentWithZApi = async (
    instance: string,
    token: string,

    data: {
      phone: string,
      document: string,
      extension: string,
      fileName: string
    }
  ) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-document/${data.extension}`
    let result = false

    await axios.post(url, { phone: data.phone, document: data.document, fileName: data.fileName })
      .then((r) => {
        result = true
      })
      .catch(error => {
        console.log(error)
      })

    return result
  }
  
  private sendVideoWithZApi = async (
    instance: string,
    token: string,

    data: {
      phone: string,
      video: string
    }
  ) => {
    const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-video`
    let result = false

    await axios.post(url, data)
      .then((r) => {
        result = true
      })
      .catch(error => {
        console.log(error)
      })

    return result
  }

  /**
   *  @param {String} receiverNumber number of user to receive message
   *  @param {String} message message to send to user
   *  @description send message using first avaible number with load balance
   */
  private sendMessage = async (
    receiverNumber: string,
    message: string,
    connection: mysql.Connection,
    dayDate: string
  ) => {
    for (let index = 0; index < this.numbersAPI.length; index++) {
      const numberAPI = this.numbersAPI[index]
      
      await this.saveSendApis(connection, numberAPI.number, receiverNumber, dayDate)
      const status = await this.getStatusToZApiInstance(this.numbersAPI[index].instance, this.numbersAPI[index].token)
      
      if (status) {
        const messageSent = await this.sendMessageWithZApi(
          this.numbersAPI[index].instance, 
          this.numbersAPI[index].token, 
          receiverNumber.includes('(') ? this.formatNumber(receiverNumber) : receiverNumber,
          message
        )
      
        if (messageSent) {
          break
        }
      }
    }
  }

  private sendImageAPI = async (
    connection: mysql.Connection,
    dayDate: string,

    data: {
      phone: string,
      image: string,
      caption?: string
    }
  ) => {
    for (let index = 0; index < this.numbersAPI.length; index++) {
      const numberAPI = this.numbersAPI[index]
      
      await this.saveSendApis(connection, numberAPI.number, data.phone, dayDate)
      const status = await this.getStatusToZApiInstance(this.numbersAPI[index].instance, this.numbersAPI[index].token)
      
      if (status) {
        const sent = await this.sendImageWithZApi(
          this.numbersAPI[index].instance,
          this.numbersAPI[index].token, 
          data
        )
      
        if (sent) {
          break
        }
      }
    }
  }
  
  private sendLinkAPI = async (
    connection: mysql.Connection,
    dayDate: string,

    data: {
      phone: string,
      message: string,
      image: string,
      linkUrl: string,
      title: string,
      linkDescription: string
    }
  ) => {
    for (let index = 0; index < this.numbersAPI.length; index++) {
      const numberAPI = this.numbersAPI[index]
      
      await this.saveSendApis(connection, numberAPI.number, data.phone, dayDate)
      const status = await this.getStatusToZApiInstance(this.numbersAPI[index].instance, this.numbersAPI[index].token)
      
      if (status) {
        const sent = await this.sendLinkWithZApi(
          this.numbersAPI[index].instance,
          this.numbersAPI[index].token, 
          data
        )
      
        if (sent) {
          break
        }
      }
    }
  }
  
  private sendDocumentAPI = async (
    connection: mysql.Connection,
    dayDate: string,

    data: {
      phone: string,
      document: string,
      extension: string,
      fileName: string
    }
  ) => {
    for (let index = 0; index < this.numbersAPI.length; index++) {
      const numberAPI = this.numbersAPI[index]
      
      await this.saveSendApis(connection, numberAPI.number, data.phone, dayDate)
      const status = await this.getStatusToZApiInstance(this.numbersAPI[index].instance, this.numbersAPI[index].token)
      
      if (status) {
        const sent = await this.sendDocumentWithZApi(
          this.numbersAPI[index].instance,
          this.numbersAPI[index].token, 
          data
        )
      
        if (sent) {
          break
        }
      }
    }
  }
  
  private sendVideoAPI = async (
    connection: mysql.Connection,
    dayDate: string,

    data: {
      phone: string,
      video: string
    }
  ) => {
    for (let index = 0; index < this.numbersAPI.length; index++) {
      const numberAPI = this.numbersAPI[index]
      
      await this.saveSendApis(connection, numberAPI.number, data.phone, dayDate)
      const status = await this.getStatusToZApiInstance(this.numbersAPI[index].instance, this.numbersAPI[index].token)
      
      if (status) {
        const sent = await this.sendVideoWithZApi(
          this.numbersAPI[index].instance,
          this.numbersAPI[index].token, 
          data
        )
      
        if (sent) {
          break
        }
      }
    }
  }

  private query = async (connection: mysql.Connection, sql: string) => {
    return await new Promise((resolve, reject) => {
      return connection.query(sql, (err, result, fields) => {
        if (err) reject(err)
        
        resolve(result)
      })
    })
  }
  
  private execute = async (connection: mysql.Connection, sql: string) => {
    return await new Promise((resolve, reject) => {
      return connection.execute(sql, (err, result, fields) => {
        if (err) reject(err)
        
        resolve(result)
      })
    })
  }

  private updateActualDate = async (connection: mysql.Connection, grupo: string, paulo: string, dateDay: string) => {
    // search by day
    const searchByDay = await this.query(
      connection, 
      `SELECT * FROM notification_whatsapp WHERE grupo_winzap = '${grupo}' AND grupo_paulo='${paulo}' and date_min ='${dateDay}'`
    )

    // update count
    if (Array.isArray(searchByDay) && searchByDay.length > 0) {
      await this.query(connection, `UPDATE notification_whatsapp SET qtd=qtd+1, update_date=UNIX_TIMESTAMP(NOW()) WHERE grupo_winzap = '${grupo}'  AND grupo_paulo= '${paulo}' and date_min ='${dateDay}'`)
    } else {
      await this.query(connection, `INSERT INTO notification_whatsapp (grupo_winzap,grupo_paulo,qtd,date_min,update_date) VALUES('${grupo}','${paulo}',1,'${dateDay}', UNIX_TIMESTAMP(NOW()))`)
    }
  }

  public sendText = async (req: Request, res: Response) => {
    const { msg, grupo } = req.body as { msg: string, grupo: string }
    const paulo = ''

    const connection = await this.configureAndGetConnection()
    
    await this.createNecessaryTables(connection)
    
    const dateDay = this.getActualDayDate()

    await this.updateActualDate(connection, grupo, paulo, dateDay)
    
    await this.sendMessage(grupo, msg, connection, dateDay)

    return res.status(200).json({
      message: 'mensagem enviada com sucesso!'
    })
  }

  public sendImage = async (req: Request, res: Response) => {
    const { msg, grupo, image } = req.body as { grupo: string, msg?: string, image: string }

    const connection = await this.configureAndGetConnection()
    
    await this.createNecessaryTables(connection)

    const dateDay = this.getActualDayDate()

    await this.updateActualDate(connection, grupo, '', dateDay)

    const isHaveMessage = !!msg
    if (isHaveMessage) {
      await this.sendImageAPI(connection, dateDay, { phone: grupo, image, caption: msg })
    } else {
      await this.sendImageAPI(connection, dateDay, { phone: grupo, image })
    }

    return res.status(200).json({
      message: 'imagem enviada com sucesso!'
    })
  }

  public sendLink = async (req: Request, res: Response) => {
    const { grupo, message, image, linkUrl, title, linkDescription } = req.body as {
      grupo: string,
      message: string,
      image: string,
      linkUrl: string,
      title: string,
      linkDescription: string
    }

    const haveLinkHttps = message.includes('https://')
    const haveLinkHttp = message.includes('http://') 
    
    if (haveLinkHttps || haveLinkHttp) {
      const connection = await this.configureAndGetConnection()
    
      await this.createNecessaryTables(connection)

      const dateDay = this.getActualDayDate()

      await this.updateActualDate(connection, grupo, '', dateDay)

      await this.sendLinkAPI(connection, dateDay, { phone: grupo, message, image, linkUrl, title, linkDescription })

      return res.status(200).json({
        message: 'link enviado com sucesso!'
      })
    } else {
      return res.status(400).json({
        error: {
          message: 'a mensagem do link precisa conter o link ao final da mensagem'
        }
      })
    }
  }

  public sendDocument = async (req: Request, res: Response) => {
    const { grupo, document, extension, fileName } = req.body as { 
      grupo: string, 
      document: string,
      extension: string, 
      fileName: string
    }

    const connection = await this.configureAndGetConnection()
    
    await this.createNecessaryTables(connection)

    const dateDay = this.getActualDayDate()

    await this.updateActualDate(connection, grupo, '', dateDay)

    await this.sendDocumentAPI(connection, dateDay, {
      phone: grupo,
      document,
      extension,
      fileName
    })

    return res.status(200).json({
      message: 'documento enviado com sucesso!'
    })
  }
  
  public sendVideo = async (req: Request, res: Response) => {
    const { grupo, video } = req.body as { 
      grupo: string, 
      video: string
    }

    const connection = await this.configureAndGetConnection()
    
    await this.createNecessaryTables(connection)

    const dateDay = this.getActualDayDate()

    await this.updateActualDate(connection, grupo, '', dateDay)

    await this.sendVideoAPI(connection, dateDay, {
      phone: grupo,
      video
    })

    return res.status(200).json({
      message: 'v??deo enviado com sucesso!'
    })
  }
}