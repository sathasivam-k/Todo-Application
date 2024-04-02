const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')
const app = express()

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasStatusAndPriorityProperty = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}
const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndPriorityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const searchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasStatusAndPriorityProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachData => outputResult(eachData)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachData => outputResult(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachData => outputResult(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachData => outputResult(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status};'`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachData => outputResult(eachData)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category};'`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachData => outputResult(eachData)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case searchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';'`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachData => outputResult(eachData)))
      break

    default:
      getTodoQuery = `SELECT * FROM todo`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachData => outputResult(eachData)))
  }
})

///GET by Id

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  data = await db.get(getTodoQuery)
  response.send(outputResult(data))
})

///get agenda
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(format(new Date(date), 'yyyy-MM-dd'))
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${newDate}'`
    data = await db.all(getTodoQuery)
    response.send(data.map(eachData => outputResult(eachData)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

/// Post todos

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, category, status, dueDate} = request.body
  if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const getTodoQuery = `
          INSERT INTO todo (id, todo, priority, category, status, due_date)
          VALUES ( ${id}, '${todo}', '${priority}', '${category}', '${status}', '${postNewDate}');`
          await db.run(getTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Todo DueDate')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
})
