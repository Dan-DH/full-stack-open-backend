require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()
app.use(express.static('dist'))
app.use(cors())
app.use(express.json())

morgan.token('responseBody', function (req, res) {
  return JSON.stringify(req.body)
})
// app.use(morgan("tiny :responseBody"));
app.use(morgan(':method :url :responseBody'))

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/info', (request, response) => {
  Person.find({}).then(result =>
    response.send(
      `<p>Phonebook has info for ${
        result.length
      } people</p><p>${new Date()}</p>`
    )
  )
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(result => response.json(result))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  console.log('request', request.params.id)
  Person.findByIdAndDelete(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  Person.find({}).then(result => {
    const person = new Person({
      name,
      number,
    })

    person
      .save()
      .then(savedPerson => {
        response.json(savedPerson)
      })
      .catch(error => next(error))
  })
})

app.put('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndUpdate(
    request.params.id,
    { number: request.body.number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => {
      next(error)
    })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
